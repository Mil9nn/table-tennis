// app/api/profile/recent-matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const matches = await IndividualMatch.find({
      participants: decoded.userId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("participants", "username fullName profileImage")
      .lean();

    const formattedMatches = matches.map((match: any) => {
      const userIndex = match.participants.findIndex(
        (p: any) => p._id.toString() === decoded.userId
      );
      const userSide = userIndex < 2 ? "side1" : "side2";
      const won = match.winnerSide === userSide;

      return {
        _id: match._id,
        matchCategory: match.matchCategory,
        matchType: match.matchType,
        createdAt: match.createdAt,
        result: won ? "won" : "lost",
        score: `${match.finalScore.side1Sets}-${match.finalScore.side2Sets}`,
      };
    });

    return NextResponse.json({ success: true, matches: formattedMatches });
  } catch (err) {
    console.error("Error fetching recent matches:", err);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}