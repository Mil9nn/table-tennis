// app/api/matches/[id]/weaknesses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { analyzeWeaknesses } from "@/lib/weaknesses-analysis-utils";
import { requireFeature } from "@/lib/middleware/subscription";
import { isUserParticipantInMatch } from "@/lib/matchHelpers";

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

    // TEMPORARILY DISABLED: Subscription check for frontend development
    // const featureCheck = await requireFeature(request, "advancedAnalytics");
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

    // Verify user is a participant in the match
    if (!isUserParticipantInMatch(decoded.userId, match)) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a participant in this match",
          error: "NOT_PARTICIPANT",
        },
        { status: 403 }
      );
    }

    const userId = decoded.userId;
    let userGames: any[] = [];
    let userParticipant: any = null;

    if (category === "individual") {
      // Individual match - find current user and filter their games
      const participants = match.participants || [];
      userParticipant = participants.find((p: any) => {
        const participantId = p._id?.toString() || p.toString();
        return participantId === userId;
      });

      if (!userParticipant) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not a participant in this match",
            error: "NOT_PARTICIPANT",
          },
          { status: 403 }
        );
      }

      // Filter games to only include shots where current user is the player
      const allGames = match.games || [];
      userGames = allGames.map((game: any) => {
        // Filter shots to only current user's shots
        const userShots = (game.shots || []).filter((shot: any) => {
          const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString() || shot.player;
          return shotPlayerId === userId;
        });
        return {
          ...game,
          shots: userShots,
        };
      }).filter((game: any) => game.shots.length > 0); // Only include games where user has shots

    } else {
      // Team match - find current user in subMatches and collect their games
      const subMatches = match.subMatches || [];
      
      // Find user's participant info from team players
      const team1Players = match.team1?.players || [];
      const team2Players = match.team2?.players || [];
      
      for (const player of [...team1Players, ...team2Players]) {
        const playerId = player.user?._id?.toString() || player.user?.toString() || player.user?._id || player.user;
        if (playerId === userId) {
          userParticipant = {
            _id: playerId,
            fullName: player.user?.fullName,
            username: player.user?.username,
            profileImage: player.user?.profileImage,
          };
          break;
        }
      }

      // If not found in team players, check subMatches
      if (!userParticipant) {
        for (const subMatch of subMatches) {
          const team1SubPlayers = Array.isArray(subMatch.playerTeam1)
            ? subMatch.playerTeam1
            : [subMatch.playerTeam1];
          const team2SubPlayers = Array.isArray(subMatch.playerTeam2)
            ? subMatch.playerTeam2
            : [subMatch.playerTeam2];

          for (const player of [...team1SubPlayers, ...team2SubPlayers]) {
            if (!player) continue;
            const playerId = player._id?.toString() || player.toString() || player._id || player;
            if (playerId === userId) {
              userParticipant = {
                _id: playerId,
                fullName: player.fullName,
                username: player.username,
                profileImage: player.profileImage,
              };
              break;
            }
          }
          if (userParticipant) break;
        }
      }

      if (!userParticipant) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not a participant in this match",
            error: "NOT_PARTICIPANT",
          },
          { status: 403 }
        );
      }

      // Collect games from subMatches where user participated
      for (const subMatch of subMatches) {
        const team1SubPlayers = Array.isArray(subMatch.playerTeam1)
          ? subMatch.playerTeam1
          : [subMatch.playerTeam1];
        const team2SubPlayers = Array.isArray(subMatch.playerTeam2)
          ? subMatch.playerTeam2
          : [subMatch.playerTeam2];

        const allSubMatchPlayers = [...team1SubPlayers, ...team2SubPlayers];
        const userInSubMatch = allSubMatchPlayers.some((player: any) => {
          if (!player) return false;
          const playerId = player._id?.toString() || player.toString() || player._id || player;
          return playerId === userId;
        });

        if (userInSubMatch && subMatch.games) {
          // Filter shots to only current user's shots
          const userSubMatchGames = subMatch.games.map((game: any) => {
            const userShots = (game.shots || []).filter((shot: any) => {
              const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString() || shot.player;
              return shotPlayerId === userId;
            });
            return {
              ...game,
              shots: userShots,
            };
          }).filter((game: any) => game.shots.length > 0);
          
          userGames.push(...userSubMatchGames);
        }
      }
    }

    // Analyze weaknesses for current user only
    if (userGames.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Insufficient data for weakness analysis in this match.",
        data: null,
      });
    }

    // For opponent pattern analysis, we need ALL shots (user and opponent)
    // So we pass the unfiltered games for that analysis
    const allGamesUnfiltered = category === "individual" 
      ? (match.games || [])
      : (() => {
          const subMatches = match.subMatches || [];
          const unfiltered: any[] = [];
          for (const subMatch of subMatches) {
            if (subMatch.games) {
              unfiltered.push(...subMatch.games);
            }
          }
          return unfiltered;
        })();

    // Analyze weaknesses: pass both userGames (for user-specific analyses) and allGamesUnfiltered (for analyses needing both sides)
    // This avoids duplicate calculations and makes the data requirements clear
    const weaknessAnalysis = analyzeWeaknesses(allGamesUnfiltered, userId, undefined, userGames);

    // Collect all shots from userGames for visualization
    const allShots: any[] = [];
    userGames.forEach((game: any) => {
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
        matchId,
        category,
        participant: {
          userId: userId,
          name: userParticipant.fullName || userParticipant.username,
          profileImage: userParticipant.profileImage,
          weaknesses: weaknessAnalysis,
          shots: allShots, // Include shots for visualization
        },
        // Include data limitation metadata
        meta: {
          dataLimitation: weaknessAnalysis.dataLimitation,
          note: "Analysis is based on winning shots only. Rally data and intermediate shots are not available.",
        },
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

