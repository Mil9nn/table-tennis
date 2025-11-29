import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";

export async function PUT(req: NextRequest) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const body = await req.json();
    const {
      dateOfBirth,
      gender,
      handedness,
      phoneNumber,
      location,
      bio,
      isProfileComplete,
    } = body;

    // Validate required fields
    if (!dateOfBirth || !gender || !handedness) {
      return NextResponse.json(
        { message: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(
      auth.userId,
      {
        dateOfBirth,
        gender,
        handedness,
        phoneNumber,
        location,
        bio,
        isProfileComplete: isProfileComplete || true,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile completed successfully",
      user,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { message: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
