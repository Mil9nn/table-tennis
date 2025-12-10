import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { withAuth } from "@/lib/api-utils";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const { resetType } = await req.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can reset match
    const scorerId = match.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
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
        match.games[gameIndex].winnerSide = null;
        match.games[gameIndex].shots = [];
      } else {
        // ✅ Create fresh current game
        match.games.push({
          gameNumber: currentGameNum,
          side1Score: 0,
          side2Score: 0,
          shots: [],
          winnerSide: null
        });
      }

      // ✅ FIXED: If match was completed, revert status and recalculate sets
      if (match.status === "completed") {
        match.status = "in_progress";
        match.winnerSide = null;

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
          winnerSide: null
        },
      ];
      match.currentGame = 1;
      match.finalScore = { side1Sets: 0, side2Sets: 0 };
      match.winnerSide = null;
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