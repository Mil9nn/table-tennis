import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    // Get token from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyToken(token) as { userId: string };
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      dateOfBirth,
      gender,
      handedness,
      phoneNumber,
      location,
      bio,
      playingStyle,
      isProfileComplete,
    } = body;

    // Validate required fields
    if (!dateOfBirth || !gender || !handedness || !playingStyle) {
      return NextResponse.json(
        { message: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        dateOfBirth,
        gender,
        handedness,
        phoneNumber,
        location,
        bio,
        playingStyle,
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
