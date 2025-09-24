import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await TeamMatch.findById(id)
      .populate("scorer", "username fullName")
      .populate({
        path: "team1",
        populate: { path: "players.user", select: "username fullName" },
      })
      .populate({
        path: "team2",
        populate: { path: "players.user", select: "username fullName" },
      });

    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching team match:", error);
    return NextResponse.json({ error: "Failed to fetch team match" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();

    const { id } = await params;

    const match = await TeamMatch.findByIdAndUpdate(id, { $set: body }, { new: true })
      .populate("scorer", "username fullName")
      .populate({
        path: "team1",
        populate: { path: "players.user", select: "username fullName" },
      })
      .populate({
        path: "team2",
        populate: { path: "players.user", select: "username fullName" },
      });

    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    return NextResponse.json({ match, message: "Team match updated successfully" });
  } catch (error) {
    console.error("Error updating team match:", error);
    return NextResponse.json({ error: "Failed to update team match" }, { status: 500 });
  }
}