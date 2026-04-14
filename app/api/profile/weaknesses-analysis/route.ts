// app/api/profile/weaknesses-analysis/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { analyzeWeaknesses } from "@/lib/weaknesses-analysis-utils";
import { requireFeature } from "@/lib/middleware/subscription";
import {
  hydrateIndividualMatchesWithPoints,
  hydrateTeamMatchesWithPoints,
} from "@/services/match/matchPointService";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const matchLimit = parseInt(searchParams.get("matchLimit") || "20", 10);

    // Fetch recent completed matches (individual)
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(matchLimit)
      .populate("participants", "username fullName profileImage")
      .lean();

    // Fetch recent completed team matches
    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(matchLimit)
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .lean();

    await hydrateIndividualMatchesWithPoints(individualMatches as Record<string, unknown>[]);
    await hydrateTeamMatchesWithPoints(teamMatches as Record<string, unknown>[]);

    // Extract all games from matches
    const allGames: any[] = [];

    // Add individual match games
    individualMatches.forEach((match) => {
      if (match.games && match.games.length > 0) {
        match.games.forEach((game) => {
          allGames.push(game);
        });
      }
    });

    // Add team match games (from subMatches where user participated)
    teamMatches.forEach((match: any) => {
      if (match.subMatches && match.subMatches.length > 0) {
        match.subMatches.forEach((subMatch: any) => {
          // Check if user participated in this submatch
          const team1Players = Array.isArray(subMatch.playerTeam1)
            ? subMatch.playerTeam1
            : [subMatch.playerTeam1];
          const team2Players = Array.isArray(subMatch.playerTeam2)
            ? subMatch.playerTeam2
            : [subMatch.playerTeam2];

          const allSubMatchPlayers = [...team1Players, ...team2Players];
          const userParticipated = allSubMatchPlayers.some((p: any) => {
            const playerId = p?._id?.toString() || p?.toString();
            return playerId === userId;
          });

          if (userParticipated && subMatch.games && subMatch.games.length > 0) {
            subMatch.games.forEach((game: any) => {
              allGames.push(game);
            });
          }
        });
      }
    });

    // Check if any data available
    if (allGames.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No match data available. Play more matches to generate insights!",
        data: null,
      });
    }

    // Perform weakness analysis (no minimum game limit)
    const analysisResult = analyzeWeaknesses(allGames, userId);

    // Collect all shots from allGames for visualization
    const allShots: any[] = [];
    allGames.forEach((game: any) => {
      if (game.shots && Array.isArray(game.shots)) {
        game.shots.forEach((shot: any) => {
          if (shot.landingX != null && shot.landingY != null) {
            allShots.push(shot);
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysisResult,
        shots: allShots, // Include shots for visualization
      },
      meta: {
        matchesAnalyzed: individualMatches.length + teamMatches.length,
        gamesAnalyzed: allGames.length,
      },
    });
  } catch (error: any) {
    console.error("Error in weaknesses analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze weaknesses",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
