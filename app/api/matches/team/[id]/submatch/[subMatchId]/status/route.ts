// app/api/matches/team/[id]/submatch/[subMatchId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string; subMatchId: string }> }) {
  try {
    await connectDB();
    console.log("✅ Connected to DB");

    const { id, subMatchId } = await context.params;
    console.log("📌 Received request for matchId:", id, "subMatchId:", subMatchId);

    const body = await req.json();
    console.log("📦 Request body:", body);

    const match = await TeamMatch.findById(id);
    if (!match) {
      console.warn("❌ Match not found:", id);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const subMatch = match.subMatches.id(subMatchId);
    console.log("🔢 SubMatch found for update:", subMatchId);

    if (!subMatch) {
      console.warn("❌ SubMatch not found at index:", subMatchId);
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    console.log("🎯 Current subMatch before update:", subMatch);

    // Update submatch status
    if (body.status) {
      console.log("📝 Updating subMatch status to:", body.status);
      subMatch.status = body.status;

      if (body.status === "scheduled") {
        console.log("♻️ Resetting subMatch because status is scheduled");
        subMatch.winnerSide = null;
        subMatch.completed = false;
        subMatch.games = [];
        subMatch.finalScore = { team1Sets: 0, team2Sets: 0 };
      }

      match.markModified("subMatches");
      await match.save();
      console.log("💾 SubMatch saved successfully");

      const updatedMatch = await TeamMatch.findById(match._id)
        .populate("team1.players.user team2.players.user", "username fullName profileImage")
        .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage");

      console.log("🔄 Returning updated match");
      return NextResponse.json({ match: updatedMatch, message: "SubMatch status updated" });
    } else {
      console.warn("⚠️ Status not provided in request");
      return NextResponse.json({ error: "Status not provided" }, { status: 400 });
    }
  } catch (err) {
    console.error("🔥 SubMatch status update error:", err);
    return NextResponse.json({ error: "Failed to update submatch status", details: (err as Error).message }, { status: 500 });
  }
}

// Optional: GET to fetch a submatch with logs
export async function GET(req: NextRequest, context: { params: Promise<{ id: string; subMatchId: string }> }) {
  try {
    await connectDB();
    console.log("✅ Connected to DB for GET");

    const { id, subMatchId } = await context.params;
    console.log("📌 GET request for matchId:", id, "subMatchId:", subMatchId);

    const match = await TeamMatch.findById(id)
      .populate("team1.players.user team2.players.user", "username fullName")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName");

    if (!match) {
      console.warn("❌ Match not found:", id);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const subMatch = match.subMatches.id(subMatchId);
    console.log("🔢 SubMatch fetched:", subMatchId);

    if (!subMatch) {
      console.warn("❌ SubMatch not found:", subMatchId);
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    console.log("🎯 Returning subMatch:", subMatch);
    return NextResponse.json({ subMatch });
  } catch (err) {
    console.error("🔥 Error fetching submatch:", err);
    return NextResponse.json({ error: "Failed to fetch submatch", details: (err as Error).message }, { status: 500 });
  }
}