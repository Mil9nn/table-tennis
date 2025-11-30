import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import { calculateStandings } from "@/services/tournamentService";
import {
  advanceWinnerInBracket,
  isTournamentComplete,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";

/**
 * Fetch matches by IDs
 */
export async function fetchMatches(matchIds: any[], lean = false) {
  const query = IndividualMatch.find({ _id: { $in: matchIds } });
  return lean ? query.lean() : query;
}

/**
 * Get all match IDs from tournament structure
 */
export function getAllMatchIds(tournament: any): any[] {
  if (tournament.useGroups) {
    return tournament.groups.flatMap((g: any) =>
      g.rounds.flatMap((r: any) => r.matches)
    );
  }
  return tournament.rounds.flatMap((r: any) => r.matches);
}

/**
 * Check tournament completion status
 */
export function getTournamentStatus(matches: any[]) {
  const allCompleted = matches.every((m: any) => m.status === "completed");
  const anyInProgress = matches.some((m: any) => m.status === "in_progress");

  if (allCompleted) return "completed";
  if (anyInProgress) return "in_progress";
  return null; // no status change
}

/**
 * Update tournament standings and status after a match completes
 */
export async function updateTournamentAfterMatch(match: any) {
  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    return;
  }

  // Check if this match is in the knockout bracket
  const isKnockoutMatch = tournament.bracket?.rounds?.some((round: any) =>
    round.matches.some(
      (m: any) => m.matchId?.toString() === match._id.toString()
    )
  );

  if (isKnockoutMatch) {
    await updateKnockoutBracket(tournament, match);
  } else if (
    tournament.format === "round_robin" ||
    tournament.format === "multi_stage"
  ) {
    await updateRoundRobinStandings(tournament);
  } else if (tournament.format === "knockout") {
    // Pure knockout tournament
    await updateKnockoutBracket(tournament, match);
  }
}

/**
 * Update standings for Round Robin tournaments
 */
export async function updateRoundRobinStandings(tournament: any) {
  const participantIds = tournament.participants.map((p: any) => p.toString());

  // CASE 1: Tournament with Groups
  if (tournament.useGroups && tournament.groups && tournament.groups.length > 0) {
    for (const group of tournament.groups) {
      // Fetch all matches for this group
      const groupMatchIds = group.rounds.flatMap((r: any) => r.matches);
      const matches = await fetchMatches(groupMatchIds, true);

      // Calculate standings using ITTF rules
      const standingsData = calculateStandings(
        group.participants.map((p: any) => p.toString()),
        matches as any,
        tournament.rules
      );

      // Update group standings
      group.standings = standingsData.map((s) => ({
        participant: s.participant,
        played: s.played,
        won: s.won,
        lost: s.lost,
        drawn: s.drawn,
        setsWon: s.setsWon,
        setsLost: s.setsLost,
        setsDiff: s.setsDiff,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDiff: s.pointsDiff,
        points: s.points,
        rank: s.rank,
        form: s.form,
        headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
      }));
    }

    // Generate overall standings from group winners
    const advancePerGroup = tournament.advancePerGroup || 2;
    const qualifiers: any[] = [];

    tournament.groups.forEach((group: any) => {
      const topN = group.standings.slice(0, advancePerGroup);
      qualifiers.push(...topN.map((q: any) => ({
        ...q,
        headToHead: q.headToHead || {},
      })));
    });

    tournament.standings = qualifiers.map((q: any, idx: number) => ({
      ...q,
      rank: idx + 1,
    }));
  }
  // CASE 2: Single Round Robin (no groups)
  else {
    const roundMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await fetchMatches(roundMatchIds, true);

    const standingsData = calculateStandings(
      participantIds,
      matches as any,
      tournament.rules
    );

    tournament.standings = standingsData.map((s) => ({
      participant: s.participant,
      played: s.played,
      won: s.won,
      lost: s.lost,
      drawn: s.drawn,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      setsDiff: s.setsDiff,
      pointsScored: s.pointsScored,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.pointsDiff,
      points: s.points,
      rank: s.rank,
      form: s.form,
      headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
    }));
  }

  // Update round completion status
  const allMatchIds = getAllMatchIds(tournament);
  const allMatches = await fetchMatches(allMatchIds, true);
  const matchMap = new Map(allMatches.map((m: any) => [m._id.toString(), m]));

  // Update round completion for groups
  if (tournament.useGroups && tournament.groups) {
    for (const group of tournament.groups) {
      for (const round of group.rounds || []) {
        const roundMatches = round.matches.map((m: any) => matchMap.get(m.toString()));
        round.completed = roundMatches.every((m: any) => m && m.status === "completed");
      }
    }
  }

  // Update round completion for single round-robin
  if (tournament.rounds && !tournament.useGroups) {
    for (const round of tournament.rounds) {
      const roundMatches = round.matches.map((m: any) => matchMap.get(m.toString()));
      round.completed = roundMatches.every((m: any) => m && m.status === "completed");
    }
  }

  // Check if all rounds are completed and update tournament status
  const newStatus = getTournamentStatus(allMatches);

  if (newStatus && tournament.status !== newStatus) {
    tournament.status = newStatus;
  }

  await tournament.save();
}

/**
 * Update knockout bracket and advance winner
 */
export async function updateKnockoutBracket(tournament: any, match: any) {
  if (!tournament.bracket) {
    return;
  }

  // Find winner and loser from match
  const winnerId =
    match.winnerSide === "side1"
      ? match.participants[0]
      : match.participants[1];
  const loserId =
    match.winnerSide === "side1"
      ? match.participants[1]
      : match.participants[0];

  // Find the bracket match position for this match
  let bracketPosition: number | null = null;
  let currentRound: any = null;

  for (const round of tournament.bracket.rounds) {
    const bracketMatch = round.matches.find(
      (m: any) => m.matchId?.toString() === match._id.toString()
    );
    if (bracketMatch) {
      bracketPosition = bracketMatch.bracketPosition;
      currentRound = round;
      break;
    }
  }

  if (bracketPosition === null) {
    return;
  }

  // Update bracket with winner
  const updatedBracket = advanceWinnerInBracket(
    tournament.bracket,
    bracketPosition,
    new mongoose.Types.ObjectId(winnerId),
    new mongoose.Types.ObjectId(loserId)
  );

  tournament.bracket = updatedBracket;

  // Check if tournament is complete
  if (isTournamentComplete(updatedBracket)) {
    tournament.status = "completed";
  } else if (tournament.status === "upcoming") {
    tournament.status = "in_progress";
  }

  // Create next round matches if current round is complete
  if (
    currentRound?.completed &&
    currentRound.roundNumber < updatedBracket.rounds.length
  ) {
    const nextRound = updatedBracket.rounds[currentRound.roundNumber];

    for (const bracketMatch of nextRound.matches) {
      // Skip if match already exists
      if (bracketMatch.matchId) continue;

      // Check if both participants are determined
      const p1Id = bracketMatch.participant1.participantId;
      const p2Id = bracketMatch.participant2.participantId;

      if (!p1Id || !p2Id) {
        continue;
      }

      // Create the match
      const newMatch = await IndividualMatch.create({
        tournament: tournament._id,
        matchCategory: "individual",
        matchType: tournament.matchType,
        numberOfSets: tournament.rules.setsPerMatch,
        participants: [p1Id, p2Id],
        status: "scheduled",
        games: [],
      });

      bracketMatch.matchId = newMatch._id;
    }
  }

  await tournament.save();
}




