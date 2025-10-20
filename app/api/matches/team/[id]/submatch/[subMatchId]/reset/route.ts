// app/api/matches/team/[id]/submatch/[subMatchId]/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();
    const { id, subMatchId } = await context.params;
    const { resetType } = await req.json();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subMatchIndex = parseInt(subMatchId);
    const subMatch = match.subMatches[subMatchIndex];

    if (!subMatch) {
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    if (resetType === "game") {
      // Reset current game only
      const currentGameNum = subMatch.games?.length || 1;
      const gameIndex = subMatch.games.findIndex(
        (g: any) => g.gameNumber === currentGameNum
      );

      if (gameIndex >= 0) {
        subMatch.games[gameIndex].team1Score = 0;
        subMatch.games[gameIndex].team2Score = 0;
        subMatch.games[gameIndex].winnerSide = undefined;
        subMatch.games[gameIndex].shots = [];
      }

      // If submatch was completed, revert it
      if (subMatch.status === "completed") {
        subMatch.status = "in_progress";
        subMatch.winnerSide = undefined;

        // Recalculate set scores from completed games
        const completedGames = subMatch.games.filter((g: any) => g.winnerSide);
        subMatch.finalScore = {
          team1Sets: completedGames.filter((g: any) => g.winnerSide === "team1").length,
          team2Sets: completedGames.filter((g: any) => g.winnerSide === "team2").length,
        };

        // Also revert team match if it was completed
        if (match.status === "completed") {
          match.status = "in_progress";
          match.winnerTeam = undefined;
        }
      }
    } else {
      // Full submatch reset
      subMatch.games = [
        {
          gameNumber: 1,
          team1Score: 0,
          team2Score: 0,
          shots: [],
          winnerSide: undefined,
          completed: false,
        },
      ];
      subMatch.finalScore = { team1Sets: 0, team2Sets: 0 };
      subMatch.winnerSide = undefined;
      subMatch.status = "scheduled";
      subMatch.completed = false;
    }

    match.markModified("subMatches");
    await match.save();

    const updatedMatch = await TeamMatch.findById(match._id)
      .populate("scorer", "username fullName")
      .populate("team1.captain team2.captain", "username fullName")
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage")
      .populate("subMatches.games.shots.player", "username fullName profileImage");

    return NextResponse.json({ match: updatedMatch });
  } catch (err) {
    console.error("SubMatch reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset submatch" },
      { status: 500 }
    );
  }
}