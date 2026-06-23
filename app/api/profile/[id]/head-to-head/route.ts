import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  validateProfileRequest,
  fetchUserIndividualMatches,
  buildHeadToHead,
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

    const [individualMatches, user] = await Promise.all([
      fetchUserIndividualMatches(id),
      User.findById(id).select("username fullName profileImage").lean()
    ]);
    const headToHead = buildHeadToHead(individualMatches, id);

    return NextResponse.json({
      success: true,
      headToHead,
      user,
    });
  } catch (error) {
    console.error("Head-to-head error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
