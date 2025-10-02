// app/api/matches/team/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

// Format requirements mapping
const FORMAT_REQUIREMENTS: Record<string, { team1: string[], team2: string[] }> = {
  "swaythling_format": { team1: ["A", "B", "C"], team2: ["X", "Y", "Z"] },
  "single_double_single": { team1: ["A", "B"], team2: ["X", "Y"] },
  "five_singles_full": { team1: ["A", "B", "C", "D", "E"], team2: ["X", "Y", "Z", "P", "Q"] },
  "three_singles": { team1: ["A", "B", "C"], team2: ["X", "Y", "Z"] },
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const scorer = await User.findById(decoded.userId);
    if (!scorer) {
      return NextResponse.json({ error: "Invalid scorer" }, { status: 400 });
    }

    // Validate required fields
    if (!body.matchType || !body.setsPerTie || !body.city || !body.team1Id || !body.team2Id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (body.team1Id === body.team2Id) {
      return NextResponse.json({ error: "Team 1 and Team 2 cannot be the same" }, { status: 400 });
    }

    // Fetch teams with full player data
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
      "custom": "three_singles",
    };

    const internalFormat = formatMap[body.matchType] || "three_singles";

    // Get format requirements
    const requirements = FORMAT_REQUIREMENTS[internalFormat];
    
    // Check if teams have valid assignments for this format
    const team1Assignments = team1Doc.assignments || new Map();
    const team2Assignments = team2Doc.assignments || new Map();

    const team1Values = Array.from(team1Assignments.values());
    const team2Values = Array.from(team2Assignments.values());

    const team1HasRequired = requirements.team1.every(req => team1Values.includes(req));
    const team2HasRequired = requirements.team2.every(req => team2Values.includes(req));

    let warningMessage = null;
    if (!team1HasRequired || !team2HasRequired) {
      warningMessage = `⚠️ Teams need player assignments before match can start. Required positions: ${requirements.team1.join(", ")} vs ${requirements.team2.join(", ")}`;
    }

    // Create match with embedded team data
    const match = new TeamMatch({
      matchCategory: "team",
      format: internalFormat,
      numberOfSetsPerSubMatch: Number(body.setsPerTie),
      city: body.city,
      venue: body.venue || body.city,
      scorer: scorer._id,
      
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

      subMatches: [],
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

    return NextResponse.json({ 
      message: warningMessage || "Team match created",
      match,
      requiresAssignments: !team1HasRequired || !team2HasRequired,
      team1Id: team1Doc._id,
      team2Id: team2Doc._id,
    }, { status: 201 });

  } catch (err: any) {
    console.error("Error creating team match:", err);
    return NextResponse.json({ 
      error: "Failed to create match",
      details: err.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const matches = await TeamMatch.find()
      .populate("scorer", "username fullName")
      .populate("team1.players", "username fullName")
      .populate("team2.players", "username fullName")
      .populate("subMatches.team1Players", "username fullName")
      .populate("subMatches.team2Players", "username fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Error fetching team matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}