import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { SubMatch } from "@/types/match.type";
import mongoose from "mongoose";

/*
 Generate submatches for Swaythling Cup (5 singles: A-X, B-Y, C-Z, A-Y, B-X)
 */
function generateFiveSinglesSubmatches(
  team1: any,
  team2: any,
  setsPerTie: number
) {
  const submatches = [] as SubMatch[];

  const team1AssignmentsRaw = team1.assignments || {};
  const team2AssignmentsRaw = team2.assignments || {};

  const team1PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team1AssignmentsRaw)) {
    if (position) {
      team1PositionMap.set(position, playerId);
    }
  }

  const team2PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team2AssignmentsRaw)) {
    if (position) {
      team2PositionMap.set(position, playerId);
    }
  }

  function findPlayerByPosition(
    positionMap: Map<string, string>,
    position: string
  ) {
    const playerId = positionMap.get(position);
    return playerId || null;
  }

  const order = [
    ["A", "X"],
    ["B", "Y"],
    ["C", "Z"],
    ["A", "Y"],
    ["B", "X"],
  ];

  order.forEach((pair, index) => {
    const playerTeam1 = findPlayerByPosition(team1PositionMap, pair[0]);
    const playerTeam2 = findPlayerByPosition(team2PositionMap, pair[1]);

    if (playerTeam1 && playerTeam2) {
      submatches.push({
        matchNumber: index + 1,
        matchType: "singles",
        playerTeam1: playerTeam1 as any,
        playerTeam2: playerTeam2 as any,
        numberOfSets: setsPerTie,
        games: [],
        finalScore: { team1Sets: 0, team2Sets: 0 },
        winnerSide: null,
        status: "scheduled",
        completed: false,
      });
    }
  });

  return submatches;
}

/**
 * Generate submatches for Single-Double-Single format
 * Match 1: A vs X (singles)
 * Match 2: AB vs XY (doubles)
 * Match 3: B vs Y (singles)
 */
function generateSingleDoubleSingleSubmatches(
  team1: any,
  team2: any,
  setsPerTie: number
) {
  const submatches = [] as SubMatch[];
  
  const team1AssignmentsRaw = team1.assignments || {};
  const team2AssignmentsRaw = team2.assignments || {};

  const team1PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team1AssignmentsRaw)) {
    if (position) team1PositionMap.set(position, playerId);
  }

  const team2PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team2AssignmentsRaw)) {
    if (position) team2PositionMap.set(position, playerId);
  }

  const playerA = team1PositionMap.get("A");
  const playerB = team1PositionMap.get("B");
  const playerX = team2PositionMap.get("X");
  const playerY = team2PositionMap.get("Y");

  // Match 1: A vs X (singles)
  if (playerA && playerX) {
    submatches.push({
      matchNumber: 1,
      matchType: "singles",
      playerTeam1: playerA as any,
      playerTeam2: playerX as any,
      numberOfSets: setsPerTie,
      games: [],
      finalScore: { team1Sets: 0, team2Sets: 0 },
      winnerSide: null,
      status: "scheduled",
      completed: false,
    });
  }

  // Match 2: AB vs XY (doubles)
  if (playerA && playerB && playerX && playerY) {
    submatches.push({
      matchNumber: 2,
      matchType: "doubles",
      playerTeam1: [playerA, playerB] as any,
      playerTeam2: [playerX, playerY] as any,
      numberOfSets: setsPerTie,
      games: [],
      finalScore: { team1Sets: 0, team2Sets: 0 },
      winnerSide: null,
      status: "scheduled",
      completed: false,
    });
  }

  // Match 3: B vs Y (singles)
  if (playerB && playerY) {
    submatches.push({
      matchNumber: 3,
      matchType: "singles",
      playerTeam1: playerB as any,
      playerTeam2: playerY as any,
      numberOfSets: setsPerTie,
      games: [],
      finalScore: { team1Sets: 0, team2Sets: 0 },
      winnerSide: null,
      status: "scheduled",
      completed: false,
    });
  }

  return submatches;
}

function generateCustomFormatSubmatches(
  team1: any,
  team2: any,
  setsPerTie: number,
  customConfig: {
    matches: Array<{
      type: "singles" | "doubles";
      team1Players: string[]; // player IDs
      team2Players: string[];
    }>;
  }
) {
  const submatches = [] as SubMatch[];

  if (!customConfig?.matches || customConfig.matches.length === 0) {
    throw new Error("Custom format requires match configuration");
  }

  customConfig.matches.forEach((matchConfig, index) => {
    const matchType = matchConfig.type;

    // Validate players exist
    const team1PlayerIds = matchConfig.team1Players;
    const team2PlayerIds = matchConfig.team2Players;

    if (matchType === "singles") {
      if (team1PlayerIds.length !== 1 || team2PlayerIds.length !== 1) {
        throw new Error(`Match ${index + 1}: Singles requires exactly 1 player per team`);
      }
    } else if (matchType === "doubles") {
      if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) {
        throw new Error(`Match ${index + 1}: Doubles requires exactly 2 players per team`);
      }
    }

    submatches.push({
      matchNumber: index + 1,
      matchType,
      playerTeam1: matchType === "singles" ? team1PlayerIds[0] as any : team1PlayerIds as any,
      playerTeam2: matchType === "singles" ? team2PlayerIds[0] as any : team2PlayerIds as any,
      numberOfSets: setsPerTie,
      games: [],
      finalScore: { team1Sets: 0, team2Sets: 0 },
      winnerSide: null,
      status: "scheduled",
      completed: false,
    });
  });

  return submatches;
}

