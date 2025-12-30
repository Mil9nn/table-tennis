import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    // Find verification tokens by type
    // Since tokens are hashed, we need to compare against all tokens
    // Optimize: Get tokens that haven't expired yet
    const verificationTokens = await VerificationToken.find({
      type: "email_verification",
      expiresAt: { $gt: new Date() }, // Only check non-expired tokens
    });

    // Find the matching token by comparing hashes
    let verificationToken = null;
    for (const tokenDoc of verificationTokens) {
      try {
        const isMatch = await bcrypt.compare(token, tokenDoc.token);
        if (isMatch) {
          verificationToken = tokenDoc;
          break;
        }
      } catch (error) {
        // Skip invalid tokens (not bcrypt hashes)
        continue;
      }
    }

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

    // 6. Verify token → set isEmailVerified = true
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // 7. Delete the used token
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

