import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    const match = await TeamMatch.findById(id)
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("team1.captain team2.captain", "username fullName")
      .populate("scorer", "username fullName profileImage")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage")
      .populate({ path: "subMatches.games.shots.player", select: "username fullName profileImage" });

    if (!match) return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching team match:", error);
    return NextResponse.json({ error: "Failed to fetch team match" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await req.json();

    const match = await TeamMatch.findByIdAndUpdate(id, { $set: body }, { new: true })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("team1.captain team2.captain", "username fullName")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage")
      .populate({ path: "subMatches.games.shots.player", select: "username fullName profileImage" });

    if (!match) return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    return NextResponse.json({ match, message: "Team match updated successfully" });
  } catch (error) {
    console.error("Error updating team match:", error);
    return NextResponse.json({ error: "Failed to update team match" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const deleted = await TeamMatch.findByIdAndDelete(id);

    if (!deleted) return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    return NextResponse.json({ message: "Team match deleted successfully" });
  } catch (error) {
    console.error("Error deleting team match:", error);
    return NextResponse.json({ error: "Failed to delete team match" }, { status: 500 });
  }
}