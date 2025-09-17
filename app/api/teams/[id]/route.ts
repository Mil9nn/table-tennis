import { NextResponse } from "next/server";
import Team from "@/models/Team";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await Team.findById(params.id)
      .populate("captain", "username name")
      .populate("players.user", "username name");

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updatedTeam = await Team.findByIdAndUpdate(params.id, body, {
      new: true,
    })
      .populate("captain", "username name")
      .populate("players.user", "username name");

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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await Team.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted" });
  } catch (error: any) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
