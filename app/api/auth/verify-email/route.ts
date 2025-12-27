import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { verifyEmailSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = verifyEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid verification token" },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Find the token
    const verificationToken = await VerificationToken.findOne({
      token,
      type: "email_verification",
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: "Invalid or expired verification link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > verificationToken.expiresAt) {
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      return NextResponse.json(
        { message: "Verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(verificationToken.userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      // Clean up token
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      return NextResponse.json(
        { message: "Email is already verified. You can log in." },
        { status: 200 }
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Delete the used token
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    return NextResponse.json(
      { 
        message: "Email verified successfully! You can now log in.",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

