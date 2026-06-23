import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import {
  hydrateIndividualMatchesWithPoints,
  hydrateTeamMatchesWithPoints,
} from "@/services/match/embeddedShotService";

const toIdString = (value: any): string =>
  typeof value === "object" && value?._id ? value._id.toString() : value?.toString?.() || "";

const mapLikeToRecord = (value: any): Record<string, number> => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value) as Record<string, number>;
  return value as Record<string, number>;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select("username fullName profileImage").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = id;

    // Ensure Tournament model is registered before populate
    Tournament;

    // Fetch all completed matches
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .populate("tournament", "name format")
      .sort({ createdAt: -1 })
      .lean();

    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("tournament", "name format")
      .sort({ createdAt: -1 })
      .lean();

    await hydrateIndividualMatchesWithPoints(individualMatches as Record<string, unknown>[]);
    await hydrateTeamMatchesWithPoints(teamMatches as Record<string, unknown>[]);

    // Core statistics
    const singlesStats = {
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      matchesByTournamentType: {} as Record<string, number>,
    };

    const doublesStats = {
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      matchesByTournamentType: {} as Record<string, number>,
    };

    // Performance tracking
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    let totalSets = 0;
    let totalServes = 0;
    let servesWon = 0;
    let bestWinStreak = 0;
    let currentWinStreak = 0;

    // Data for trends and graphs
    const matchPointsData: any[] = [];
    const serveAccuracyData: any[] = [];

    // Process individual matches
    individualMatches.forEach((match: any, index: number) => {
      const participantIds = (match.participants || []).map((p: any) => toIdString(p));
      const userParticipantId = participantIds.find((id) => id === userId) || userId;
      const opponentParticipantId = participantIds.find((id) => id !== userParticipantId) || "";
      const isWin = toIdString(match.winnerId) === userParticipantId;
      const matchType = match.matchType;

      const stats = matchType === "singles" ? singlesStats : doublesStats;

      // Update wins/losses and streaks
      if (isWin) {
        stats.wins++;
        currentWinStreak++;
        bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
      } else {
        stats.losses++;
        currentWinStreak = 0;
      }

      // Update sets
      const setsById = mapLikeToRecord(match.finalScore?.setsById);
      const userSets = Number(setsById[userParticipantId] || 0);
      const opponentSets = Number(setsById[opponentParticipantId] || 0);
      stats.setsWon += userSets;
      stats.setsLost += opponentSets;
      totalSets += userSets + opponentSets;

      // Track by tournament format
      if (match.tournament?.format) {
        const tournamentType = match.tournament.format;
        stats.matchesByTournamentType[tournamentType] = (stats.matchesByTournamentType[tournamentType] || 0) + 1;
      }

      // Process games for points and serve stats
      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchServesWon = 0;

      match.games?.forEach((game: any) => {
        const userScore = Number(game.scoresById?.[userParticipantId] || 0);
        const opponentScore = Number(game.scoresById?.[opponentParticipantId] || 0);

        matchPointsScored += userScore || 0;
        matchPointsConceded += opponentScore || 0;

        // Simplified serve accuracy: count serves that won points directly
        game.shots?.forEach((shot: any) => {
          const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
          const shotServerId = shot.server?._id?.toString() || shot.server?.toString();
          
          if (shotServerId === userId) {
            matchServes++;
            if (shotPlayerId === userId) {
              matchServesWon++;
            }
          }
        });
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      servesWon += matchServesWon;

      // Add to trend data
      matchPointsData.push({
        match: `M${index + 1}`,
        matchId: match._id.toString(),
        matchCategory: "individual",
        scored: matchPointsScored,
        conceded: matchPointsConceded,
        date: match.createdAt,
      });

      if (matchServes > 0) {
        serveAccuracyData.push({
          match: `M${index + 1}`,
          matchId: match._id.toString(),
          matchCategory: "individual",
          accuracy: (matchServesWon / matchServes) * 100,
          date: match.createdAt,
        });
      }
    });

    // Process team matches
    teamMatches.forEach((match: any, index: number) => {
      const isTeam1 = match.team1.players.some((p: any) => p.user._id.toString() === userId);
      const userTeamSide = isTeam1 ? "team1" : "team2";
      const opponentTeamSide = isTeam1 ? "team2" : "team1";
      const isWin = match.winnerTeam === userTeamSide;

      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchServesWon = 0;
      let userSets = 0;
      let opponentSets = 0;

      // Process submatches where user participated
      match.subMatches?.forEach((sub: any) => {
        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p.toString());

        if (playerIds.includes(userId.toString())) {
          const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
            .map((p: any) => p.toString())
            .includes(userId.toString());

          const subWon = (userInTeam1 && sub.winnerSide === "team1") || (!userInTeam1 && sub.winnerSide === "team2");
          if (subWon) {
            userSets++;
            currentWinStreak++;
            bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
          } else {
            opponentSets++;
            currentWinStreak = 0;
          }

          // Determine match type for this submatch
          const subMatchType = playerIds.length === 2 ? "singles" : "doubles";
          const stats = subMatchType === "singles" ? singlesStats : doublesStats;

          if (subWon) stats.wins++;
          else stats.losses++;

          sub.games?.forEach((game: any) => {
            const userScore = userInTeam1 ? game.team1Score : game.team2Score;
            const opponentScore = userInTeam1 ? game.team2Score : game.team1Score;

            matchPointsScored += userScore || 0;
            matchPointsConceded += opponentScore || 0;

            // Simplified serve accuracy
            game.shots?.forEach((shot: any) => {
              const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
              const shotServerId = shot.server?._id?.toString() || shot.server?.toString();
              
              if (shotServerId === userId) {
                matchServes++;
                if (shotPlayerId === userId) {
                  matchServesWon++;
                }
              }
            });
          });
        }
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      servesWon += matchServesWon;

      // Add to trend data if user participated
      if (matchPointsScored > 0 || matchPointsConceded > 0) {
        matchPointsData.push({
          match: `TM${index + 1}`,
          matchId: match._id.toString(),
          matchCategory: "team",
          scored: matchPointsScored,
          conceded: matchPointsConceded,
          date: match.createdAt,
        });

        if (matchServes > 0) {
          serveAccuracyData.push({
            match: `TM${index + 1}`,
            matchId: match._id.toString(),
            matchCategory: "team",
            accuracy: (matchServesWon / matchServes) * 100,
            date: match.createdAt,
          });
        }
      }
    });

    // Calculate final statistics
    const totalMatches = (singlesStats.wins + singlesStats.losses) + (doublesStats.wins + doublesStats.losses);
    const totalWins = singlesStats.wins + doublesStats.wins;
    const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    const singlesWinRate = (singlesStats.wins + singlesStats.losses) > 0 ? (singlesStats.wins / (singlesStats.wins + singlesStats.losses)) * 100 : 0;
    const doublesWinRate = (doublesStats.wins + doublesStats.losses) > 0 ? (doublesStats.wins / (doublesStats.wins + doublesStats.losses)) * 100 : 0;
    const avgPointsPerMatch = totalMatches > 0 ? totalPointsScored / totalMatches : 0;
    const avgPointsPerSet = totalSets > 0 ? totalPointsScored / totalSets : 0;
    const serveAccuracy = totalServes > 0 ? (servesWon / totalServes) * 100 : 0;

    // Sort trend data by date
    matchPointsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    serveAccuracyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        // Enhanced highlights section
        highlights: {
          overallWinRate: overallWinRate.toFixed(1),
          singlesWinRate: singlesWinRate.toFixed(1),
          doublesWinRate: doublesWinRate.toFixed(1),
          avgPointsPerMatch: avgPointsPerMatch.toFixed(1),
          serveAccuracy: serveAccuracy.toFixed(1),
          currentWinStreak,
          bestWinStreak,
        },
        
        // Traditional stats structure
        singlesDoubles: {
          singles: singlesStats,
          doubles: doublesStats,
        },
        
        scoring: {
          totalPointsScored,
          totalPointsConceded,
          avgPointsPerSet: avgPointsPerSet.toFixed(1),
          totalSets,
        },
        
        server: {
          totalServes,
          pointsWonOnServe: servesWon,
          serveWinPercentage: serveAccuracy.toFixed(1),
        },
        
        // Enhanced data for trends and graphs
        trends: {
          matchPoints: matchPointsData.slice(-20), // Last 20 matches
          serveAccuracy: serveAccuracyData.slice(-20), // Last 20 matches
        },
        
        // Calculated metrics
        metrics: {
          totalMatches,
          totalWins,
          totalLosses: totalMatches - totalWins,
          pointDifferential: totalPointsScored - totalPointsConceded,
          avgPointDifferentialPerMatch: totalMatches > 0 ? (totalPointsScored - totalPointsConceded) / totalMatches : 0,
        }
      },
    });
  } catch (error) {
    console.error("Player stats error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

