import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { resetPasswordWithOTPSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/reset-password");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordWithOTPSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { email, otp, password } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid OTP or email." },
        { status: 400 }
      );
    }

    // Query OTP by userId and type (production pattern: query by userId, not loop through all)
    const otpToken = await VerificationToken.findOne({
      userId: user._id,
      type: "password_reset",
      expiresAt: { $gt: new Date() }, // Only check non-expired tokens
    });

    if (!otpToken) {
      return NextResponse.json(
        { message: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if expired (double check)
    if (new Date() > otpToken.expiresAt) {
      await VerificationToken.deleteOne({ _id: otpToken._id });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempts left
    if (otpToken.attemptsLeft <= 0) {
      await VerificationToken.deleteOne({ _id: otpToken._id });
      return NextResponse.json(
        { message: "Maximum verification attempts exceeded. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Single bcrypt comparison (production pattern)
    const isMatch = await bcrypt.compare(otp, otpToken.token);

    if (!isMatch) {
      // Decrement attempts left
      otpToken.attemptsLeft -= 1;
      await otpToken.save();

      if (otpToken.attemptsLeft <= 0) {
        await VerificationToken.deleteOne({ _id: otpToken._id });
        return NextResponse.json(
          { message: "Invalid OTP. Maximum attempts exceeded. Please request a new OTP." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: `Invalid OTP. ${otpToken.attemptsLeft} attempt(s) remaining.` },
        { status: 400 }
      );
    }

    // OTP is valid - proceed with password reset
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete the used OTP token
    await VerificationToken.deleteOne({ _id: otpToken._id });

    // Also delete any other password reset tokens for this user
    await VerificationToken.deleteMany({
      userId: user._id,
      type: "password_reset",
    });

    return NextResponse.json(
      { 
        message: "Password reset successfully! You can now log in with your new password.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

