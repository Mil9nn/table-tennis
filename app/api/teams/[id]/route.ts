import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const team = await Team.findById(id)
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName");

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // Merge assignments into players
    const playersWithAssignments = team.players.map((p: any) => ({
      ...p.toObject(),
      assignment: team.assignments.get(p.user._id.toString()) || null,
    }));

    return NextResponse.json({
      team: { ...team.toObject(), players: playersWithAssignments },
    });
  } catch (error: any) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { assignments, ...rest } = body;

    const { id } = await context.params;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      {
        $set: {
          ...rest,
          ...(assignments
            ? { assignments: new Map(Object.entries(assignments)) }
            : {}),
        },
      },
      { new: true }
    )
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName");

    if (!updatedTeam) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team updated", team: updatedTeam });
  } catch (error: any) {
    console.error("Error updating team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await Team.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted" });
  } catch (error: any) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
