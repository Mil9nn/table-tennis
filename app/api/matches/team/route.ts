import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { SubMatch } from "@/types/match.type";
import mongoose from "mongoose";

function generateFiveSinglesSubmatches(
  team1: any,
  team2: any,
  setsPerTie: number
) {
  const submatches = [];
  
  // team1 and team2 are now plain objects (from .lean())
  // assignments is already a plain object, not a Map
  const team1AssignmentsRaw = team1.assignments || {};
  const team2AssignmentsRaw = team2.assignments || {};
  
  console.log("Team1 assignments in submatch function:", team1AssignmentsRaw);
  console.log("Team2 assignments in submatch function:", team2AssignmentsRaw);

  // IMPORTANT: Reverse the structure from playerId->position to position->playerId
  const team1PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team1AssignmentsRaw)) {
    if (position) { // Only add if position is not empty
      team1PositionMap.set(position, playerId);
    }
  }

  const team2PositionMap = new Map();
  for (const [playerId, position] of Object.entries(team2AssignmentsRaw)) {
    if (position) { // Only add if position is not empty
      team2PositionMap.set(position, playerId);
    }
  }

  console.log("Team1 Position Map:", Array.from(team1PositionMap.entries()));
  console.log("Team2 Position Map:", Array.from(team2PositionMap.entries()));

  function findPlayerByPosition(
    positionMap: Map<string, string>,
    position: string
  ) {
    const playerId = positionMap.get(position);
    if (playerId) {
      console.log(`Found player ${playerId} for position "${position}"`);
      return playerId;
    }
    console.log(`No player found for position "${position}"`);
    return null;
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
        playerTeam1: new mongoose.Types.ObjectId(playerTeam1),
        playerTeam2: new mongoose.Types.ObjectId(playerTeam2),
        numberOfSets: setsPerTie,
        games: [],
        finalScore: { team1Sets: 0, team2Sets: 0 },
        winnerSide: null,
        status: "scheduled",
        completed: false,
      });
    } else {
      console.warn(`Skipping submatch ${index + 1}: Missing players for positions ${pair[0]} vs ${pair[1]}`);
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
    await connectDB();
    const body = await request.json();

    // 🔐 Auth check
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

    const team1 = await Team.findById(team1Id).populate([
      {
        path: "players.user",
        select: "username fullName profileImage",
      },
    ]).lean(); // Add .lean() to get plain JavaScript object

    const team2 = await Team.findById(team2Id).populate([
      {
        path: "players.user",
        select: "username fullName profileImage",
      }
    ]).lean(); // Add .lean() to get plain JavaScript object

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: "Invalid team IDs provided" },
        { status: 400 }
      );
    }

    console.log("Team1 raw:", JSON.stringify(team1, null, 2));
    console.log("Team2 raw:", JSON.stringify(team2, null, 2));

    // When using .lean(), Mongoose Maps become plain objects
    const team1AssignmentsObj = team1.assignments || {};
    const team2AssignmentsObj = team2.assignments || {};

    console.log("Team1 assignments (raw):", team1AssignmentsObj);
    console.log("Team2 assignments (raw):", team2AssignmentsObj);
    console.log("Team1 assignments keys:", Object.keys(team1AssignmentsObj));
    console.log("Team2 assignments keys:", Object.keys(team2AssignmentsObj));

    // Check if assignments exist
    if (matchFormat === "five_singles") {
      const hasTeam1Assignments = Object.keys(team1AssignmentsObj).length > 0;
      const hasTeam2Assignments = Object.keys(team2AssignmentsObj).length > 0;

      if (!hasTeam1Assignments) {
        return NextResponse.json(
          { error: `Team "${team1.name}" has no player position assignments. Please assign positions A, B, C first.` },
          { status: 400 }
        );
      }

      if (!hasTeam2Assignments) {
        return NextResponse.json(
          { error: `Team "${team2.name}" has no player position assignments. Please assign positions X, Y, Z first.` },
          { status: 400 }
        );
      }
    }

    // Generating subMatches based on match format and player assignments
    let subMatches = [] as SubMatch[];

    if (
      matchFormat === "five_singles" &&
      team1.assignments &&
      team2.assignments
    ) {
      subMatches = generateFiveSinglesSubmatches(
        team1,
        team2,
        Number(setsPerTie)
      );
      console.log("Generated submatches:", subMatches);

      if (subMatches.length === 0) {
        return NextResponse.json(
          { error: "Could not generate submatches. Please ensure all required positions (A, B, C for Team 1 and X, Y, Z for Team 2) are assigned." },
          { status: 400 }
        );
      }
    }

    // Create team match document with properly formatted assignments
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

    // Before saving teamMatch
    console.log("TeamMatch document before save:", {
      team1: team1.name,
      team2: team2.name,
      team1Assignments: teamMatch.team1.assignments,
      team2Assignments: teamMatch.team2.assignments,
      subMatchesCount: subMatches.length,
      subMatches,
    });

    await teamMatch.save();

    // 👇 Populate for return
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