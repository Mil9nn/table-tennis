import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";
import { buildDoublesRotationForTeamMatch } from "@/components/live-scorer/individual/helpers";
import { withAuth } from "@/lib/api-utils";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();
    const { id, subMatchId } = await context.params;
    const serverConfig = await req.json();

    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check scoring permission
    let canScore = match.scorer?.toString() === auth.userId;
    
    if (!canScore && match.tournament) {
      canScore = await canScoreTournamentMatch(auth.userId, match.tournament.toString());
    }
    
    if (!canScore) {
      return NextResponse.json(
        { error: "Forbidden: you don't have permission to configure this match" },
        { status: 403 }
      );
    }

    const subMatch = match.subMatches.id(subMatchId);
    if (!subMatch) {
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    if (!subMatch.serverConfig) {
      subMatch.serverConfig = {};
    }

    subMatch.serverConfig.firstServer = serverConfig.firstServer;
    subMatch.serverConfig.firstReceiver = serverConfig.firstReceiver || null;

    const isDoubles = (subMatch as any).matchType === "doubles";
    if (isDoubles && serverConfig.firstServer && serverConfig.firstReceiver) {
      const rotation = buildDoublesRotationForTeamMatch(
        serverConfig.firstServer,
        serverConfig.firstReceiver
      );
      subMatch.serverConfig.serverOrder = rotation;
    } else {
      subMatch.serverConfig.serverOrder = [];
    }

    (subMatch as any).currentServer = serverConfig.firstServer;

    match.markModified("subMatches");
    await match.save();

    await match.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1.captain team2.captain", select: "username fullName" },
      { path: "team1.players.user team2.players.user", select: "username fullName profileImage" },
      { path: "subMatches.playerTeam1 subMatches.playerTeam2", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      match,
      message: "Server configuration saved",
    });
  } catch (err: any) {
    console.error("Server config error:", err);
    return NextResponse.json(
      { 
        error: "Failed to save server configuration",
        ...(process.env.NODE_ENV === "development" && { details: err.message, stack: err.stack })
      },
      { status: 500 }
    );
  }
}