// app/api/profile/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { requireFeature } from "@/lib/middleware/subscription";

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // TEMPORARILY DISABLED: Subscription check for frontend development
    // const featureCheck = await requireFeature(request, "profileInsightsAccess");
    // if (!featureCheck.allowed) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "This feature requires a Pro subscription",
    //       error: "UPGRADE_REQUIRED",
    //       tier: featureCheck.subscription?.tier || "free",
    //     },
    //     { status: 403 }
    //   );
    // }

    // Fetch all completed matches
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .lean();

    // Calculate win rates
    let totalWins = 0;
    let totalMatches = 0;
    let singlesWins = 0;
    let singlesMatches = 0;
    let doublesWins = 0;
    let doublesMatches = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    let totalServes = 0;
    let servesWon = 0;
    let bestWinStreak = 0;
    let currentStreak = 0;

    // For graphs
    const matchPointsData: any[] = [];
    const serveAccuracyOverTime: any[] = [];

    // Process individual matches
    individualMatches.forEach((match: any, index: number) => {
      const isSide1 = match.participants[0]._id.toString() === userId;
      const userSide = isSide1 ? "side1" : "side2";
      const opponentSide = isSide1 ? "side2" : "side1";
      const isWin = match.winnerSide === userSide;
      const matchType = match.matchType;

      totalMatches++;
      if (isWin) {
        totalWins++;
        currentStreak++;
        bestWinStreak = Math.max(bestWinStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      // Track singles and doubles separately
      if (matchType === "singles") {
        singlesMatches++;
        if (isWin) singlesWins++;
      } else if (matchType === "doubles") {
        doublesMatches++;
        if (isWin) doublesWins++;
      }

      // Calculate points for this match
      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchServesWon = 0;

      match.games?.forEach((game: any) => {
        const userScore = userSide === "side1" ? game.side1Score : game.side2Score;
        const opponentScore = userSide === "side1" ? game.side2Score : game.side1Score;

        matchPointsScored += userScore || 0;
        matchPointsConceded += opponentScore || 0;

        // Calculate serve accuracy
        // Note: If only winning shots are stored, we can only track serves that won points directly
        // A serve wins a point if: shot.server === userId AND shot.player === userId
        // This means the serve was the winning shot (ace or unreturned serve)
        
        game.shots?.forEach((shot: any) => {
          const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
          const shotServerId = shot.server?._id?.toString() || shot.server?.toString();
          
          // If user served this point
          if (shotServerId === userId) {
            matchServes++;
            
            // If the serve was the winning shot (shot.player === userId), serve won the point
            // This handles aces and unreturned serves
            if (shotPlayerId === userId) {
              matchServesWon++;
            }
            // Note: If serve didn't win directly (rally continued), we can't track it accurately
            // if only winning shots are stored, as the serve shot wouldn't be in the array
          }
        });
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      servesWon += matchServesWon;

      // Add to match points data for graph
      matchPointsData.push({
        match: `M${index + 1}`,
        matchId: match._id.toString(),
        matchCategory: "individual",
        scored: matchPointsScored,
        conceded: matchPointsConceded,
        date: match.createdAt,
      });

      // Add to serve accuracy over time
      if (matchServes > 0) {
        serveAccuracyOverTime.push({
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
      const isWin = match.winnerTeam === userTeamSide;

      totalMatches++;
      if (isWin) {
        totalWins++;
        currentStreak++;
        bestWinStreak = Math.max(bestWinStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      // Calculate points from submatches where user played
      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchServesWon = 0;

      match.subMatches?.forEach((sub: any) => {
        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p.toString());

        if (playerIds.includes(userId.toString())) {
          const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
            .map((p: any) => p.toString())
            .includes(userId.toString());

          sub.games?.forEach((game: any) => {
            const userScore = userInTeam1 ? game.team1Score : game.team2Score;
            const opponentScore = userInTeam1 ? game.team2Score : game.team1Score;

            matchPointsScored += userScore || 0;
            matchPointsConceded += opponentScore || 0;

            // Calculate serve accuracy
            // Same logic as individual matches: serve wins if serve shot is the winning shot
            game.shots?.forEach((shot: any) => {
              const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
              const shotServerId = shot.server?._id?.toString() || shot.server?.toString();
              
              // If user served this point
              if (shotServerId === userId) {
                matchServes++;
                
                // If the serve was the winning shot, serve won the point
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

      // Add to graphs if user participated
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
          serveAccuracyOverTime.push({
            match: `TM${index + 1}`,
            matchId: match._id.toString(),
            matchCategory: "team",
            accuracy: (matchServesWon / matchServes) * 100,
            date: match.createdAt,
          });
        }
      }
    });

    // Sort by date
    matchPointsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    serveAccuracyOverTime.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate final stats
    const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    const singlesWinRate = singlesMatches > 0 ? (singlesWins / singlesMatches) * 100 : 0;
    const doublesWinRate = doublesMatches > 0 ? (doublesWins / doublesMatches) * 100 : 0;
    const avgPointsPerMatch = totalMatches > 0 ? totalPointsScored / totalMatches : 0;
    const serveAccuracy = totalServes > 0 ? (servesWon / totalServes) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          overallWinRate: overallWinRate.toFixed(1),
          singlesWinRate: singlesWinRate.toFixed(1),
          doublesWinRate: doublesWinRate.toFixed(1),
          avgPointsPerMatch: avgPointsPerMatch.toFixed(1),
          serveAccuracy: serveAccuracy.toFixed(1),
          bestWinStreak,
        },
        graphs: {
          matchPoints: matchPointsData.slice(-20), // Last 20 matches
          serveAccuracy: serveAccuracyOverTime.slice(-20), // Last 20 matches
        },
      },
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
