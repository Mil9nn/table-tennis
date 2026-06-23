import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";

export async function PUT(req: NextRequest) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const body = await req.json();
    const {
      fullName,
      dateOfBirth,
      gender,
      handedness,
      phoneNumber,
      location,
      bio,
    } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (handedness !== undefined) updateData.handedness = handedness;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    // Update user profile
    const user = await User.findByIdAndUpdate(
      auth.userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
