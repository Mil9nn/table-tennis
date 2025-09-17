import { NextResponse } from "next/server";
import Team from "@/models/Team";

export async function GET() {
  try {
    const teams = await Team.find()
      .populate("captain", "username name")
      .populate("players.user", "username name");

    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, logoUrl, city, description, captain, players } = body;

    const existing = await Team.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "Team name already exists" },
        { status: 400 }
      );
    }

    const team = new Team({
      name,
      logoUrl,
      city,
      description,
      captain,
      players, // [{ user: ObjectId, role: "player" }]
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