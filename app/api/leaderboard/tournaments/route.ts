import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

interface TournamentPlayerStats {
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  rank: number;
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    finalsReached: number;
    semiFinalsReached: number;
    tournamentMatches: number;
    tournamentMatchWins: number;
    tournamentMatchLosses: number;
    tournamentMatchWinRate: number;
    totalPoints: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const matchType = searchParams.get("matchType"); // optional filter
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const query: any = {
      status: { $in: ["completed", "in_progress"] },
      drawGenerated: true,
    };

    if (matchType && matchType !== "all") {
      query.matchType = matchType;
    }

    const tournaments = await Tournament.find(query)
      .populate("standings.participant", "username fullName profileImage")
      .populate("participants", "username fullName profileImage")
      .lean();

    // Aggregate stats per player across all tournaments
    const playerStatsMap = new Map<string, any>();

    for (const tournament of tournaments as any[]) {
      const standings = tournament.standings || [];
      const isCompleted = tournament.status === "completed";

      for (const standing of standings) {
        if (!standing.participant || !standing.participant._id) continue;

        const playerId = standing.participant._id.toString();

        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            player: {
              _id: playerId,
              username: standing.participant.username,
              fullName: standing.participant.fullName,
              profileImage: standing.participant.profileImage,
            },
            stats: {
              tournamentsPlayed: 0,
              tournamentsWon: 0,
              finalsReached: 0,
              semiFinalsReached: 0,
              tournamentMatches: 0,
              tournamentMatchWins: 0,
              tournamentMatchLosses: 0,
              tournamentMatchWinRate: 0,
              totalPoints: 0,
            },
          });
        }

        const playerData = playerStatsMap.get(playerId);
        const stats = playerData.stats;

        // Count tournament participation
        stats.tournamentsPlayed++;

        // Track finish position (only for completed tournaments)
        const rank = standing.rank;
        if (rank && isCompleted) {
          if (rank === 1) {
            stats.tournamentsWon++;
            stats.finalsReached++;
          } else if (rank === 2) {
            stats.finalsReached++;
          } else if (rank <= 4) {
            // 3rd and 4th place means reached semi-finals
            stats.semiFinalsReached++;
          }
        }

        // Tournament match stats from standings
        const matchesPlayed = standing.played || 0;
        const matchesWon = standing.won || 0;

        stats.tournamentMatches += matchesPlayed;
        stats.tournamentMatchWins += matchesWon;
        stats.totalPoints += standing.points || 0;
      }
    }

    // Calculate derived stats and build leaderboard
    const leaderboard: TournamentPlayerStats[] = [];

    for (const [playerId, data] of playerStatsMap.entries()) {
      const stats = data.stats;

      // Calculate match losses
      stats.tournamentMatchLosses = stats.tournamentMatches - stats.tournamentMatchWins;

      // Calculate win rate
      stats.tournamentMatchWinRate =
        stats.tournamentMatches > 0
          ? Math.round((stats.tournamentMatchWins / stats.tournamentMatches) * 100 * 10) / 10
          : 0;

      if (stats.tournamentsPlayed > 0) {
        leaderboard.push({
          player: data.player,
          rank: 0,
          stats,
        });
      }
    }

    // Sort by: total points (ITTF-style ranking), then tournaments won, then match win rate
    leaderboard.sort((a, b) => {
      if (b.stats.totalPoints !== a.stats.totalPoints) {
        return b.stats.totalPoints - a.stats.totalPoints;
      }
      if (b.stats.tournamentsWon !== a.stats.tournamentsWon) {
        return b.stats.tournamentsWon - a.stats.tournamentsWon;
      }
      if (b.stats.finalsReached !== a.stats.finalsReached) {
        return b.stats.finalsReached - a.stats.finalsReached;
      }
      if (b.stats.tournamentMatchWinRate !== a.stats.tournamentMatchWinRate) {
        return b.stats.tournamentMatchWinRate - a.stats.tournamentMatchWinRate;
      }
      return b.stats.tournamentsPlayed - a.stats.tournamentsPlayed;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const total = leaderboard.length;
    const paginatedLeaderboard = leaderboard.slice(skip, skip + limit);
    const hasMore = skip + paginatedLeaderboard.length < total;

    return NextResponse.json({
      leaderboard: paginatedLeaderboard,
      pagination: {
        total,
        skip,
        limit,
        hasMore,
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error fetching tournament leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament leaderboard" },
      { status: 500 }
    );
  }
}
