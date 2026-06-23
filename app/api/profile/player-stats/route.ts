import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import {
  hydrateIndividualMatchesWithPoints,
  hydrateTeamMatchesWithPoints,
} from "@/services/match/matchPointService";

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Ensure Tournament model is registered before populate
    Tournament;

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch all completed matches
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .populate("tournament", "name format")
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
      .lean();

    await hydrateIndividualMatchesWithPoints(individualMatches as Record<string, unknown>[]);
    await hydrateTeamMatchesWithPoints(teamMatches as Record<string, unknown>[]);

    // A. Singles and Doubles Stats
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

    // B. Scoring Stats
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    let totalSets = 0;

    // C. Server Stats
    let totalServes = 0;
    let pointsWonOnServe = 0;
    let acesServed = 0;
    let serviceFaults = 0;

    // E. Match-by-Match Performance Table
    const matchPerformance: any[] = [];
    const pointsPerMatchData: any[] = [];

    // Process individual matches
    individualMatches.forEach((match: any, matchIndex: number) => {
      const isSide1 = match.participants[0]._id.toString() === userId;
      const userSide = isSide1 ? "side1" : "side2";
      const opponentSide = isSide1 ? "side2" : "side1";
      const isWin = match.winnerSide === userSide;
      const matchType = match.matchType;

      const stats = matchType === "singles" ? singlesStats : doublesStats;

      // Update wins/losses
      if (isWin) {
        stats.wins++;
      } else {
        stats.losses++;
      }

      // Update sets
      const userSets = match.finalScore?.[`${userSide}Sets`] || 0;
      const opponentSets = match.finalScore?.[`${opponentSide}Sets`] || 0;
      stats.setsWon += userSets;
      stats.setsLost += opponentSets;
      totalSets += userSets + opponentSets;

      // Track by tournament format (only for tournament matches)
      if (match.tournament?.format) {
        const tournamentType = match.tournament.format;
        stats.matchesByTournamentType[tournamentType] = (stats.matchesByTournamentType[tournamentType] || 0) + 1;
      }

      // Process games for scoring and server stats
      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchPointsWonOnServe = 0;

      match.games?.forEach((game: any, gameIndex: number) => {
        const userScore = userSide === "side1" ? game.side1Score : game.side2Score;
        const opponentScore = userSide === "side1" ? game.side2Score : game.side1Score;

        matchPointsScored += userScore || 0;
        matchPointsConceded += opponentScore || 0;

        // Server stats from shots
        let currentServer: string | null = null;
        let rallyStartShot: any = null;

        game.shots?.forEach((shot: any, shotIndex: number) => {
          if (shot.server) {
            currentServer = shot.server.toString();
            rallyStartShot = shot;
          }

          if (shot.player?.toString() === userId) {
            if (currentServer === userId) {
              matchServes++;

              // Check if user won the point on their serve
              // A point is won if the next shot is from the same player or if this is the last shot and user won
              const nextShot = game.shots[shotIndex + 1];

              if (!nextShot) {
                // Last shot - check if user won the game
                if (userScore > opponentScore) {
                  matchPointsWonOnServe++;
                }
              } else {
                // Check if the rally continues with opponent
                // If the next few shots show opponent failed to return
                let pointWon = false;
                for (let i = shotIndex + 1; i < game.shots.length; i++) {
                  const futureShot = game.shots[i];
                  if (futureShot.server !== currentServer) {
                    // New rally started, user won the previous point
                    if (game.shots[i - 1]?.player?.toString() === userId) {
                      pointWon = true;
                    }
                    break;
                  }
                }
                if (pointWon) {
                  matchPointsWonOnServe++;
                }
              }
            }
          }
        });
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      pointsWonOnServe += matchPointsWonOnServe;

      // Add to match performance table
      const opponentIndex = isSide1 ? (matchType === "singles" ? 1 : 2) : 0;
      const opponent = match.participants[opponentIndex];

      matchPerformance.push({
        matchId: match._id.toString(),
        matchNumber: matchIndex + 1,
        type: matchType,
        opponent: opponent?.fullName || opponent?.username || "Unknown",
        result: isWin ? "Win" : "Loss",
        score: `${userSets}-${opponentSets}`,
        pointsScored: matchPointsScored,
        pointsConceded: matchPointsConceded,
        tournamentType: match.tournament?.format || null,
        tournamentName: match.tournament?.name,
        date: match.createdAt,
      });

      // Points per match data
      pointsPerMatchData.push({
        match: `M${matchIndex + 1}`,
        points: matchPointsScored,
        date: match.createdAt,
      });
    });

    // Process team matches
    teamMatches.forEach((match: any, matchIndex: number) => {
      const isTeam1 = match.team1.players.some((p: any) => p.user._id.toString() === userId);
      const userTeamSide = isTeam1 ? "team1" : "team2";
      const opponentTeamSide = isTeam1 ? "team2" : "team1";
      const isWin = match.winnerTeam === userTeamSide;

      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchPointsWonOnServe = 0;
      let userSets = 0;
      let opponentSets = 0;

      // Process submatches where user participated
      match.subMatches?.forEach((sub: any, subIndex: number) => {
        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p.toString());

        if (playerIds.includes(userId.toString())) {
          const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
            .map((p: any) => p.toString())
            .includes(userId.toString());

          const subWon = (userInTeam1 && sub.winnerSide === "team1") || (!userInTeam1 && sub.winnerSide === "team2");
          if (subWon) userSets++;
          else opponentSets++;

          // Determine match type for this submatch
          const subMatchType = playerIds.length === 2 ? "singles" : "doubles";
          const stats = subMatchType === "singles" ? singlesStats : doublesStats;

          if (subWon) stats.wins++;
          else stats.losses++;

          sub.games?.forEach((game: any, gameIndex: number) => {
            const userScore = userInTeam1 ? game.team1Score : game.team2Score;
            const opponentScore = userInTeam1 ? game.team2Score : game.team1Score;

            matchPointsScored += userScore || 0;
            matchPointsConceded += opponentScore || 0;

            // Server stats
            let currentServer: string | null = null;
            game.shots?.forEach((shot: any, shotIndex: number) => {
              if (shot.server) {
                currentServer = shot.server.toString();
              }

              if (shot.player?.toString() === userId && currentServer === userId) {
                matchServes++;

                const nextShot = game.shots[shotIndex + 1];
                if (!nextShot && userScore > opponentScore) {
                  matchPointsWonOnServe++;
                } else if (nextShot?.server !== currentServer) {
                  matchPointsWonOnServe++;
                }
              }
            });
          });
        }
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      pointsWonOnServe += matchPointsWonOnServe;

      // Add to performance table if user participated
      if (matchPointsScored > 0 || matchPointsConceded > 0) {
        matchPerformance.push({
          matchId: match._id.toString(),
          matchNumber: individualMatches.length + matchIndex + 1,
          type: "team",
          opponent: match[opponentTeamSide].name,
          result: isWin ? "Win" : "Loss",
          score: `${userSets}-${opponentSets}`,
          pointsScored: matchPointsScored,
          pointsConceded: matchPointsConceded,
          tournamentType: match.tournament?.format || null,
          tournamentName: match.tournament?.name,
          date: match.createdAt,
        });

        pointsPerMatchData.push({
          match: `TM${matchIndex + 1}`,
          points: matchPointsScored,
          date: match.createdAt,
        });
      }
    });

    // Calculate derived stats
    const avgPointsPerSet = totalSets > 0 ? totalPointsScored / totalSets : 0;
    const serveWinPercentage = totalServes > 0 ? (pointsWonOnServe / totalServes) * 100 : 0;

    // Sort tables by date
    matchPerformance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    pointsPerMatchData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
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
          pointsWonOnServe,
          serveWinPercentage: serveWinPercentage.toFixed(1),
          acesServed,
          serviceFaults,
        },
        tables: {
          matchPerformance: matchPerformance.slice(0, 50), // Last 50 matches
        },
        charts: {
          pointsPerMatch: pointsPerMatchData.slice(-20), // Last 20 matches
        },
      },
    });
  } catch (error) {
    console.error("Player stats error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
