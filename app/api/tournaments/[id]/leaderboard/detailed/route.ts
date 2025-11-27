import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";

interface DetailedPlayerStats {
  participant: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  standing: {
    rank: number;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    points: number;
    form: string[];
  };
  advancedStats: {
    winRate: number;
    setsWinRate: number;
    pointsPerMatch: number;
    avgPointsScored: number;
    avgPointsConceded: number;
    avgSetDifferential: number;
    currentStreak: number;
    longestWinStreak: number;
    dominanceRating: number;
  };
  qualificationInfo?: {
    status: "qualified" | "eliminated" | "in_contention" | "pending";
    fromGroup?: string;
    groupRank?: number;
    advancementPosition?: number;
  };
  matchHistory: {
    matchId: string;
    opponent: {
      _id: string;
      username: string;
      fullName?: string;
    };
    result: "win" | "loss" | "draw";
    score: string;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
    date?: Date;
    roundNumber?: number;
    groupId?: string;
  }[];
  headToHead: {
    opponentId: string;
    opponent: {
      username: string;
      fullName?: string;
    };
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
  }[];
  seedingInfo?: {
    seedNumber: number;
    seedingRank?: number;
    seedingPoints?: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: tournamentId } = await params;
    const tournament = await Tournament.findById(tournamentId)
      .populate("participants", "username fullName profileImage")
      .lean() as any;

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Fetch all matches for this tournament
    const matches = await IndividualMatch.find({
      tournament: tournamentId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean() as any[];

    // ============================================================================
    // STEP 1: Determine final placement from knockout bracket
    // ============================================================================
    const bracketPlacements = new Map<string, number>();

    if (tournament.bracket?.rounds && tournament.bracket.rounds.length > 0) {
      const rounds = tournament.bracket.rounds;
      const finalRound = rounds[rounds.length - 1];

      // Find the final match
      const finalMatch = finalRound.matches?.[0];

      if (finalMatch?.completed) {
        // 1st place: Winner of final
        if (finalMatch.winner) {
          bracketPlacements.set(finalMatch.winner.toString(), 1);
        }

        // 2nd place: Loser of final
        if (finalMatch.loser) {
          bracketPlacements.set(finalMatch.loser.toString(), 2);
        }
      }

      // 3rd place: Check for 3rd place match or semifinal losers
      if (rounds.length > 1) {
        const semifinalRound = rounds[rounds.length - 2];

        // Check if there's a 3rd place match
        const thirdPlaceMatch = finalRound.matches?.find((m: any) =>
          m.bracketPosition === tournament.bracket?.thirdPlaceMatchPosition
        );

        if (thirdPlaceMatch?.completed) {
          // 3rd place match exists
          if (thirdPlaceMatch.winner) {
            bracketPlacements.set(thirdPlaceMatch.winner.toString(), 3);
          }
          if (thirdPlaceMatch.loser) {
            bracketPlacements.set(thirdPlaceMatch.loser.toString(), 4);
          }
        } else {
          // No 3rd place match, semifinal losers are tied 3rd
          let thirdPlaceRank = 3;
          semifinalRound.matches?.forEach((match: any) => {
            if (match.completed && match.loser && !bracketPlacements.has(match.loser.toString())) {
              bracketPlacements.set(match.loser.toString(), thirdPlaceRank);
            }
          });
        }
      }

      // Remaining placements: Based on elimination round
      // Quarterfinal losers = 5th-8th, Round of 16 losers = 9th-16th, etc.
      for (let i = rounds.length - 3; i >= 0; i--) {
        const round = rounds[i];
        const matchesInRound = round.matches?.length || 0;
        const baseRank = bracketPlacements.size + 1;

        round.matches?.forEach((match: any) => {
          if (match.completed && match.loser && !bracketPlacements.has(match.loser.toString())) {
            bracketPlacements.set(match.loser.toString(), baseRank);
          }
        });
      }
    }

    // ============================================================================
    // STEP 2: Build detailed stats for each participant
    // ============================================================================
    const detailedStats: DetailedPlayerStats[] = [];

    for (const participant of tournament.participants || []) {
      const participantId = participant._id.toString();

      // Get bracket placement
      const bracketRank = bracketPlacements.get(participantId);

      // Skip participants who didn't reach knockout stage
      if (!bracketRank) continue;

      // Get group stage standing (for qualification info)
      const groupStanding = tournament.standings?.find(
        (s: any) => s.participant.toString() === participantId
      );

      // Calculate overall stats from ALL matches (group + knockout)
      const participantMatches = matches
        .filter((match: any) =>
          match.participants.some((p: any) => p._id.toString() === participantId)
        )
        .sort((a: any, b: any) => {
          // Sort chronologically: oldest first using createdAt (timestamps: true in schema)
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });

      let standing = {
        rank: bracketRank,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        setsWon: 0,
        setsLost: 0,
        setsDiff: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDiff: 0,
        points: 0,
        form: [] as string[],
      };

      // Calculate stats from all matches (group + knockout combined)
      // Matches are now in chronological order
      participantMatches.forEach((match: any, idx: number) => {
        const participantIndex = match.participants.findIndex(
          (p: any) => p._id.toString() === participantId
        );
        const side = participantIndex === 0 ? "side1" : "side2";
        const opponentSide = side === "side1" ? "side2" : "side1";

        standing.played++;

        const setsWon =
          side === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;
        const setsLost =
          opponentSide === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;

        standing.setsWon += setsWon;
        standing.setsLost += setsLost;

        // Calculate points from games
        let pointsScored = 0;
        let pointsConceded = 0;
        match.games?.forEach((game: any) => {
          if (side === "side1") {
            pointsScored += game.side1Score || 0;
            pointsConceded += game.side2Score || 0;
          } else {
            pointsScored += game.side2Score || 0;
            pointsConceded += game.side1Score || 0;
          }
        });

        standing.pointsScored += pointsScored;
        standing.pointsConceded += pointsConceded;

        // Determine result
        if (match.winnerSide === side) {
          standing.won++;
          standing.points += tournament.rules?.pointsForWin || 1;
          standing.form.push("W");
        } else if (match.winnerSide === opponentSide) {
          standing.lost++;
          standing.points += tournament.rules?.pointsForLoss || 0;
          standing.form.push("L");
        }
      });

      standing.setsDiff = standing.setsWon - standing.setsLost;
      standing.pointsDiff = standing.pointsScored - standing.pointsConceded;

      // Show all match results (no limit)

      if (standing.played === 0) continue;

      // Calculate match history (already have participantMatches from above)
      const matchHistory = participantMatches.map((match: any) => {
        const participantIndex = match.participants.findIndex(
          (p: any) => p._id.toString() === participantId
        );
        const opponentIndex = participantIndex === 0 ? 1 : 0;
        const opponent = match.participants[opponentIndex];

        const side = participantIndex === 0 ? "side1" : "side2";
        const opponentSide = side === "side1" ? "side2" : "side1";

        const setsWon =
          side === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;
        const setsLost =
          opponentSide === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;

        // Calculate points from games
        let pointsScored = 0;
        let pointsConceded = 0;
        match.games?.forEach((game: any) => {
          if (side === "side1") {
            pointsScored += game.side1Score || 0;
            pointsConceded += game.side2Score || 0;
          } else {
            pointsScored += game.side2Score || 0;
            pointsConceded += game.side1Score || 0;
          }
        });

        let result: "win" | "loss" | "draw";
        if (setsWon > setsLost) result = "win";
        else if (setsWon < setsLost) result = "loss";
        else result = "draw";

        return {
          matchId: match._id.toString(),
          opponent: {
            _id: opponent._id.toString(),
            username: opponent.username,
            fullName: opponent.fullName,
          },
          result,
          score: `${setsWon}-${setsLost}`,
          setsWon,
          setsLost,
          pointsScored,
          pointsConceded,
          date: match.scheduledTime,
          roundNumber: match.roundNumber,
          groupId: match.groupId,
        };
      });

      // Calculate head-to-head records
      const h2hMap = new Map<
        string,
        {
          opponent: any;
          matches: number;
          wins: number;
          losses: number;
          draws: number;
          setsWon: number;
          setsLost: number;
          pointsScored: number;
          pointsConceded: number;
        }
      >();

      matchHistory.forEach((match) => {
        const opponentId = match.opponent._id;
        if (!h2hMap.has(opponentId)) {
          h2hMap.set(opponentId, {
            opponent: match.opponent,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            setsWon: 0,
            setsLost: 0,
            pointsScored: 0,
            pointsConceded: 0,
          });
        }

        const h2h = h2hMap.get(opponentId)!;
        h2h.matches++;
        h2h.setsWon += match.setsWon;
        h2h.setsLost += match.setsLost;
        h2h.pointsScored += match.pointsScored;
        h2h.pointsConceded += match.pointsConceded;

        if (match.result === "win") h2h.wins++;
        else if (match.result === "loss") h2h.losses++;
        else h2h.draws++;
      });

      const headToHead = Array.from(h2hMap.entries()).map(
        ([opponentId, data]) => ({
          opponentId,
          opponent: data.opponent,
          matches: data.matches,
          wins: data.wins,
          losses: data.losses,
          draws: data.draws,
          setsWon: data.setsWon,
          setsLost: data.setsLost,
          pointsScored: data.pointsScored,
          pointsConceded: data.pointsConceded,
        })
      );

      // Calculate advanced stats
      const played = standing.played || 0;
      const winRate = played > 0 ? (standing.won / played) * 100 : 0;
      const totalSets = standing.setsWon + standing.setsLost;
      const setsWinRate =
        totalSets > 0 ? (standing.setsWon / totalSets) * 100 : 0;
      const pointsPerMatch = played > 0 ? standing.points / played : 0;
      const avgPointsScored = played > 0 ? standing.pointsScored / played : 0;
      const avgPointsConceded =
        played > 0 ? standing.pointsConceded / played : 0;
      const avgSetDifferential = played > 0 ? standing.setsDiff / played : 0;

      // Calculate current streak
      let currentStreak = 0;
      const form = standing.form || [];
      if (form.length > 0) {
        const lastResult = form[form.length - 1];
        for (let i = form.length - 1; i >= 0; i--) {
          if (form[i] === lastResult) {
            currentStreak++;
          } else {
            break;
          }
        }
        if (lastResult === "L") currentStreak = -currentStreak;
      }

      // Calculate longest win streak
      let longestWinStreak = 0;
      let tempStreak = 0;
      matchHistory.forEach((match) => {
        if (match.result === "win") {
          tempStreak++;
          longestWinStreak = Math.max(longestWinStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Dominance rating (composite score)
      const dominanceRating =
        winRate * 0.4 +
        setsWinRate * 0.3 +
        (standing.setsDiff / Math.max(played, 1)) * 5 +
        (standing.pointsDiff / Math.max(played, 1)) * 0.5;

      // Qualification info - Based on knockout placement
      let qualificationInfo: DetailedPlayerStats["qualificationInfo"];

      // Determine status based on bracket placement
      let status: "qualified" | "eliminated" | "in_contention" | "pending";
      if (tournament.status === "completed") {
        // Tournament finished
        if (bracketRank === 1) status = "qualified"; // Champion
        else status = "eliminated"; // All others are eliminated (finished their run)
      } else {
        // Tournament ongoing - check if still in bracket
        const stillInBracket = tournament.bracket?.rounds?.some((round: any) =>
          round.matches?.some(
            (match: any) =>
              !match.completed &&
              (match.participant1?.participantId?.toString() === participantId ||
                match.participant2?.participantId?.toString() === participantId)
          )
        );
        status = stillInBracket ? "in_contention" : "eliminated";
      }

      qualificationInfo = {
        status,
      };

      // Add group info if from group stage
      if (tournament.useGroups) {
        const group = tournament.groups?.find((g: any) =>
          g.participants.some((p: any) => p.toString() === participantId)
        );
        if (group) {
          const groupStanding = group.standings?.find(
            (s: any) => s.participant.toString() === participantId
          );
          qualificationInfo.fromGroup = group.groupName;
          qualificationInfo.groupRank = groupStanding?.rank || 0;
        }
      }

      // Seeding info
      const seedingInfo = tournament.seeding?.find(
        (s: any) => s.participant.toString() === participantId
      );

      detailedStats.push({
        participant: {
          _id: participant._id.toString(),
          username: participant.username,
          fullName: participant.fullName,
          profileImage: participant.profileImage,
        },
        standing: {
          rank: standing.rank,
          played: standing.played,
          won: standing.won,
          lost: standing.lost,
          drawn: standing.drawn,
          setsWon: standing.setsWon,
          setsLost: standing.setsLost,
          setsDiff: standing.setsDiff,
          pointsScored: standing.pointsScored,
          pointsConceded: standing.pointsConceded,
          pointsDiff: standing.pointsDiff,
          points: standing.points,
          form: standing.form || [],
        },
        advancedStats: {
          winRate: Math.round(winRate * 100) / 100,
          setsWinRate: Math.round(setsWinRate * 100) / 100,
          pointsPerMatch: Math.round(pointsPerMatch * 100) / 100,
          avgPointsScored: Math.round(avgPointsScored * 100) / 100,
          avgPointsConceded: Math.round(avgPointsConceded * 100) / 100,
          avgSetDifferential: Math.round(avgSetDifferential * 100) / 100,
          currentStreak,
          longestWinStreak,
          dominanceRating: Math.round(dominanceRating * 100) / 100,
        },
        qualificationInfo,
        matchHistory: matchHistory.sort(
          (a, b) =>
            (b.date?.getTime() || 0) - (a.date?.getTime() || 0) ||
            (b.roundNumber || 0) - (a.roundNumber || 0)
        ),
        headToHead,
        seedingInfo: seedingInfo
          ? {
              seedNumber: seedingInfo.seedNumber,
              seedingRank: seedingInfo.seedingRank,
              seedingPoints: seedingInfo.seedingPoints,
            }
          : undefined,
      });
    }

    // Sort by bracket placement (already calculated)
    detailedStats.sort((a, b) => a.standing.rank - b.standing.rank);

    return NextResponse.json({
      tournament: {
        id: tournament._id.toString(),
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        matchType: tournament.matchType,
        useGroups: tournament.useGroups,
        numberOfGroups: tournament.numberOfGroups,
        advancePerGroup: tournament.advancePerGroup,
      },
      leaderboard: detailedStats,
    });
  } catch (error) {
    console.error("Error fetching detailed leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed leaderboard" },
      { status: 500 }
    );
  }
}