/**
 * POST /api/matches/team
 * Create a new team match
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const token = getTokenFromRequest(request);
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const scorer = await User.findById(decoded.userId);
    if (!scorer)
      return NextResponse.json(
        { error: "Invalid scorer, user not found" },
        { status: 401 }
      );

    // ✅ Validate input
    const {
      matchFormat,
      setsPerTie,
      team1Id,
      team2Id,
      city,
      venue,
      serverConfig,
      customConfig,
    } = body;

    if (!matchFormat || !setsPerTie || !city || !team1Id || !team2Id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (team1Id === team2Id) {
      return NextResponse.json(
        { error: "Team 1 and Team 2 cannot be the same" },
        { status: 400 }
      );
    }

    const team1 = await Team.findById(team1Id)
      .populate([
        {
          path: "players.user",
          select: "username fullName profileImage",
        },
      ])
      .lean<{
        _id: mongoose.Types.ObjectId;
        name: string;
        captain?: mongoose.Types.ObjectId;
        city: string;
        players: Array<{ user: mongoose.Types.ObjectId }>;
        assignments?: Record<string, string>;
      }>();

    const team2 = await Team.findById(team2Id)
      .populate([
        {
          path: "players.user",
          select: "username fullName profileImage",
        },
      ])
      .lean<{
        _id: mongoose.Types.ObjectId;
        name: string;
        captain?: mongoose.Types.ObjectId;
        city: string;
        players: Array<{ user: mongoose.Types.ObjectId }>;
        assignments?: Record<string, string>;
      }>();

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: "Invalid team IDs provided" },
        { status: 400 }
      );
    }

    const team1AssignmentsObj = team1.assignments || {};
    const team2AssignmentsObj = team2.assignments || {};

    // Check if assignments exist for formats that need them
    const needsAssignments = ["five_singles", "single_double_single"].includes(matchFormat);
    
    if (needsAssignments) {
      const hasTeam1Assignments = Object.keys(team1AssignmentsObj).length > 0;
      const hasTeam2Assignments = Object.keys(team2AssignmentsObj).length > 0;

      if (!hasTeam1Assignments) {
        return NextResponse.json(
          { error: `Team "${team1.name}" has no player position assignments. Please assign positions first.` },
          { status: 400 }
        );
      }

      if (!hasTeam2Assignments) {
        return NextResponse.json(
          { error: `Team "${team2.name}" has no player position assignments. Please assign positions first.` },
          { status: 400 }
        );
      }
    }

    // Generate subMatches based on match format
    let subMatches = [] as SubMatch[];

    switch (matchFormat) {
      case "five_singles":
        subMatches = generateFiveSinglesSubmatches(team1, team2, Number(setsPerTie));
        break;

      case "single_double_single":
        subMatches = generateSingleDoubleSingleSubmatches(team1, team2, Number(setsPerTie));
        break;

      case "custom":
        if (!customConfig) {
          return NextResponse.json(
            { error: "Custom format requires customConfig" },
            { status: 400 }
          );
        }
        subMatches = generateCustomFormatSubmatches(team1, team2, Number(setsPerTie), customConfig);
        break;

      default:
        return NextResponse.json(
          { error: `Format "${matchFormat}" is not yet supported` },
          { status: 400 }
        );
    }

    if (subMatches.length === 0) {
      return NextResponse.json(
        { error: "Could not generate submatches. Please ensure all required positions are assigned." },
        { status: 400 }
      );
    }

    // Create team match document
    const teamMatch = new TeamMatch({
      matchFormat,
      matchCategory: "team",
      numberOfSetsPerSubMatch: Number(setsPerTie),
      city,
      venue: venue || city,
      scorer: scorer._id,
      team1: {
        name: team1.name,
        captain: team1.captain,
        players: team1.players,
        city: team1.city,
        assignments: team1AssignmentsObj,
      },
      team2: {
        name: team2.name,
        captain: team2.captain,
        players: team2.players,
        city: team2.city,
        assignments: team2AssignmentsObj,
      },
      subMatches,
      serverConfig: serverConfig || {
        autoServeSwitch: true,
        pointsPerSet: 11,
        bestOfSets: Number(setsPerTie) || 5,
      },
      status: "scheduled",
      createdAt: new Date(),
    });

    await teamMatch.save();

    // Populate for return
    await teamMatch.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1.captain team2.captain", select: "username fullName" },
      {
        path: "team1.players.user team2.players.user",
        select: "username fullName profileImage",
      },
      {
        path: "subMatches.playerTeam1 subMatches.playerTeam2",
        select: "username fullName profileImage",
      },
      {
        path: "subMatches.games.shots.player",
        select: "username fullName profileImage",
      },
    ]);

    return NextResponse.json(
      { message: "Team match created successfully", match: teamMatch },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating team match:", err);
    return NextResponse.json(
      { error: "Failed to create team match" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    let query = TeamMatch.find()
      .populate("scorer", "username fullName")
      .populate("team1.captain team2.captain", "username fullName")
      .populate(
        "team1.players.user team2.players.user",
        "username fullName profileImage"
      )
      .populate(
        "subMatches.playerTeam1 subMatches.playerTeam2",
        "username fullName profileImage"
      )
      .populate({
        path: "subMatches.games.shots.player",
        select: "username fullName profileImage",
      })
      .sort({ createdAt: -1 });

    if (limit > 0) query = query.limit(limit);

    const matches = await query;

    return NextResponse.json({ matches }, { status: 200 });
  } catch (err) {
    console.error("Error fetching team matches:", err);
    return NextResponse.json(
      { error: "Failed to fetch team matches" },
      { status: 500 }
    );
  }
}