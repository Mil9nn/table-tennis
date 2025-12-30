import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { token, password } = validationResult.data;

    // Find password reset tokens (need to compare hashes)
    const resetTokens = await VerificationToken.find({
      type: "password_reset",
      expiresAt: { $gt: new Date() }, // Only check non-expired tokens
    });

    // Find the matching token by comparing hashes
    let resetToken = null;
    for (const tokenDoc of resetTokens) {
      try {
        const isMatch = await bcrypt.compare(token, tokenDoc.token);
        if (isMatch) {
          resetToken = tokenDoc;
          break;
        }
      } catch (error) {
        // Skip invalid tokens (not bcrypt hashes)
        continue;
      }
    }

    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if expired (double check)
    if (new Date() > resetToken.expiresAt) {
      await VerificationToken.deleteOne({ _id: resetToken._id });
      return NextResponse.json(
        { message: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete the used token
    await VerificationToken.deleteOne({ _id: resetToken._id });

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

// GET endpoint to validate token before showing reset form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find password reset tokens (need to compare hashes)
    const resetTokens = await VerificationToken.find({
      type: "password_reset",
      expiresAt: { $gt: new Date() }, // Only check non-expired tokens
    });

    // Find the matching token by comparing hashes
    let resetToken = null;
    for (const tokenDoc of resetTokens) {
      try {
        const isMatch = await bcrypt.compare(token, tokenDoc.token);
        if (isMatch) {
          resetToken = tokenDoc;
          break;
        }
      } catch (error) {
        // Skip invalid tokens (not bcrypt hashes)
        continue;
      }
    }

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, message: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Check if expired (double check)
    if (new Date() > resetToken.expiresAt) {
      await VerificationToken.deleteOne({ _id: resetToken._id });
      return NextResponse.json(
        { valid: false, message: "Reset link has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, message: "Token is valid" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate reset token error:", error);
    return NextResponse.json(
      { valid: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

