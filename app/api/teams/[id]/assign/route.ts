import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    // ✅ Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;

    // ✅ Check if team exists and user is captain
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    if (team.captain.toString() !== decoded.userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can assign positions" },
        { status: 403 }
      );
    }

    const { assignments } = await req.json();

    if (!assignments) {
      return NextResponse.json(
        { message: "Assignments are required" },
        { status: 400 }
      );
    }

    // Convert assignments object to Map
    team.assignments = new Map(Object.entries(assignments));
    await team.save();

    await team.populate([
      { path: "captain", select: "username fullName" },
      { path: "players.user", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({ 
      message: "Player positions assigned successfully",
      team 
    });
  } catch (error: any) {
    console.error("Error assigning positions:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}