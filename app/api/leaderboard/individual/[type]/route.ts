import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LeaderboardCache from "@/models/LeaderboardCache";
import { statsService } from "@/services/statsService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    await connectDB();
    const { type } = await context.params;

    // Validate match type
    if (!["singles", "doubles", "mixed_doubles"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid match type. Use: singles, doubles, or mixed_doubles" },
        { status: 400 }
      );
    }

    const cacheType = `individual_${type}`;

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
    console.error("Error fetching individual leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
