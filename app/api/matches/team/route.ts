import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { SubMatch } from "@/types/match.type";
import mongoose from "mongoose";
import { createSinglesSubMatch, createDoublesSubMatch } from "@/services/match/subMatchFactory";
import { populateTeamMatch } from "@/services/match/populationService";

/*
 Generate submatches for Swaythling Cup (5 singles: A-X, B-Y, C-Z, A-Y, B-X)
 Uses position-based system to ensure proper match order and fairness
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

  // Swaythling format fixed match order
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
      submatches.push(
        createSinglesSubMatch({
          matchNumber: index + 1,
          playerTeam1,
          playerTeam2,
          numberOfSets: setsPerTie,
        }) as any
      );
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
    submatches.push(
      createSinglesSubMatch({
        matchNumber: 1,
        playerTeam1: playerA,
        playerTeam2: playerX,
        numberOfSets: setsPerTie,
      }) as any
    );
  }

  // Match 2: AB vs XY (doubles)
  if (playerA && playerB && playerX && playerY) {
    submatches.push(
      createDoublesSubMatch({
        matchNumber: 2,
        playerTeam1: [playerA, playerB],
        playerTeam2: [playerX, playerY],
        numberOfSets: setsPerTie,
      }) as any
    );
  }

  // Match 3: B vs Y (singles)
  if (playerB && playerY) {
    submatches.push(
      createSinglesSubMatch({
        matchNumber: 3,
        playerTeam1: playerB,
        playerTeam2: playerY,
        numberOfSets: setsPerTie,
      }) as any
    );
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
    const team1PlayerIds = matchConfig.team1Players;
    const team2PlayerIds = matchConfig.team2Players;

    if (matchType === "singles") {
      // Use singles factory
      if (team1PlayerIds.length !== 1 || team2PlayerIds.length !== 1) {
        throw new Error(`Match ${index + 1}: Singles requires exactly 1 player per team`);
      }
      submatches.push(
        createSinglesSubMatch({
          matchNumber: index + 1,
          playerTeam1: team1PlayerIds[0],
          playerTeam2: team2PlayerIds[0],
          numberOfSets: setsPerTie,
        }) as any
      );
    } else if (matchType === "doubles") {
      // Use doubles factory
      if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) {
        throw new Error(`Match ${index + 1}: Doubles requires exactly 2 players per team`);
      }
      submatches.push(
        createDoublesSubMatch({
          matchNumber: index + 1,
          playerTeam1: [team1PlayerIds[0], team1PlayerIds[1]],
          playerTeam2: [team2PlayerIds[0], team2PlayerIds[1]],
          numberOfSets: setsPerTie,
        }) as any
      );
    }
  });

  return submatches;
}

/**
 * POST /api/matches/team
 * Create a new team match
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const body = await request.json();

    const scorer = await User.findById(auth.userId);
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
      team1Assignments,
      team2Assignments,
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

    // Use provided assignments or fall back to team's saved assignments
    const team1AssignmentsObj = team1Assignments || team1.assignments || {};
    const team2AssignmentsObj = team2Assignments || team2.assignments || {};

    // Check if assignments exist for formats that need them
    const needsAssignments = ["five_singles", "single_double_single"].includes(matchFormat);

    if (needsAssignments) {
      const hasTeam1Assignments = Object.keys(team1AssignmentsObj).length > 0;
      const hasTeam2Assignments = Object.keys(team2AssignmentsObj).length > 0;

      if (!hasTeam1Assignments) {
        return NextResponse.json(
          { error: `Team "${team1.name}" has no player position assignments. Please assign positions in the form.` },
          { status: 400 }
        );
      }

      if (!hasTeam2Assignments) {
        return NextResponse.json(
          { error: `Team "${team2.name}" has no player position assignments. Please assign positions in the form.` },
          { status: 400 }
        );
      }
    }

    // If assignments were provided, save them to the teams for future use
    if (team1Assignments && Object.keys(team1Assignments).length > 0) {
      await Team.findByIdAndUpdate(team1Id, { assignments: team1Assignments });
    }
    if (team2Assignments && Object.keys(team2Assignments).length > 0) {
      await Team.findByIdAndUpdate(team2Id, { assignments: team2Assignments });
    }

    // Generate subMatches based on match format
    let subMatches = [] as SubMatch[];

    switch (matchFormat) {
      case "five_singles":
        subMatches = generateFiveSinglesSubmatches(
          { ...team1, assignments: team1AssignmentsObj },
          { ...team2, assignments: team2AssignmentsObj },
          Number(setsPerTie)
        );
        break;

      case "single_double_single":
        subMatches = generateSingleDoubleSingleSubmatches(
          { ...team1, assignments: team1AssignmentsObj },
          { ...team2, assignments: team2AssignmentsObj },
          Number(setsPerTie)
        );
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
      numberOfSubMatches: subMatches.length,
      city,
      venue: venue,
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
    const populatedMatch = await populateTeamMatch(
      TeamMatch.findById(teamMatch._id)
    ).exec();

    return NextResponse.json(
      { message: "Team match created successfully", match: populatedMatch },
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
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    let query = populateTeamMatch(TeamMatch.find()).sort({ createdAt: -1 });

    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    const matches = await query.exec();

    // Get total count for pagination
    const totalCount = await TeamMatch.countDocuments();
    const hasMore = skip + matches.length < totalCount;

    return NextResponse.json({
      matches,
      pagination: {
        total: totalCount,
        skip,
        limit: limit > 0 ? limit : totalCount,
        hasMore,
      },
    }, { status: 200 });
  } catch (err) {
    console.error("Error fetching team matches:", err);
    return NextResponse.json(
      { error: "Failed to fetch team matches" },
      { status: 500 }
    );
  }
}