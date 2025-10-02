// app/api/teams/route.ts
import { NextResponse } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";

export async function GET() {
  try {
    const teams = await Team.find()
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName");

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, city, captain, players } = body;

    // Validate required fields
    if (!name || !captain || !players || players.length < 2) {
      return NextResponse.json(
        { message: "Name, captain, and at least 2 players are required" },
        { status: 400 }
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
      { path: "captain", select: "username fullName" },
      { path: "players.user", select: "username fullName" },
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