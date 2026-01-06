import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateOTP, sendOTPEmail } from "@/lib/zeptomail";

export async function POST(request: NextRequest) {
  // Rate limiting - very strict for password reset
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/forgot-password");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success message to prevent email enumeration
    const successMessage = "If an account exists with this email, a password reset link has been sent.";

    if (!user) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    // Delete any existing password reset OTPs for this user
    await VerificationToken.deleteMany({
      userId: user._id,
      type: "password_reset",
    });

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP before storing (production pattern)
    const otpHash = await bcrypt.hash(otp, 10);

    // Save hashed OTP with userId for efficient lookup
    await VerificationToken.create({
      userId: user._id,
      token: otpHash, // Store hashed OTP in token field
      type: "password_reset",
      expiresAt,
      attemptsLeft: 3,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, user.fullName, otp, "password_reset");

    if (!emailSent) {
      console.error("Failed to send password reset email to:", email);
      // Still return success to prevent email enumeration
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: successMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

