import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const match = await IndividualMatch.findById(id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const side1Score = Number(body.side1Score ?? 0);
    const side2Score = Number(body.side2Score ?? 0);
    const gameNumber = Number(body.gameNumber ?? 1);

    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      currentGame = { gameNumber, side1Score: 0, side2Score: 0, shots: [] };
      match.games.push(currentGame);
    }

    currentGame.side1Score = side1Score;
    currentGame.side2Score = side2Score;

    // winner logic...
    if (body.gameWinner && !currentGame.winner) {
      currentGame.winner = body.gameWinner;
      if (body.gameWinner === "side1") match.finalScore.side1Sets++;
      if (body.gameWinner === "side2") match.finalScore.side2Sets++;
    }

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match, message: "Score updated" });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
