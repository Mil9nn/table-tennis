import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    const team = await Team.findById(id)
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage");

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const playersWithAssignments = team.players.map((p: any) => {
      const playerId = p.user._id.toString();
      let assignment = null;
      
      if (team.assignments) {
        if (team.assignments instanceof Map) {
          assignment = team.assignments.get(playerId);
        } else if (typeof team.assignments === 'object') {
          assignment = (team.assignments as any)[playerId];
        }
      }
      
      return {
        ...p.toObject(),
        assignment: assignment || null,
      };
    });

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

    // ✅ Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // ✅ Ensure both IDs are strings for comparison
    const captainId = team.captain._id?.toString() || team.captain.toString();
    const userId = decoded.userId.toString();

    if (captainId !== userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can edit the team" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignments, players, ...rest } = body;

    const updateData: any = { ...rest };

    // ✅ Format players array to match schema
    if (players && Array.isArray(players)) {
      // Validate all player IDs exist
      const playerDocs = await User.find({ _id: { $in: players } });
      if (playerDocs.length !== players.length) {
        return NextResponse.json(
          { message: "One or more players not found" },
          { status: 400 }
        );
      }

      // Format players to match schema structure
      updateData.players = playerDocs.map((p) => ({
        user: p._id,
        role: p._id.toString() === captainId ? "captain" : "player",
        joinedDate: new Date(),
      }));
    }

    // ✅ Convert assignments object to Map if provided
    if (assignments) {
      updateData.assignments = new Map(Object.entries(assignments));
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage");

    return NextResponse.json({ message: "Team updated successfully", team: updatedTeam });
  } catch (error: any) {
    console.error("Error updating team:", error);
    return NextResponse.json({ 
      message: "Server error", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // ✅ Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // ✅ Ensure both IDs are strings for comparison
    const captainId = team.captain._id?.toString() || team.captain.toString();
    const userId = decoded.userId.toString();

    if (captainId !== userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can delete the team" },
        { status: 403 }
      );
    }

    await Team.findByIdAndDelete(id);

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}