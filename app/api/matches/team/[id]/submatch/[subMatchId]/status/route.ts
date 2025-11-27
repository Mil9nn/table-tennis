import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();

    const { id, subMatchId } = await context.params;

    const body = await req.json();

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const subMatch = match.subMatches.id(subMatchId);

    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    // Update submatch status
    if (body.status) {
      subMatch.status = body.status;

      if (body.status === "scheduled") {
        subMatch.winnerSide = null;
        subMatch.completed = false;
        subMatch.games = [];
        subMatch.finalScore = { team1Sets: 0, team2Sets: 0 };
      }

      match.markModified("subMatches");
      await match.save();

      const updatedMatch = await TeamMatch.findById(match._id)
        .populate(
          "team1.players.user team2.players.user",
          "username fullName profileImage"
        )
        .populate(
          "subMatches.playerTeam1 subMatches.playerTeam2",
          "username fullName profileImage"
        );

      return NextResponse.json({
        match: updatedMatch,
        message: "SubMatch status updated",
      });
    } else {
      return NextResponse.json(
        { error: "Status not provided" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("SubMatch status update error:", err);
    return NextResponse.json(
      {
        error: "Failed to update submatch status",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

// Optional: GET to fetch a submatch with logs
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();

    const { id, subMatchId } = await context.params;
    const match = await TeamMatch.findById(id)
      .populate("team1.players.user team2.players.user", "username fullName")
      .populate(
        "subMatches.playerTeam1 subMatches.playerTeam2",
        "username fullName"
      );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const subMatch = match.subMatches.id(subMatchId);

    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subMatch });
  } catch (err) {
    console.error("Error fetching submatch:", err);
    return NextResponse.json(
      { error: "Failed to fetch submatch", details: (err as Error).message },
      { status: 500 }
    );
  }
}
