import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LeaderboardCache from "@/models/LeaderboardCache";
import { statsService } from "@/services/statsService";

export async function GET() {
  try {
    await connectDB();

    const cacheType = "team";

    // Try to get cached leaderboard
    let cache = await LeaderboardCache.findOne({ type: cacheType })
      .sort({ generatedAt: -1 })
      .lean();

    // If no cache exists or it's expired, generate new one
    if (!cache || new Date(cache.expiresAt) < new Date()) {
      const rankings = await statsService.generateLeaderboardCache(cacheType);
      return NextResponse.json({
        leaderboard: rankings,
        cached: false,
        generatedAt: new Date(),
      });
    }

    // Return cached rankings
    return NextResponse.json({
      leaderboard: cache.rankings,
      cached: true,
      generatedAt: cache.generatedAt,
      expiresAt: cache.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
