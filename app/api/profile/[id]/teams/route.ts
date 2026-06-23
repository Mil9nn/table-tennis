import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  validateProfileRequest,
  fetchUserTeams,
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

    const teams = await fetchUserTeams(id);

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("Teams error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
