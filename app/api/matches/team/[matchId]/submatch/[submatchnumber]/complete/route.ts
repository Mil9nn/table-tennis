import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";

export async function POST(
  req: Request,
  { params }: { params: { matchId: string; subMatchNumber: string } }
) {
  await connectDB();

  try {
    const { winnerSide, finalScore } = await req.json();
    const { matchId, subMatchNumber } = params;

    const teamMatch = await TeamMatch.findById(matchId);
    if (!teamMatch)
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    const index = parseInt(subMatchNumber) - 1;
    const subMatch = teamMatch.subMatches[index];
    if (!subMatch)
      return NextResponse.json({ error: "Submatch not found" }, { status: 404 });

    // ✅ Update the submatch
    subMatch.winnerSide = winnerSide;
    subMatch.finalScore = finalScore;
    subMatch.completed = true;

    // ✅ Update team totals
    if (winnerSide === "team1") teamMatch.finalScore.team1Matches += 1;
    else if (winnerSide === "team2") teamMatch.finalScore.team2Matches += 1;

    // Move pointer
    teamMatch.currentSubMatch = index + 2;

    // ✅ Check if overall match is done
    const total = teamMatch.subMatches.length;
    const majority = Math.ceil(total / 2);

    if (
      teamMatch.finalScore.team1Matches >= majority ||
      teamMatch.finalScore.team2Matches >= majority
    ) {
      teamMatch.status = "completed";
      teamMatch.winnerTeam =
        teamMatch.finalScore.team1Matches > teamMatch.finalScore.team2Matches
          ? "team1"
          : "team2";
    }

    await teamMatch.save();

    return NextResponse.json({
      success: true,
      teamMatch,
      message: `Submatch ${subMatchNumber} completed successfully`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update submatch" },
      { status: 500 }
    );
  }
}
