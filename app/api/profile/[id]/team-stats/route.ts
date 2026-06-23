import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  validateProfileRequest,
  fetchUserTeamMatches,
  buildTeamStats,
} from "@/services/profile/profileStatsService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const errorResponse = await validateProfileRequest(request, id);
    if (errorResponse) return errorResponse;

    const teamMatches = await fetchUserTeamMatches(id);
    const teamStats = buildTeamStats(teamMatches, id);

    return NextResponse.json({
      success: true,
      teamStats,
    });
  } catch (error) {
    console.error("Team stats error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
