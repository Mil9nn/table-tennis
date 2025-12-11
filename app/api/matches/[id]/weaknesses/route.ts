// app/api/matches/[id]/weaknesses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { analyzeWeaknesses } from "@/lib/weaknesses-analysis-utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await context.params;
    const matchId = id;
    const searchParams = request.nextUrl.searchParams;
    const category = (searchParams.get("category") || "individual") as "individual" | "team";

    // Fetch match based on category
    let match: any = null;
    if (category === "individual") {
      match = await IndividualMatch.findById(matchId)
        .populate("participants", "username fullName profileImage")
        .lean();
    } else {
      match = await TeamMatch.findById(matchId)
        .populate("team1.players.user team2.players.user", "username fullName profileImage")
        .lean();
    }

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    if (match.status !== "completed") {
      return NextResponse.json({
        success: false,
        message: "Match is not completed. Weaknesses analysis is only available for completed matches.",
      });
    }

    // Analyze weaknesses for each participant
    const participantsAnalysis: any[] = [];

    if (category === "individual") {
      // Individual match - analyze each participant
      const participants = match.participants || [];

      participants.forEach((participant: any) => {
        const participantId = participant._id.toString();
        const participantGames = match.games || [];

        if (participantGames.length > 0) {
          const weaknessAnalysis = analyzeWeaknesses(participantGames, participantId);

          participantsAnalysis.push({
            userId: participantId,
            name: participant.fullName || participant.username,
            profileImage: participant.profileImage,
            weaknesses: weaknessAnalysis,
          });
        }
      });
    } else {
      // Team match - analyze players from subMatches
      const allPlayers = new Map<string, any>();

      // Collect all unique players from subMatches
      match.subMatches?.forEach((subMatch: any) => {
        const team1Players = Array.isArray(subMatch.playerTeam1)
          ? subMatch.playerTeam1
          : [subMatch.playerTeam1];
        const team2Players = Array.isArray(subMatch.playerTeam2)
          ? subMatch.playerTeam2
          : [subMatch.playerTeam2];

        [...team1Players, ...team2Players].forEach((player: any) => {
          if (player?._id) {
            const playerId = player._id.toString();
            if (!allPlayers.has(playerId)) {
              allPlayers.set(playerId, {
                _id: playerId,
                fullName: player.fullName,
                username: player.username,
                profileImage: player.profileImage,
                games: [],
              });
            }
          }
        });
      });

      // Collect games for each player
      match.subMatches?.forEach((subMatch: any) => {
        const team1Players = Array.isArray(subMatch.playerTeam1)
          ? subMatch.playerTeam1
          : [subMatch.playerTeam1];
        const team2Players = Array.isArray(subMatch.playerTeam2)
          ? subMatch.playerTeam2
          : [subMatch.playerTeam2];

        const allSubMatchPlayers = [...team1Players, ...team2Players];

        allSubMatchPlayers.forEach((player: any) => {
          if (player?._id && subMatch.games) {
            const playerId = player._id.toString();
            const playerData = allPlayers.get(playerId);
            if (playerData) {
              playerData.games.push(...subMatch.games);
            }
          }
        });
      });

      // Analyze each player
      allPlayers.forEach((playerData, playerId) => {
        if (playerData.games.length > 0) {
          const weaknessAnalysis = analyzeWeaknesses(playerData.games, playerId);

          participantsAnalysis.push({
            userId: playerId,
            name: playerData.fullName || playerData.username,
            profileImage: playerData.profileImage,
            weaknesses: weaknessAnalysis,
          });
        }
      });
    }

    if (participantsAnalysis.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Insufficient data for weakness analysis in this match.",
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        category,
        participants: participantsAnalysis,
      },
    });
  } catch (error: any) {
    console.error("Error in match weaknesses analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze match weaknesses",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
