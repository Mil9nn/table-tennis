// app/api/teams/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    const teams = await Team.find()
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage");

    const formatted = teams.map((t) => {
      const playersWithAssignments = t.players.map((p: any) => ({
        ...p.toObject(),
        assignment: t.assignments?.get(p.user._id.toString()) || null,
      }));

      // Check if team has any assignments
      const hasAssignments = t.assignments && t.assignments.size > 0;

      return { 
        ...t.toObject(), 
        players: playersWithAssignments,
        hasAssignments, // ✅ Add this flag for frontend
      };
    });

    return NextResponse.json({ teams: formatted });
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, city, captain, players } = body;

    // Validate required fields
    if (!name || !captain || !players || players.length < 2) {
      return NextResponse.json(
        { message: "Name, captain, and at least 2 players are required" },
        { status: 400 }
      );
    }

    // ✅ Verify that the authenticated user is the captain
    if (captain !== decoded.userId) {
      return NextResponse.json(
        { message: "You can only create a team where you are the captain" },
        { status: 403 }
      );
    }

    // Check if team name exists
    const existing = await Team.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "Team name already exists" },
        { status: 400 }
      );
    }

    // Validate captain exists
    const captainUser = await User.findById(captain);
    if (!captainUser) {
      return NextResponse.json(
        { message: "Captain not found" },
        { status: 400 }
      );
    }

    // Validate all players exist
    const playerDocs = await User.find({ _id: { $in: players } });
    if (playerDocs.length !== players.length) {
      return NextResponse.json(
        { message: "One or more players not found" },
        { status: 400 }
      );
    }

    // Format players for schema
    const formattedPlayers = playerDocs.map((p) => ({
      user: p._id,
      role: "player",
    }));

    const team = new Team({
      name,
      city,
      captain: captainUser._id,
      players: formattedPlayers,
      assignments: new Map(), // Initialize empty assignments
    });

    await team.save();

    // Populate for response
    await team.populate([
      { path: "captain", select: "username fullName profileImage" },
      { path: "players.user", select: "username fullName profileImage" },
    ]);

    return NextResponse.json(
      { 
        message: "Team created successfully. Don't forget to assign player positions!",
        team,
        needsAssignments: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { message: "Server error", details: error.message },
      { status: 500 }
    );
  }
}