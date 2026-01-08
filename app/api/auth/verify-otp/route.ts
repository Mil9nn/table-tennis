import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { verifyOTPSchema } from "@/lib/validations/auth";
import { generateToken, setAuthCookie } from "@/lib/jwt";

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

    // Query OTP by userId and type (production pattern: query by userId, not loop through all)
    const tokenType = purpose === "email_verification" ? "email_verification" : "password_reset";
    const otpToken = await VerificationToken.findOne({
      userId: user._id,
      type: tokenType,
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

    // OTP is valid - handle based on purpose
    if (purpose === "email_verification") {
      // Mark email as verified
      if (user.isEmailVerified) {
        await VerificationToken.deleteOne({ _id: otpToken._id });
        return NextResponse.json(
          { message: "Email is already verified." },
          { status: 400 }
        );
      }

      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      // Delete the used OTP token
      await VerificationToken.deleteOne({ _id: otpToken._id });

      // Auto-login: Generate JWT token and set auth cookie
      let token;
      try {
        token = generateToken(user._id.toString());
      } catch (tokenError: any) {
        console.error("Failed to generate JWT token:", tokenError);
        return NextResponse.json(
          { 
            message: "Authentication error - failed to generate token",
            error: process.env.NODE_ENV === "development" ? tokenError.message : undefined
          },
          { status: 500 }
        );
      }

      const response = NextResponse.json(
        { 
          message: "Email verified successfully! Welcome to the app.",
          verified: true,
          user: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profileImage: user.profileImage,
            isProfileComplete: user.isProfileComplete,
          }
        },
        { status: 200 }
      );

      setAuthCookie(response, token);
      return response;
    } else if (purpose === "password_reset") {
      // Delete the used OTP token
      await VerificationToken.deleteOne({ _id: otpToken._id });

      // Return success - frontend will handle password reset with OTP verified
      return NextResponse.json(
        { 
          message: "OTP verified successfully. You can now reset your password.",
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

