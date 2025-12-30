import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { sendOTPSchema } from "@/lib/validations/auth";
import { generateOTP, sendOTPEmail } from "@/lib/zeptomail";

export async function POST(request: NextRequest) {
  // Rate limiting - strict for OTP sending
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/send-otp");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = sendOTPSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input. Please provide a valid email and purpose." },
        { status: 400 }
      );
    }

    const { email, purpose } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email });

    // For email verification: user must exist
    if (purpose === "email_verification") {
      if (!user) {
        return NextResponse.json(
          { message: "No account found with this email address." },
          { status: 404 }
        );
      }

      if (user.isEmailVerified) {
        return NextResponse.json(
          { message: "Email is already verified." },
          { status: 400 }
        );
      }
    }

    // For password reset: don't reveal if user exists (security)
    const successMessage = "If an account exists with this email, an OTP has been sent.";

    if (purpose === "password_reset" && !user) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    // Delete any existing OTP tokens for this user and purpose
    await VerificationToken.deleteMany({
      userId: user._id,
      type: "otp",
    });

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP token
    await VerificationToken.create({
      userId: user._id,
      token: otp,
      type: "otp",
      expiresAt,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, user.fullName, otp, purpose);

    if (!emailSent) {
      console.error("Failed to send OTP email to:", email);
      return NextResponse.json(
        { message: "Failed to send OTP. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: purpose === "password_reset" ? successMessage : "OTP has been sent to your email. Please check your inbox.",
        expiresIn: 600 // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

