import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ Auth check
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const scorer = await User.findById(decoded.userId);
    if (!scorer) return NextResponse.json({ error: "Invalid scorer" }, { status: 400 });

    // ✅ Validate inputs
    if (!body.matchType || !body.setsPerTie || !body.city || !body.team1Id || !body.team2Id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (body.team1Id === body.team2Id) {
      return NextResponse.json({ error: "Team 1 and Team 2 cannot be the same" }, { status: 400 });
    }

    const [team1, team2] = await Promise.all([
      Team.findById(body.team1Id),
      Team.findById(body.team2Id),
    ]);

    if (!team1 || !team2) {
      return NextResponse.json({ error: "Invalid team IDs" }, { status: 400 });
    }

    const match = new TeamMatch({
      matchType: body.matchType,
      matchCategory: "team",
      setsPerTie: Number(body.setsPerTie),
      city: body.city,
      venue: body.venue || body.city,
      team1: team1._id,
      team2: team2._id,
      scorer: scorer._id,
    });

    await match.save();
    await match.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1", populate: { path: "players.user", select: "username fullName" } },
      { path: "team2", populate: { path: "players.user", select: "username fullName" } },
    ]);

    return NextResponse.json({ message: "Team match created", match }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating team match:", err);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const matches = await TeamMatch.find()
      .populate("scorer", "username fullName")
      .populate({
        path: "team1",
        populate: { path: "players.user", select: "username fullName" },
      })
      .populate({
        path: "team2",
        populate: { path: "players.user", select: "username fullName" },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Error fetching team matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}