import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { resendVerificationSchema } from "@/lib/validations/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/zeptomail";

export async function POST(request: NextRequest) {
  // Rate limiting - stricter for email sending
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/send-verification");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = resendVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, a verification link has been sent." },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. You can log in." },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await VerificationToken.deleteMany({
      userId: user._id,
      type: "email_verification",
    });

    // Generate new token (plain text for email)
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash token before storing (security best practice)
    const hashedToken = await bcrypt.hash(token, 10);

    // Save hashed token
    await VerificationToken.create({
      userId: user._id,
      token: hashedToken, // Store hashed token
      type: "email_verification",
      expiresAt,
    });

    // Send verification email (async - don't block)
    const emailSent = await sendVerificationEmail(user.email, user.fullName, token);

    if (!emailSent) {
      console.error("Failed to send verification email to:", email);
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification email sent. Please check your inbox." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

