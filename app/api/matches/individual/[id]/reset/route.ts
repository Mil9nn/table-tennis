import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { resetType } = await req.json(); // "game" | "match"

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (!["scheduled", "in_progress", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (resetType === "game") {
      const currentGameNum = match.currentGame ?? 1;
      const idx = Math.max(0, currentGameNum - 1);

      if (!match.games[idx]) {
        match.games[idx] = {
          gameNumber: currentGameNum,
          side1Score: 0,
          side2Score: 0,
          shots: [],
        };
      } else {
        match.games[idx].side1Score = 0;
        match.games[idx].side2Score = 0;
        match.games[idx].winner = undefined;
        match.games[idx].shots = [];
      }

      // don’t mark as scheduled if match is ongoing
      if (match.status !== "completed") {
        match.status = "in_progress";
      }
    } else {
      // full match reset
      match.games = [
        {
          gameNumber: 1,
          side1Score: 0,
          side2Score: 0,
          shots: [],
        },
      ];
      match.currentGame = 1;
      match.finalScore = { side1Sets: 0, side2Sets: 0 };
      match.winner = undefined;
      match.status = "scheduled";
      match.matchDuration = 0;
    }

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset match" },
      { status: 500 }
    );
  }
}
