import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { winnerSide } = await req.json(); // "team1" or "team2"

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    // Increment team match score
    if (winnerSide === "team1") match.finalScore.team1Matches += 1;
    else if (winnerSide === "team2") match.finalScore.team2Matches += 1;

    // Check if team match is won
    const isTeamMatchWon =
      match.finalScore.team1Matches >= 3 || match.finalScore.team2Matches >= 3;

    if (isTeamMatchWon) {
      match.status = "completed";
      match.winnerTeam =
        match.finalScore.team1Matches > match.finalScore.team2Matches
          ? "team1"
          : "team2";
      match.completedAt = new Date();
    } else {
      // Move to next submatch
      match.currentSubMatch += 1;
    }

    await match.save();

    const updated = await TeamMatch.findById(id)
      .populate("team1.players.user", "username fullName")
      .populate("team2.players.user", "username fullName");

    return NextResponse.json({
      match: updated,
      message: isTeamMatchWon ? "Team match completed!" : "Submatch result recorded",
    });
  } catch (error) {
    console.error("Error updating team match score:", error);
    return NextResponse.json(
      { error: "Failed to update team match score", details: (error as Error).message },
      { status: 500 }
    );
  }
}
