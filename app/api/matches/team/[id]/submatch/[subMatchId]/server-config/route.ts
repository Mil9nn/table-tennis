import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();
    const { id, subMatchId } = await context.params;
    const serverConfig = await req.json();

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
        { error: "Forbidden: only the assigned scorer can configure servers" },
        { status: 403 }
      );
    }

    // ✅ Find the submatch and update its server config
    const subMatch = match.subMatches.id(subMatchId);
    if (!subMatch) {
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    // Initialize serverConfig if it doesn't exist
    if (!subMatch.serverConfig) {
      subMatch.serverConfig = {};
    }

    subMatch.serverConfig.firstServer = serverConfig.firstServer;
    subMatch.serverConfig.firstReceiver = serverConfig.firstReceiver;
    subMatch.serverConfig.serverOrder = serverConfig.serverOrder ?? [];

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
  } catch (err) {
    console.error("Server config error:", err);
    return NextResponse.json(
      { error: "Failed to save server configuration" },
      { status: 500 }
    );
  }
}