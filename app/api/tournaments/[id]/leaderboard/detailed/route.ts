import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { generateDetailedLeaderboard } from "@/services/tournament/core/statisticsService";

/**
 * GET /api/tournaments/[id]/leaderboard/detailed
 * Get detailed tournament leaderboard with player statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: tournamentId } = await params;

    // Generate detailed leaderboard using service
    const result = await generateDetailedLeaderboard(tournamentId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching detailed leaderboard:", error);

    if (error.message === "Tournament not found") {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch detailed leaderboard" },
      { status: 500 }
    );
  }
}
