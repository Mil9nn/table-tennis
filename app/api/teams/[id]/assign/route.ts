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

    const { assignments, format } = await req.json();

    if (!assignments) {
      return NextResponse.json(
        { message: "Assignments are required" },
        { status: 400 }
      );
    }

    // Validate assignments based on format
    const assignmentEntries = Object.entries(assignments);
    const positions = assignmentEntries.map(([, pos]) => pos);
    const playerIds = assignmentEntries.map(([id]) => id);

    // Check for duplicate positions (same position assigned to multiple players)
    const positionCounts = positions.reduce((acc: Record<string, number>, pos) => {
      const posStr = String(pos);
      acc[posStr] = (acc[posStr] || 0) + 1;
      return acc;
    }, {});

    const duplicatePositions = Object.entries(positionCounts)
      .filter(([, count]) => count > 1)
      .map(([pos]) => pos);

    if (duplicatePositions.length > 0) {
      return NextResponse.json(
        { 
          message: `Duplicate position assignments: ${duplicatePositions.join(", ")}. Each position can only be assigned to one player.`,
          duplicates: duplicatePositions 
        },
        { status: 400 }
      );
    }

    // Check for duplicate players (same player assigned to multiple positions)
    const playerCounts = playerIds.reduce((acc: Record<string, number>, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const duplicatePlayers = Object.entries(playerCounts)
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

    if (duplicatePlayers.length > 0) {
      return NextResponse.json(
        { 
          message: "A player can only be assigned to one position",
          duplicatePlayers 
        },
        { status: 400 }
      );
    }

    // Validate positions based on format (if provided)
    const validPositions = ["A", "B", "C", "X", "Y", "Z"];
    const invalidPositions = positions.filter(pos => !validPositions.includes(String(pos)));
    
    if (invalidPositions.length > 0) {
      return NextResponse.json(
        { 
          message: `Invalid positions: ${invalidPositions.join(", ")}. Valid positions are: A, B, C (for home team) or X, Y, Z (for away team)`,
          invalidPositions 
        },
        { status: 400 }
      );
    }

    // For five_singles format, validate that we have consistent team positions
    if (format === "five_singles") {
      const hasHomePositions = positions.some(p => ["A", "B", "C"].includes(String(p)));
      const hasAwayPositions = positions.some(p => ["X", "Y", "Z"].includes(String(p)));
      
      if (hasHomePositions && hasAwayPositions) {
        return NextResponse.json(
          { 
            message: "Cannot mix home team positions (A, B, C) with away team positions (X, Y, Z). Choose one set.",
          },
          { status: 400 }
        );
      }

      // Warn if not all positions are filled for five_singles
      const requiredPositions = hasHomePositions ? ["A", "B", "C"] : ["X", "Y", "Z"];
      const missingPositions = requiredPositions.filter(pos => !positions.includes(pos));
      
      // Note: We allow partial assignments but log a warning
      if (missingPositions.length > 0) {
        console.warn(`[Team ${id}] Missing positions for five_singles: ${missingPositions.join(", ")}`);
      }
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