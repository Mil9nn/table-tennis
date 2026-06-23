import mongoose from "mongoose";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import TournamentStandings from "@/models/TournamentStandings";
import BracketState from "@/models/BracketState";
import { mapLikeToRecord, toIdString } from "./profileStatsService";

type MatchStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
};

function getBracketWinner(
  bracket: {
    completed?: boolean;
    rounds?: Array<{ matches: Array<{ winner?: string | null }> }>;
  } | null
): string | null {
  if (!bracket?.completed || !bracket.rounds?.length) return null;
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound?.matches?.[0];
  return finalMatch?.winner || null;
}

function computeMatchStats(matches: any[], userIdStr: string): MatchStats {
  let wins = 0;
  let losses = 0;
  let setsWon = 0;
  let setsLost = 0;
  let pointsScored = 0;
  let pointsConceded = 0;

  for (const match of matches) {
    const participantIds = (match.participants || []).map((p: unknown) =>
      toIdString(p)
    );
    const isSide1 = participantIds[0] === userIdStr;

    const isWin =
      toIdString(match.winnerId) === userIdStr ||
      (match.winnerSide === "side1" && isSide1) ||
      (match.winnerSide === "side2" && !isSide1);

    if (isWin) wins++;
    else losses++;

    const setsById = mapLikeToRecord(match.finalScore?.setsById);
    if (Object.keys(setsById).length > 0) {
      const userSets = setsById[userIdStr] || 0;
      setsWon += userSets;
      for (const [participantId, sets] of Object.entries(setsById)) {
        if (participantId !== userIdStr) setsLost += sets;
      }
    } else if (match.finalScore) {
      const userSide = isSide1 ? "side1" : "side2";
      setsWon += match.finalScore[`${userSide}Sets`] || 0;
      setsLost +=
        match.finalScore[isSide1 ? "side2Sets" : "side1Sets"] || 0;
    }

    for (const game of match.games || []) {
      const scoresById = mapLikeToRecord(game.scoresById);
      if (Object.keys(scoresById).length > 0) {
        pointsScored += scoresById[userIdStr] || 0;
        for (const [participantId, score] of Object.entries(scoresById)) {
          if (participantId !== userIdStr) pointsConceded += score;
        }
      } else if (isSide1) {
        pointsScored += game.side1Score || 0;
        pointsConceded += game.side2Score || 0;
      } else {
        pointsScored += game.side2Score || 0;
        pointsConceded += game.side1Score || 0;
      }
    }
  }

  return {
    matchesPlayed: matches.length,
    wins,
    losses,
    setsWon,
    setsLost,
    pointsScored,
    pointsConceded,
  };
}

function resolvePosition(
  tournament: { format?: string; status?: string },
  userIdStr: string,
  standingsRecords: any[],
  bracket: { completed?: boolean; rounds?: Array<{ matches: Array<{ winner?: string | null }> }> } | null
): number | string | null {
  for (const record of standingsRecords) {
    const row = record.rows?.find(
      (r: { participantId?: unknown; rank?: number }) =>
        toIdString(r.participantId) === userIdStr
    );
    if (row?.rank) return row.rank;
  }

  if (
    (tournament.format === "knockout" || tournament.format === "hybrid") &&
    tournament.status === "completed"
  ) {
    const winner = getBracketWinner(bracket);
    if (winner === userIdStr) return 1;
  }

  return null;
}

