// app/api/matches/team/route.ts - UPDATED
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
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

    const [team1Doc, team2Doc] = await Promise.all([
      Team.findById(body.team1Id).populate("players.user", "username fullName"),
      Team.findById(body.team2Id).populate("players.user", "username fullName"),
    ]);

    if (!team1Doc || !team2Doc) {
      return NextResponse.json({ error: "Invalid team IDs" }, { status: 400 });
    }

    // Map format name to internal format
    const formatMap: Record<string, string> = {
      "five_singles": "swaythling_format",
      "single_double_single": "single_double_single",
      "extended_format": "five_singles_full",
      "three_singles": "three_singles",
      "custom": "three_singles", // default to 3 singles for custom
    };

    const internalFormat = formatMap[body.matchType] || "three_singles";

    // Create match with embedded team data
    const match = new TeamMatch({
      matchCategory: "team",
      format: internalFormat,
      numberOfSetsPerSubMatch: Number(body.setsPerTie),
      city: body.city,
      venue: body.venue || body.city,
      scorer: scorer._id,
      
      // Embed team data
      team1: {
        name: team1Doc.name,
        players: team1Doc.players.map((p: any) => p.user._id),
        assignments: team1Doc.assignments || new Map(),
      },
      team2: {
        name: team2Doc.name,
        players: team2Doc.players.map((p: any) => p.user._id),
        assignments: team2Doc.assignments || new Map(),
      },

      subMatches: [], // Will be generated when match starts
      currentSubMatch: 1,
      finalScore: { team1Matches: 0, team2Matches: 0 },
      status: "scheduled",
    });

    await match.save();

    // Populate for response
    await match.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1.players", select: "username fullName" },
      { path: "team2.players", select: "username fullName" },
    ]);

    return NextResponse.json({ message: "Team match created", match }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating team match:", err);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const matches = await TeamMatch.find()
      .populate("scorer", "username fullName")
      .populate("team1.players", "username fullName")
      .populate("team2.players", "username fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Error fetching team matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}