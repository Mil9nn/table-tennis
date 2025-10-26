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

    const matches = await IndividualMatch.find({
      participants: decoded.userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    const h2hMap: Record<
      string,
      { opponent: any; wins: number; losses: number; matches: number }
    > = {};

    matches.forEach((match: any) => {
      const userIndex = match.participants.findIndex(
        (p: any) => p._id.toString() === decoded.userId
      );
      const opponentIndex = userIndex === 0 ? 1 : 0;
      const opponent = match.participants[opponentIndex];
      const opponentId = opponent._id.toString();

      if (!h2hMap[opponentId]) {
        h2hMap[opponentId] = {
          opponent,
          wins: 0,
          losses: 0,
          matches: 0,
        };
      }

      const userSide = userIndex < 2 ? "side1" : "side2";
      const won = match.winnerSide === userSide;

      h2hMap[opponentId].matches++;
      if (won) h2hMap[opponentId].wins++;
      else h2hMap[opponentId].losses++;
    });

    const records = Object.values(h2hMap).sort((a, b) => b.matches - a.matches);

    return NextResponse.json({ success: true, records });
  } catch (err) {
    console.error("Error fetching head-to-head:", err);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
