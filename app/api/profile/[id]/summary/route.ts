import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { validateProfileRequest } from "@/services/profile/profileStatsService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const errorResponse = await validateProfileRequest(request, id);
    if (errorResponse) return errorResponse;

    const user = await User.findById(id)
      .select(
        "username fullName profileImage bio location handedness createdAt gender dateOfBirth",
      )
      .lean() as {
        _id: unknown;
        username: string;
        fullName?: string;
        profileImage?: string;
        bio?: string;
        location?: string;
        handedness?: string;
        createdAt?: Date;
        gender?: string;
        dateOfBirth?: Date;
      } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
        bio: user.bio,
        location: user.location,
        handedness: user.handedness,
        createdAt: user.createdAt,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    console.error("Profile summary error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
