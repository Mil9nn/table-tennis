import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";

interface GlobalPlayerStats {
  player: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
  rank: number;
  overallStats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    currentStreak: number;
    longestWinStreak: number;
  };
  tournamentStats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    podiumFinishes: number; // Top 3
    averageRank: number;
    bestFinish: number;
    tournamentWinRate: number;
  };
  recentPerformance: {
    last7Days: {
      matches: number;
      wins: number;
      winRate: number;
    };
    last30Days: {
      matches: number;
      wins: number;
      winRate: number;
    };
  };
  performanceRating: number; // Composite score 0-1000
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const matchType = searchParams.get("matchType") || "all"; // singles, doubles, mixed_doubles, all
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get all users who have participated in matches
    const allMatches = await IndividualMatch.find({ status: "completed" })
      .populate("participants", "username firstName lastName profileImage")
      .lean();

    // Get all completed tournaments
    const allTournaments = await Tournament.find({
      status: { $in: ["completed", "in_progress"] },
      drawGenerated: true,
    })
      .populate("participants", "username firstName lastName profileImage")
      .populate(
        "standings.participant",
        "username firstName lastName profileImage"
      )
      .lean();

    // Build a map of player IDs to their stats
    const playerStatsMap = new Map<string, any>();

    // Process all matches
    for (const match of allMatches as any[]) {
      // Filter by match type if specified
      if (matchType !== "all" && match.matchType !== matchType) {
        continue;
      }

      for (const participant of match.participants) {
        const playerId = participant._id.toString();

        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            player: participant,
            matches: [],
            tournaments: new Set(),
            tournamentResults: [],
          });
        }

        playerStatsMap.get(playerId).matches.push(match);
      }
    }

    // Process tournament results
    for (const tournament of allTournaments as any[]) {
      // Filter by tournament match type if specified
      if (matchType !== "all" && tournament.matchType !== matchType) {
        continue;
      }

      if (tournament.standings && tournament.standings.length > 0) {
        for (const standing of tournament.standings) {
          const playerId = standing.participant._id.toString();

          if (playerStatsMap.has(playerId)) {
            playerStatsMap
              .get(playerId)
              .tournaments.add(tournament._id.toString());
            playerStatsMap.get(playerId).tournamentResults.push({
              tournamentId: tournament._id,
              tournamentName: tournament.name,
              rank: standing.rank,
              played: standing.played,
              won: standing.won,
              lost: standing.lost,
            });
          }
        }
      }
    }

    // Calculate detailed stats for each player
    const globalStats: GlobalPlayerStats[] = [];

    for (const [playerId, data] of playerStatsMap.entries()) {
      const matches = data.matches;
      if (matches.length === 0) continue;

      // Calculate overall match stats
      let totalWins = 0;
      let totalLosses = 0;
      let totalDraws = 0;
      let setsWon = 0;
      let setsLost = 0;
      let pointsScored = 0;
      let pointsConceded = 0;
      let currentStreak = 0;
      let tempStreak = 0;
      let longestWinStreak = 0;

      // Sort matches by date for streak calculation
      const sortedMatches = matches.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const match of sortedMatches) {
        const participantIndex = match.participants.findIndex(
          (p: any) => p._id.toString() === playerId
        );
        const side = participantIndex === 0 ? "side1" : "side2";
        const opponentSide = side === "side1" ? "side2" : "side1";

        // Sets
        const playerSets =
          side === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;
        const opponentSets =
          opponentSide === "side1"
            ? match.finalScore?.side1Sets || 0
            : match.finalScore?.side2Sets || 0;

        setsWon += playerSets;
        setsLost += opponentSets;

        // Points from games
        if (match.games && match.games.length > 0) {
          for (const game of match.games) {
            if (side === "side1") {
              pointsScored += game.side1Score || 0;
              pointsConceded += game.side2Score || 0;
            } else {
              pointsScored += game.side2Score || 0;
              pointsConceded += game.side1Score || 0;
            }
          }
        }

        // Determine result
        let result: "win" | "loss" | "draw";
        if (playerSets > opponentSets) {
          result = "win";
          totalWins++;
          tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1;
          longestWinStreak = Math.max(longestWinStreak, tempStreak);
        } else if (playerSets < opponentSets) {
          result = "loss";
          totalLosses++;
          tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1;
        } else {
          result = "draw";
          totalDraws++;
          tempStreak = 0;
        }
      }

      currentStreak = tempStreak;

      // Calculate tournament stats
      const tournamentsPlayed = data.tournaments.size;
      const tournamentResults = data.tournamentResults;
      const tournamentsWon = tournamentResults.filter(
        (r: any) => r.rank === 1
      ).length;
      const podiumFinishes = tournamentResults.filter(
        (r: any) => r.rank <= 3
      ).length;
      const averageRank =
        tournamentResults.length > 0
          ? tournamentResults.reduce((sum: number, r: any) => sum + r.rank, 0) /
            tournamentResults.length
          : 0;
      const bestFinish =
        tournamentResults.length > 0
          ? Math.min(...tournamentResults.map((r: any) => r.rank))
          : 0;

      // Tournament win rate (matches won in tournaments / total tournament matches)
      const tournamentMatchesWon = tournamentResults.reduce(
        (sum: number, r: any) => sum + r.won,
        0
      );
      const tournamentMatchesPlayed = tournamentResults.reduce(
        (sum: number, r: any) => sum + r.played,
        0
      );
      const tournamentWinRate =
        tournamentMatchesPlayed > 0
          ? (tournamentMatchesWon / tournamentMatchesPlayed) * 100
          : 0;

      // Calculate recent performance
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recent7DaysMatches = matches.filter(
        (m: any) => new Date(m.createdAt) >= sevenDaysAgo
      );
      const recent30DaysMatches = matches.filter(
        (m: any) => new Date(m.createdAt) >= thirtyDaysAgo
      );

      const calculate7DayStats = () => {
        let wins = 0;
        for (const match of recent7DaysMatches) {
          const participantIndex = match.participants.findIndex(
            (p: any) => p._id.toString() === playerId
          );
          const side = participantIndex === 0 ? "side1" : "side2";
          const playerSets =
            side === "side1"
              ? match.finalScore?.side1Sets || 0
              : match.finalScore?.side2Sets || 0;
          const opponentSets =
            side === "side1"
              ? match.finalScore?.side2Sets || 0
              : match.finalScore?.side1Sets || 0;
          if (playerSets > opponentSets) wins++;
        }
        return {
          matches: recent7DaysMatches.length,
          wins,
          winRate:
            recent7DaysMatches.length > 0
              ? (wins / recent7DaysMatches.length) * 100
              : 0,
        };
      };

      const calculate30DayStats = () => {
        let wins = 0;
        for (const match of recent30DaysMatches) {
          const participantIndex = match.participants.findIndex(
            (p: any) => p._id.toString() === playerId
          );
          const side = participantIndex === 0 ? "side1" : "side2";
          const playerSets =
            side === "side1"
              ? match.finalScore?.side1Sets || 0
              : match.finalScore?.side2Sets || 0;
          const opponentSets =
            side === "side1"
              ? match.finalScore?.side2Sets || 0
              : match.finalScore?.side1Sets || 0;
          if (playerSets > opponentSets) wins++;
        }
        return {
          matches: recent30DaysMatches.length,
          wins,
          winRate:
            recent30DaysMatches.length > 0
              ? (wins / recent30DaysMatches.length) * 100
              : 0,
        };
      };

      const last7Days = calculate7DayStats();
      const last30Days = calculate30DayStats();

      const totalMatches = totalWins + totalLosses + totalDraws;
      const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

      // Calculate performance rating (0-1000)
      // Factors: win rate (40%), tournament success (30%), activity (15%), consistency (15%)
      const winRatingComponent = winRate * 4; // Max 400
      const tournamentComponent =
        tournamentsWon * 50 + podiumFinishes * 20 + tournamentsPlayed * 10; // Max ~300
      const activityComponent = Math.min(totalMatches * 1.5, 150); // Max 150
      const consistencyComponent = Math.min(longestWinStreak * 10, 150); // Max 150

      const performanceRating = Math.min(
        winRatingComponent +
          tournamentComponent +
          activityComponent +
          consistencyComponent,
        1000
      );

      globalStats.push({
        player: data.player,
        rank: 0, // Will be assigned after sorting
        overallStats: {
          totalMatches,
          totalWins,
          totalLosses,
          totalDraws,
          winRate: Math.round(winRate * 100) / 100,
          setsWon,
          setsLost,
          setsDiff: setsWon - setsLost,
          pointsScored,
          pointsConceded,
          pointsDiff: pointsScored - pointsConceded,
          currentStreak,
          longestWinStreak,
        },
        tournamentStats: {
          tournamentsPlayed,
          tournamentsWon,
          podiumFinishes,
          averageRank: Math.round(averageRank * 100) / 100,
          bestFinish,
          tournamentWinRate: Math.round(tournamentWinRate * 100) / 100,
        },
        recentPerformance: {
          last7Days,
          last30Days,
        },
        performanceRating: Math.round(performanceRating),
      });
    }

    // Sort by performance rating
    globalStats.sort((a, b) => b.performanceRating - a.performanceRating);

    // Assign ranks
    globalStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    // Apply limit
    const limitedStats = globalStats.slice(0, limit);

    return NextResponse.json({
      leaderboard: limitedStats,
      total: globalStats.length,
      matchType,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error fetching global leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch global leaderboard" },
      { status: 500 }
    );
  }
}
