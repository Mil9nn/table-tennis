import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  console.log("\n===============================");
  console.log("🟢 TEAM MATCH STATUS UPDATE API CALLED");
  console.log("===============================\n");

  try {
    await connectDB();
    console.log("✅ Connected to DB");

    const { matchId } = await context.params;
    const body = await req.json();
    const { status, winnerSide } = body;

    console.log("📦 Incoming request body:", body);
    console.log("🆔 Match ID:", matchId);

    // --- AUTH ---
    const token = getTokenFromRequest(req);
    console.log("🔑 Token found?", !!token);

    if (!token) {
      console.warn("❌ No token provided in request headers");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log("👤 Decoded token:", decoded);

    if (!decoded) {
      console.warn("❌ Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // --- STATUS VALIDATION ---
    const validStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      console.warn("⚠️ Invalid status value:", status);
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // --- FETCH MATCH ---
    console.log("🔍 Looking for TeamMatch with ID:", matchId);
    const match = await TeamMatch.findById(matchId)
      .populate("team1")
      .populate("team2")
      .populate({
        path: "subMatches",
        populate: [
          { path: "games" },
          { path: "winner" },
          { path: "participants" },
        ],
      });

    if (!match) {
      console.error("❌ TeamMatch not found for ID:", matchId);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    console.log("✅ Found match:", {
      id: match._id.toString(),
      team1: match.team1?.name,
      team2: match.team2?.name,
      status: match.status,
      scorer: match.scorer?.toString(),
      serverConfig: match.serverConfig,
    });

    // --- AUTHORIZATION ---
    if (match.scorer?.toString() !== decoded.userId) {
      console.warn("🚫 Unauthorized scorer:", {
        matchScorer: match.scorer?.toString(),
        requestUser: decoded.userId,
      });
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can update the match" },
        { status: 403 }
      );
    }

    // --- UPDATE STATUS ---
    console.log(`🛠 Updating match status: ${match.status} → ${status}`);
    match.status = status;

    // --- ASSIGN SERVER IF NEEDED ---
    if (
      status === "in_progress" &&
      !match.currentServer &&
      match.serverConfig?.firstServer
    ) {
      console.log("⚙️ No current server — assigning firstServer:", match.serverConfig.firstServer);
      match.currentServer = match.serverConfig.firstServer;
    }

    // --- SET WINNER ---
    if (status === "completed" && winnerSide) {
      console.log("🏆 Match completed. Winner side:", winnerSide);
      match.winnerSide = winnerSide;
    }

    // --- SAVE MATCH ---
    await match.save();
    console.log("💾 Match saved successfully");

    console.log("✅ Returning updated match to client");
    return NextResponse.json({ match });
  } catch (err: any) {
    console.error("\n❌ Team status update error:", err.message || err);
    console.error("🧩 Stack Trace:", err.stack);
    return NextResponse.json(
      { error: "Failed to update team match status", details: err.message },
      { status: 500 }
    );
  }
}