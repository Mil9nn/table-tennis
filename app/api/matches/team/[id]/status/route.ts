import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    const match = await TeamMatch.findById(id)
      .populate("team1.players.user", "username fullName")
      .populate("team2.players.user", "username fullName");

    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

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
      .populate("team1.players.user", "username fullName")
      .populate("team2.players.user", "username fullName");

    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    return NextResponse.json({ match, message: "Team match status updated" });
  } catch (error) {
    console.error("Error updating team match:", error);
    return NextResponse.json({ error: "Failed to update team match" }, { status: 500 });
  }
}
