import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const serverConfig = await req.json();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can configure servers" },
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

    console.log("✅ Saved server config:", {
      firstServer: match.serverConfig.firstServer,
      currentServer: match.currentServer,
    });

    await match.save();
    await match.populate([
      { path: "participants", select: "username fullName" },
      { path: "games.shots.player", select: "username fullName" },
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
