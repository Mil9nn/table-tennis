import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;
    const { resetType } = await req.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can reset match
    const scorerId = match.scorer?.toString();
    if (scorerId && scorerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the scorer can reset this match" },
        { status: 403 }
      );
    }

    if (resetType === "game") {
      const currentGameNum = match.currentGame ?? 1;
      
      // ✅ FIXED: Find current game properly
      const gameIndex = match.games.findIndex((g: any) => g.gameNumber === currentGameNum);

      if (gameIndex >= 0) {
        // ✅ Reset existing game
        match.games[gameIndex].side1Score = 0;
        match.games[gameIndex].side2Score = 0;
        match.games[gameIndex].winnerSide = undefined;
        match.games[gameIndex].shots = [];
      } else {
        // ✅ Create fresh current game
        match.games.push({
          gameNumber: currentGameNum,
          side1Score: 0,
          side2Score: 0,
          shots: [],
          winnerSide: undefined
        });
      }

      // ✅ FIXED: If match was completed, revert status and recalculate sets
      if (match.status === "completed") {
        match.status = "in_progress";
        match.winnerSide = undefined;
        
        // Recalculate set scores from completed games only
        const completedGames = match.games.filter((g: any) => g.winnerSide);
        match.finalScore.side1Sets = completedGames.filter((g: any) => g.winnerSide === "side1").length;
        match.finalScore.side2Sets = completedGames.filter((g: any) => g.winnerSide === "side2").length;
      }

    } else {
      // ✅ FULL MATCH RESET
      match.games = [
        {
          gameNumber: 1,
          side1Score: 0,
          side2Score: 0,
          shots: [],
          winnerSide: undefined
        },
      ];
      match.currentGame = 1;
      match.finalScore = { side1Sets: 0, side2Sets: 0 };
      match.winnerSide = undefined;
      match.status = "scheduled";
      match.matchDuration = 0;
    }

    await match.save();
    await match.populate([
      { path: "participants", select: "username fullName" },
      { path: "games.shots.player", select: "username fullName" }
    ]);

    return NextResponse.json({ match: match.toObject() });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reset match" },
      { status: 500 }
    );
  }
}