import { NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  await connectDB();

  try {
    const { winnerTeam } = await req.json();
    const { matchId } = params;

    const teamMatch = await TeamMatch.findById(matchId);
    if (!teamMatch)
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    teamMatch.status = "completed";
    teamMatch.winnerTeam = winnerTeam;

    await teamMatch.save();

    return NextResponse.json({
      success: true,
      message: `Match completed. Winner: ${winnerTeam}`,
      teamMatch,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to complete team match" },
      { status: 500 }
    );
  }
}
