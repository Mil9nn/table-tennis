import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

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

    // Only scorer can swap
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can swap sides" },
        { status: 403 }
      );
    }

    // Validate match status
    if (!["in_progress", "scheduled"].includes(match.status)) {
      return NextResponse.json(
        { error: "Cannot swap: match must be in progress or scheduled" },
        { status: 400 }
      );
    }

    // Get current submatch
    const currentSubMatch = match.subMatches[match.currentSubMatch - 1];

    if (currentSubMatch) {
      // Validate current game score is 0-0 in current submatch
      const currentGameData = currentSubMatch.games?.find(
        (g: any) => g.gameNumber === (currentSubMatch.games?.length || 0)
      );

      if (currentGameData) {
        const team1Score = currentGameData.team1Score || 0;
        const team2Score = currentGameData.team2Score || 0;

        if (team1Score !== 0 || team2Score !== 0) {
          return NextResponse.json(
            { error: "Cannot swap: current game score must be 0-0" },
            { status: 400 }
          );
        }
      }
    }

    // Swap team1 ↔ team2 objects
    const tempTeam = match.team1;
    match.team1 = match.team2;
    match.team2 = tempTeam;

    // Swap finalScore.team1Matches ↔ team2Matches
    const tempScore = match.finalScore.team1Matches;
    match.finalScore.team1Matches = match.finalScore.team2Matches;
    match.finalScore.team2Matches = tempScore;

    // Update all subMatches
    for (const subMatch of match.subMatches) {
      // Swap playerTeam1 ↔ playerTeam2
      const tempPlayers = subMatch.playerTeam1;
      subMatch.playerTeam1 = subMatch.playerTeam2;
      subMatch.playerTeam2 = tempPlayers;

      // Update currentServer (team1 ↔ team2)
      if (subMatch.currentServer) {
        if (subMatch.currentServer === "team1") {
          subMatch.currentServer = "team2";
        } else if (subMatch.currentServer === "team2") {
          subMatch.currentServer = "team1";
        } else if (subMatch.currentServer === "team1_main") {
          subMatch.currentServer = "team2_main";
        } else if (subMatch.currentServer === "team2_main") {
          subMatch.currentServer = "team1_main";
        } else if (subMatch.currentServer === "team1_partner") {
          subMatch.currentServer = "team2_partner";
        } else if (subMatch.currentServer === "team2_partner") {
          subMatch.currentServer = "team1_partner";
        }
      }

      // Update serverConfig.firstServer if it exists
      if (subMatch.serverConfig?.firstServer) {
        const firstServer = subMatch.serverConfig.firstServer;
        if (firstServer === "team1") {
          subMatch.serverConfig.firstServer = "team2";
        } else if (firstServer === "team2") {
          subMatch.serverConfig.firstServer = "team1";
        } else if (firstServer === "team1_main") {
          subMatch.serverConfig.firstServer = "team2_main";
        } else if (firstServer === "team2_main") {
          subMatch.serverConfig.firstServer = "team1_main";
        } else if (firstServer === "team1_partner") {
          subMatch.serverConfig.firstServer = "team2_partner";
        } else if (firstServer === "team2_partner") {
          subMatch.serverConfig.firstServer = "team1_partner";
        }
      }

      // Update winnerSide if submatch is completed
      if (subMatch.winnerSide) {
        subMatch.winnerSide = subMatch.winnerSide === "team1" ? "team2" : "team1";
      }
    }

    // Update winnerTeam if match is completed
    if (match.winnerTeam) {
      match.winnerTeam = match.winnerTeam === "team1" ? "team2" : "team1";
    }

    match.markModified("subMatches");
    await match.save();

    const updatedMatch = await TeamMatch.findById(match._id)
      .populate(
        "team1.players.user team2.players.user",
        "username fullName profileImage"
      )
      .populate(
        "subMatches.playerTeam1 subMatches.playerTeam2",
        "username fullName profileImage"
      );

    return NextResponse.json({ match: updatedMatch });
  } catch (err) {
    console.error("Swap error:", err);
    return NextResponse.json(
      { error: "Failed to swap sides" },
      { status: 500 }
    );
  }
}
