// app/api/matches/team/[id]/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

/**
 * Initialize submatches based on team format
 * Uses assignments from the Team documents
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can initialize" },
        { status: 403 }
      );
    }

    // Check if already initialized
    if (match.subMatches && match.subMatches.length > 0) {
      await match.populate([
        { path: "team1.players", select: "username fullName" },
        { path: "team2.players", select: "username fullName" },
        { path: "subMatches.team1Players", select: "username fullName" },
        { path: "subMatches.team2Players", select: "username fullName" },
      ]);

      return NextResponse.json({ 
        match, 
        message: "Match already initialized" 
      });
    }

    // Fetch team documents to get assignments
    const [team1Doc, team2Doc] = await Promise.all([
      Team.findOne({ name: match.team1.name }),
      Team.findOne({ name: match.team2.name }),
    ]);

    if (!team1Doc || !team2Doc) {
      return NextResponse.json(
        { error: "Team documents not found" },
        { status: 404 }
      );
    }

    // Check if teams have assignments
    if (!team1Doc.assignments || team1Doc.assignments.size === 0) {
      return NextResponse.json(
        { error: `${team1Doc.name} has no player assignments. Please assign players first.` },
        { status: 400 }
      );
    }

    if (!team2Doc.assignments || team2Doc.assignments.size === 0) {
      return NextResponse.json(
        { error: `${team2Doc.name} has no player assignments. Please assign players first.` },
        { status: 400 }
      );
    }

    // Generate submatches using team assignments
    const subMatches = generateSubMatches(
      match.format,
      { players: match.team1.players, assignments: team1Doc.assignments },
      { players: match.team2.players, assignments: team2Doc.assignments }
    );

    if (!subMatches || subMatches.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate submatches. Check team assignments match the format requirements." },
        { status: 400 }
      );
    }

    match.subMatches = subMatches;
    match.status = "in_progress";
    await match.save();

    await match.populate([
      { path: "team1.players", select: "username fullName" },
      { path: "team2.players", select: "username fullName" },
      { path: "subMatches.team1Players", select: "username fullName" },
      { path: "subMatches.team2Players", select: "username fullName" },
    ]);

    return NextResponse.json({ 
      match, 
      message: "Match initialized successfully" 
    });
  } catch (err) {
    console.error("Initialize error:", err);
    return NextResponse.json(
      { error: "Failed to initialize match", details: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Generate submatches based on format and team assignments
 */
function generateSubMatches(
  format: string,
  team1: { players: any[]; assignments: Map<string, string> },
  team2: { players: any[]; assignments: Map<string, string> }
) {
  const getPlayerByAssignment = (
    players: any[],
    assignments: Map<string, string>,
    assignment: string
  ) => {
    return players.find((playerId) => 
      assignments.get(playerId.toString()) === assignment
    );
  };

  let subMatchConfigs: any[] = [];

  switch (format) {
    case "swaythling_format": // 5 singles: A-X, B-Y, C-Z, A-Y, B-X
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"], label: "Match 1: A vs X" },
        { type: "singles", team1: ["B"], team2: ["Y"], label: "Match 2: B vs Y" },
        { type: "singles", team1: ["C"], team2: ["Z"], label: "Match 3: C vs Z" },
        { type: "singles", team1: ["A"], team2: ["Y"], label: "Match 4: A vs Y" },
        { type: "singles", team1: ["B"], team2: ["X"], label: "Match 5: B vs X" },
      ];
      break;

    case "single_double_single": // A vs X, AB vs XY, B vs Y
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"], label: "Match 1: A vs X" },
        { type: "doubles", team1: ["A", "B"], team2: ["X", "Y"], label: "Match 2: AB vs XY" },
        { type: "singles", team1: ["B"], team2: ["Y"], label: "Match 3: B vs Y" },
      ];
      break;

    case "five_singles_full": // 5 singles: A-X, B-Y, C-Z, D-P, E-Q
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"], label: "Match 1: A vs X" },
        { type: "singles", team1: ["B"], team2: ["Y"], label: "Match 2: B vs Y" },
        { type: "singles", team1: ["C"], team2: ["Z"], label: "Match 3: C vs Z" },
        { type: "singles", team1: ["D"], team2: ["P"], label: "Match 4: D vs P" },
        { type: "singles", team1: ["E"], team2: ["Q"], label: "Match 5: E vs Q" },
      ];
      break;

    case "three_singles": // 3 singles: A-X, B-Y, C-Z
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"], label: "Match 1: A vs X" },
        { type: "singles", team1: ["B"], team2: ["Y"], label: "Match 2: B vs Y" },
        { type: "singles", team1: ["C"], team2: ["Z"], label: "Match 3: C vs Z" },
      ];
      break;

    default:
      return [];
  }

  // Convert assignments to player IDs
  const subMatches = subMatchConfigs.map((config, index) => {
    const team1Players = config.team1
      .map((assignment: string) => 
        getPlayerByAssignment(team1.players, team1.assignments, assignment)
      )
      .filter((p: any) => p);

    const team2Players = config.team2
      .map((assignment: string) => 
        getPlayerByAssignment(team2.players, team2.assignments, assignment)
      )
      .filter((p: any) => p);

    // Validate we found all players
    if (
      team1Players.length !== config.team1.length ||
      team2Players.length !== config.team2.length
    ) {
      console.error(`Failed to find all players for ${config.label}`);
      return null;
    }

    return {
      subMatchNumber: index + 1,
      type: config.type,
      matchLabel: config.label,
      team1Players: team1Players,
      team2Players: team2Players,
      games: [
        {
          gameNumber: 1,
          team1Score: 0,
          team2Score: 0,
          shots: [],
          winnerSide: null,
          completed: false,
        },
      ],
      currentGame: 1,
      finalScore: { team1Sets: 0, team2Sets: 0 },
      winnerSide: null,
      completed: false,
      statistics: {
        winners: 0,
        unforcedErrors: 0,
        aces: 0,
        serveErrors: 0,
        playerStats: new Map(),
      },
    };
  });

  // Filter out any nulls (failed validations)
  return subMatches.filter((sm) => sm !== null);
}