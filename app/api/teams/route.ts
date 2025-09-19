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
        assignment: t.assignments.get(p.user._id.toString()) || null,
      }));
      return { ...t.toObject(), players: playersWithAssignments };
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

    const existing = await Team.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "Team name already exists" },
        { status: 400 }
      );
    }

    // find captain by ObjectId
    const captainUser = await User.findById(captain);

    if (!captainUser) {
      return NextResponse.json(
        { message: `Captain not found` },
        { status: 400 }
      );
    }

    // find players by ObjectId
    const playerDocs = await User.find({ _id: { $in: players } });
    if (playerDocs.length !== players.length) {
      return NextResponse.json(
        { message: "One or more players not found" },
        { status: 400 }
      );
    }

    // map to correct schema
    const formattedPlayers = playerDocs.map((p) => ({
      user: p._id,
      role: "player",
    }));

    const team = new Team({
      name,
      city,
      captain: captainUser._id,
      players: formattedPlayers,
    });

    await team.save();

    return NextResponse.json(
      { message: "Team created successfully", team },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating team:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
