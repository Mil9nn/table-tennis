import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import Tournament from "@/models/Tournament";
import TournamentGroups from "@/models/TournamentGroups";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
    }

    const tournament = (await Tournament.findById(id).select("category").lean()) as any;
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const groupsDoc = await TournamentGroups.findOne({ tournament: id }).lean();
    const matchIds = new Set<string>();
    (groupsDoc?.groups || []).forEach((group: any) => {
      (group?.rounds || []).forEach((round: any) => {
        (round?.matches || []).forEach((matchId: any) => {
          const value = matchId?.toString?.() || "";
          if (value) matchIds.add(value);
        });
      });
    });

    if (matchIds.size === 0) {
      return NextResponse.json({ matches: [] });
    }

    const objectIds = Array.from(matchIds)
      .filter((matchId) => mongoose.Types.ObjectId.isValid(matchId))
      .map((matchId) => new mongoose.Types.ObjectId(matchId));

    const matches = await Match.find({ _id: { $in: objectIds } }).populate(
      tournament.category === "team"
        ? [
            { path: "team1.captain", select: "username fullName profileImage" },
            { path: "team2.captain", select: "username fullName profileImage" },
            { path: "subMatches.playerTeam1", select: "username fullName profileImage" },
            { path: "subMatches.playerTeam2", select: "username fullName profileImage" },
          ]
        : [{ path: "participants", select: "username fullName profileImage _id" }]
    );

    return NextResponse.json({
      matches: matches.map((match: any) => match.toObject()),
    });
  } catch (error) {
    console.error("[GET /api/tournaments/[id]/round-robin-matches] failed:", error);
    return NextResponse.json({ error: "Failed to load round-robin matches" }, { status: 500 });
  }
}
