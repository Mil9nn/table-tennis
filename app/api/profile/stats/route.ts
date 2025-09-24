import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get completed matches
    const matches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    });

    const stats: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      bestShot: string | null;
    } = {
      matchesPlayed: matches.length,
      wins: 0,
      losses: 0,
      draws: 0,
      bestShot: null,
    };

    const shotCounter: Record<string, number> = {};

    matches.forEach((match) => {
      // find which side the user was on
      const isSide1 = match.participants[0].toString() === userId;
      const userSide = isSide1 ? "side1" : "side2";

      if (match.winnerSide === userSide) stats.wins++;
      else if (!match.winnerSide) stats.draws++;
      else stats.losses++;

      // collect shot counts
      const playerStats = match.statistics?.playerStats?.get(userId);
      if (playerStats?.detailedShots) {
        for (const [shot, count] of Object.entries(playerStats.detailedShots)) {
          shotCounter[shot] = (shotCounter[shot] || 0) + (count as number);
        }
      }
    });

    if (Object.keys(shotCounter).length > 0) {
      stats.bestShot = Object.entries(shotCounter).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
    }

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
