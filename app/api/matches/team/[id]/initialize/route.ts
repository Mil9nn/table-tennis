// app/api/matches/team/[id]/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

/**
 * Initialize submatches based on team format and player assignments
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

    const match = await TeamMatch.findById(id)
      .populate("team1.players")
      .populate("team2.players");

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can initialize" },
        { status: 403 }
      );
    }

    // If already initialized, return existing
    if (match.subMatches && match.subMatches.length > 0) {
      return NextResponse.json({ 
        match, 
        message: "Match already initialized" 
      });
    }

    // Generate submatches based on format
    const subMatches = generateSubMatches(match.format, match.team1, match.team2);

    if (!subMatches || subMatches.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate submatches. Check team assignments." },
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
      { error: "Failed to initialize match" },
      { status: 500 }
    );
  }
}

/**
 * Generate submatches based on format and assignments
 */
function generateSubMatches(format: string, team1: any, team2: any) {
  const getPlayerByAssignment = (team: any, assignment: string) => {
    return team.players.find((p: any) => 
      team.assignments?.get(p._id.toString()) === assignment
    );
  };

  let subMatchConfigs: any[] = [];

  switch (format) {
    case "swaythling_format": // 5 singles: A-X, B-Y, C-Z, A-Y, B-X
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"] },
        { type: "singles", team1: ["B"], team2: ["Y"] },
        { type: "singles", team1: ["C"], team2: ["Z"] },
        { type: "singles", team1: ["A"], team2: ["Y"] },
        { type: "singles", team1: ["B"], team2: ["X"] },
      ];
      break;

    case "single_double_single": // A vs X, AB vs XY, B vs Y
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"] },
        { type: "doubles", team1: ["A", "B"], team2: ["X", "Y"] },
        { type: "singles", team1: ["B"], team2: ["Y"] },
      ];
      break;

    case "five_singles_full": // 5 singles: A-X, B-Y, C-Z, D-P, E-Q
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"] },
        { type: "singles", team1: ["B"], team2: ["Y"] },
        { type: "singles", team1: ["C"], team2: ["Z"] },
        { type: "singles", team1: ["D"], team2: ["P"] },
        { type: "singles", team1: ["E"], team2: ["Q"] },
      ];
      break;

    case "three_singles": // 3 singles: A-X, B-Y, C-Z
      subMatchConfigs = [
        { type: "singles", team1: ["A"], team2: ["X"] },
        { type: "singles", team1: ["B"], team2: ["Y"] },
        { type: "singles", team1: ["C"], team2: ["Z"] },
      ];
      break;

    default:
      return [];
  }

  // Convert assignments to player IDs
  const subMatches = subMatchConfigs.map((config, index) => {
    const team1Players = config.team1
      .map((assignment: string) => getPlayerByAssignment(team1, assignment))
      .filter((p: any) => p);

    const team2Players = config.team2
      .map((assignment: string) => getPlayerByAssignment(team2, assignment))
      .filter((p: any) => p);

    // Validate we found all players
    if (
      team1Players.length !== config.team1.length ||
      team2Players.length !== config.team2.length
    ) {
      return null;
    }

    return {
      subMatchNumber: index + 1,
      type: config.type,
      team1Players: team1Players.map((p: any) => p._id),
      team2Players: team2Players.map((p: any) => p._id),
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