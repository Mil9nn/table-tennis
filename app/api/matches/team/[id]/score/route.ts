import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const match = await TeamMatch.findById(id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const { tieNumber, gameNumber = 1, side1Score = 0, side2Score = 0 } = body;
    if (!tieNumber) return NextResponse.json({ error: "Tie number required" }, { status: 400 });

    const tie = match.ties.find((t: any) => t.tieNumber === Number(tieNumber));
    if (!tie) return NextResponse.json({ error: "Invalid tie number" }, { status: 400 });

    let currentGame = tie.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      currentGame = { gameNumber, side1Score: 0, side2Score: 0, shots: [] };
      tie.games.push(currentGame);
    }

    currentGame.side1Score = side1Score;
    currentGame.side2Score = side2Score;

    if (body.gameWinner && !currentGame.winner) {
      currentGame.winner = body.gameWinner;
      if (body.gameWinner === "team1") match.finalScore.side1Ties++;
      if (body.gameWinner === "team2") match.finalScore.side2Ties++;
    }

    await match.save();
    await match.populate([
      { path: "team1", populate: { path: "players.user", select: "username fullName" } },
      { path: "team2", populate: { path: "players.user", select: "username fullName" } },
    ]);

    return NextResponse.json({ match, message: "Team score updated" });
  } catch (err) {
    console.error("Team score update error:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
