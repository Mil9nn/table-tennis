import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";

export async function GET(
  req: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  await connectDB();

  try {
    const { matchId } = await context.params;

    const match = await TeamMatch.findById(matchId)
      // Populate teams and their players
      .populate([
        {
          path: "team1",
          select: "name players assignments",
          populate: {
            path: "players.user",
            select: "username fullName profileImage _id",
          },
        },
        {
          path: "team2",
          select: "name players assignments",
          populate: {
            path: "players.user",
            select: "username fullName profileImage _id",
          },
        },
        // Populate scorer
        { path: "scorer", select: "username fullName profileImage _id" },
        // Populate submatch players
        {
          path: "subMatches.team1Players",
          select: "username fullName profileImage _id",
        },
        {
          path: "subMatches.team2Players",
          select: "username fullName profileImage _id",
        },
        // Populate shots players
        {
          path: "subMatches.games.shots.player",
          select: "username fullName profileImage _id",
        },
      ]);

    if (!match) {
      return NextResponse.json(
        { error: "Team match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, match });
  } catch (err: any) {
    console.error("❌ Failed to fetch team match:", err);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
