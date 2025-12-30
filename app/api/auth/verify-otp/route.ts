import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { verifyOTPSchema } from "@/lib/validations/auth";
import { generateVerificationToken } from "@/lib/zeptomail";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  // Rate limiting - strict for OTP verification
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/verify-otp");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = verifyOTPSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input. Please provide a valid email, 6-digit OTP, and purpose." },
        { status: 400 }
      );
    }

    const { email, otp, purpose } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid OTP or email." },
        { status: 400 }
      );
    }

    // Find the OTP token
    const otpToken = await VerificationToken.findOne({
      userId: user._id,
      token: otp,
      type: "otp",
    });

    if (!otpToken) {
      return NextResponse.json(
        { message: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > otpToken.expiresAt) {
      await VerificationToken.deleteOne({ _id: otpToken._id });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Delete the used OTP token
    await VerificationToken.deleteOne({ _id: otpToken._id });

    // Handle based on purpose
    if (purpose === "email_verification") {
      // Mark email as verified
      if (user.isEmailVerified) {
        return NextResponse.json(
          { message: "Email is already verified." },
          { status: 400 }
        );
      }

      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      return NextResponse.json(
        { 
          message: "Email verified successfully! You can now log in.",
          verified: true
        },
        { status: 200 }
      );
    } else if (purpose === "password_reset") {
      // Generate password reset token (similar to forgot-password flow)
      // Delete any existing password reset tokens
      await VerificationToken.deleteMany({
        userId: user._id,
        type: "password_reset",
      });

      // Generate new password reset token
      const resetToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save password reset token
      await VerificationToken.create({
        userId: user._id,
        token: resetToken,
        type: "password_reset",
        expiresAt,
      });

      return NextResponse.json(
        { 
          message: "OTP verified successfully. You can now reset your password.",
          resetToken: resetToken,
          verified: true
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Invalid purpose." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

