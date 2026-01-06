import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { validateRequest, updateUserPreferenceSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // ✅ get token from cookies
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ verify JWT
    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // ✅ find user
    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth Me error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body using Zod schema
    const validation = validateRequest(updateUserPreferenceSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { shotTrackingMode } = validation.data;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { shotTrackingMode: shotTrackingMode || "detailed" },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Update user preference error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}