export async function buildTournamentStatsForUser(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const userIdStr = userObjectId.toString();

  const [participantTournaments, matchTournamentIds] = await Promise.all([
    Tournament.find({ participants: userObjectId }).sort({ startDate: -1 }).lean(),
    IndividualMatch.distinct("tournament", {
      participants: userObjectId,
      tournament: { $ne: null },
    }),
  ]);

  const tournamentById = new Map<string, Record<string, unknown>>();
  for (const tournament of participantTournaments) {
    tournamentById.set(toIdString(tournament._id), tournament);
  }

  const missingIds = matchTournamentIds
    .map((id) => toIdString(id))
    .filter((id) => id && !tournamentById.has(id));

  if (missingIds.length > 0) {
    const extraTournaments = await Tournament.find({
      _id: { $in: missingIds },
    }).lean();
    for (const tournament of extraTournaments) {
      tournamentById.set(toIdString(tournament._id), tournament);
    }
  }

  const tournaments = Array.from(tournamentById.values()).sort(
    (a, b) =>
      new Date(String(b.startDate)).getTime() -
      new Date(String(a.startDate)).getTime()
  );

  const tournamentIds = tournaments.map((t) => t._id);

  const [allMatches, standingsRecords, bracketStates] = await Promise.all([
    tournamentIds.length
      ? IndividualMatch.find({
          tournament: { $in: tournamentIds },
          participants: userObjectId,
          status: "completed",
        }).lean()
      : Promise.resolve([]),
    tournamentIds.length
      ? TournamentStandings.find({ tournament: { $in: tournamentIds } }).lean()
      : Promise.resolve([]),
    tournamentIds.length
      ? BracketState.find({ tournament: { $in: tournamentIds } }).lean()
      : Promise.resolve([]),
  ]);

  const matchesByTournament = new Map<string, any[]>();
  for (const match of allMatches) {
    const tournamentId = toIdString(match.tournament);
    if (!matchesByTournament.has(tournamentId)) {
      matchesByTournament.set(tournamentId, []);
    }
    matchesByTournament.get(tournamentId)!.push(match);
  }

  const standingsByTournament = new Map<string, any[]>();
  for (const record of standingsRecords) {
    const tournamentId = toIdString(record.tournament);
    if (!standingsByTournament.has(tournamentId)) {
      standingsByTournament.set(tournamentId, []);
    }
    standingsByTournament.get(tournamentId)!.push(record);
  }

  const bracketByTournament = new Map<string, any>();
  for (const bracket of bracketStates) {
    bracketByTournament.set(toIdString(bracket.tournament), bracket);
  }

  const tournamentStats = tournaments.map((tournament) => {
    const tournamentId = toIdString(tournament._id);
    const matches = matchesByTournament.get(tournamentId) || [];
    const matchStats = computeMatchStats(matches, userIdStr);
    const position = resolvePosition(
      tournament,
      userIdStr,
      standingsByTournament.get(tournamentId) || [],
      bracketByTournament.get(tournamentId) || null
    );

    return {
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        format: tournament.format,
        category: tournament.category,
        matchType: tournament.matchType,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        city: tournament.city,
        venue: tournament.venue,
        totalParticipants: Array.isArray(tournament.participants)
          ? tournament.participants.length
          : 0,
      },
      stats: {
        matchesPlayed: matchStats.matchesPlayed,
        wins: matchStats.wins,
        losses: matchStats.losses,
        winRate:
          matchStats.matchesPlayed > 0
            ? (matchStats.wins / matchStats.matchesPlayed) * 100
            : 0,
        setsWon: matchStats.setsWon,
        setsLost: matchStats.setsLost,
        setsDiff: matchStats.setsWon - matchStats.setsLost,
        pointsScored: matchStats.pointsScored,
        pointsConceded: matchStats.pointsConceded,
        pointsDiff: matchStats.pointsScored - matchStats.pointsConceded,
        position,
      },
    };
  });

  const totalTournaments = tournamentStats.length;
  const completedTournaments = tournamentStats.filter(
    (t) => t.tournament.status === "completed"
  ).length;
  const ongoingTournaments = tournamentStats.filter(
    (t) => t.tournament.status === "in_progress"
  ).length;
  const upcomingTournaments = tournamentStats.filter(
    (t) => t.tournament.status === "upcoming"
  ).length;

  const totalMatches = tournamentStats.reduce(
    (sum, t) => sum + t.stats.matchesPlayed,
    0
  );
  const totalWins = tournamentStats.reduce((sum, t) => sum + t.stats.wins, 0);
  const totalLosses = tournamentStats.reduce(
    (sum, t) => sum + t.stats.losses,
    0
  );

  const tournamentWins = tournamentStats.filter(
    (t) =>
      t.tournament.status === "completed" && t.stats.position === 1
  ).length;

  const finalsReached = tournamentStats.filter(
    (t) =>
      t.tournament.status === "completed" &&
      typeof t.stats.position === "number" &&
      t.stats.position > 0 &&
      t.stats.position <= 2
  ).length;

  const semifinalsReached = tournamentStats.filter(
    (t) =>
      t.tournament.status === "completed" &&
      typeof t.stats.position === "number" &&
      t.stats.position > 0 &&
      t.stats.position <= 3
  ).length;

  const podiumFinishes = tournamentStats.filter(
    (t) =>
      typeof t.stats.position === "number" &&
      t.stats.position > 0 &&
      t.stats.position <= 3
  ).length;

  return {
    overview: {
      totalTournaments,
      tournamentsPlayed: totalTournaments,
      completedTournaments,
      ongoingTournaments,
      upcomingTournaments,
      tournamentWins,
      tournamentsWon: tournamentWins,
      finalsReached,
      semifinalsReached,
      podiumFinishes,
      totalMatches,
      totalWins,
      totalLosses,
      winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
    },
    byFormat: {
      round_robin: tournamentStats.filter(
        (t) => t.tournament.format === "round_robin"
      ).length,
      knockout: tournamentStats.filter(
        (t) => t.tournament.format === "knockout"
      ).length,
      hybrid: tournamentStats.filter((t) => t.tournament.format === "hybrid")
        .length,
    },
    byCategory: {
      individual: tournamentStats.filter(
        (t) => t.tournament.category === "individual"
      ).length,
      team: tournamentStats.filter((t) => t.tournament.category === "team")
        .length,
    },
    tournaments: tournamentStats,
  };
}
