import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const { resetType } = await req.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (resetType === "game") {
      const currentGameNum = match.currentGame ?? 1;
      
      // ✅ FIXED: Find current game properly
      const gameIndex = match.games.findIndex((g: any) => g.gameNumber === currentGameNum);

      if (gameIndex >= 0) {
        // ✅ Reset existing game
        match.games[gameIndex].side1Score = 0;
        match.games[gameIndex].side2Score = 0;
        match.games[gameIndex].winner = undefined;
        match.games[gameIndex].shots = [];
      } else {
        // ✅ Create fresh current game
        match.games.push({
          gameNumber: currentGameNum,
          side1Score: 0,
          side2Score: 0,
          shots: [],
          winner: undefined
        });
      }

      // ✅ FIXED: If match was completed, revert status and recalculate sets
      if (match.status === "completed") {
        match.status = "in_progress";
        match.winner = undefined;
        
        // Recalculate set scores from completed games only
        const completedGames = match.games.filter((g: any) => g.winner);
        match.finalScore.side1Sets = completedGames.filter((g: any) => g.winner === "side1").length;
        match.finalScore.side2Sets = completedGames.filter((g: any) => g.winner === "side2").length;
      }

    } else {
      // ✅ FULL MATCH RESET
      match.games = [
        {
          gameNumber: 1,
          side1Score: 0,
          side2Score: 0,
          shots: [],
          winner: undefined
        },
      ];
      match.currentGame = 1;
      match.finalScore = { side1Sets: 0, side2Sets: 0 };
      match.winner = undefined;
      match.status = "scheduled";
      match.matchDuration = 0;
    }

    await match.save();
    await match.populate("participants", "username fullName")
    .populate("games.shots.player", "username fullName");

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset match" },
      { status: 500 }
    );
  }
}