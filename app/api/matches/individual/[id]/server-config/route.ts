import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const serverConfig = await req.json();

    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check scoring permission
    // For tournament matches: organizer or any assigned scorer can configure
    // For standalone matches: only the assigned scorer can configure
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

    // ✅ Update server configuration
    match.serverConfig ??= {};
    match.serverConfig.firstServer = serverConfig.firstServer;
    match.serverConfig.firstReceiver = serverConfig.firstReceiver;
    match.serverConfig.serverOrder = serverConfig.serverOrder ?? [];

    // ✅ Persist currentServer as well
    match.currentServer = serverConfig.firstServer;

    await match.save();
    await match.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "games.shots.player", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      match,
      message: "Server configuration saved",
    });
  } catch (err) {
    console.error("Server config error:", err);
    return NextResponse.json(
      { error: "Failed to save server configuration" },
      { status: 500 }
    );
  }
}
