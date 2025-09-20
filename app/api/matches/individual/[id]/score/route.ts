import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const side1Score = Number(body.side1Score ?? 0);
    const side2Score = Number(body.side2Score ?? 0);
    const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);

    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      currentGame = { gameNumber, side1Score: 0, side2Score: 0, shots: [] };
      match.games.push(currentGame);
    }

    // update score
    currentGame.side1Score = side1Score;
    currentGame.side2Score = side2Score;

    // check if this game just ended
    if (body.gameWinner && !currentGame.winner) {
      currentGame.winner = body.gameWinner;

      if (body.gameWinner === "side1") match.finalScore.side1Sets++;
      if (body.gameWinner === "side2") match.finalScore.side2Sets++;

      // advance currentGame
      match.currentGame = gameNumber + 1;

      match.games.push({
        gameNumber: match.currentGame,
        side1Score: 0,
        side2Score: 0,
        shots: [],
      })

      // check if match should end
      const targetSets = Math.floor(match.numberOfSets / 2) + 1;
      if (
        match.finalScore.side1Sets >= targetSets ||
        match.finalScore.side2Sets >= targetSets
      ) {
        match.status = "completed";
        match.winner =
          match.finalScore.side1Sets > match.finalScore.side2Sets
            ? "player1"
            : "player2";
      } else {
        // create placeholder for next game
        match.games.push({
          gameNumber: match.currentGame,
          side1Score: 0,
          side2Score: 0,
          shots: [],
        });
      }
    }

    // persist shot if provided
    if (body.shotData) {
      currentGame.shots.push({
        shotNumber: (currentGame.shots?.length || 0) + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        shotType: body.shotData.shotType,
        result: body.shotData.result || "in_play",
        timestamp: new Date(),
      });
    }

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match, message: "Score updated" });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }
}