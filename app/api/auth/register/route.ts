import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { HydratedDocument } from "mongoose";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { registerSchema } from "@/lib/validations/auth";
import { generateOTP, sendOTPEmail } from "@/lib/zeptomail";

type UserDoc = HydratedDocument<{
  _id: unknown;
  username: string;
  fullName: string;
  email: string;
}>;

async function issueEmailVerificationOtp(
  user: UserDoc,
  displayName: string
): Promise<void> {
  await VerificationToken.deleteMany({
    userId: user._id,
    type: "email_verification",
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otpHash = await bcrypt.hash(otp, 10);

  await VerificationToken.create({
    userId: user._id,
    token: otpHash,
    type: "email_verification",
    expiresAt,
    attemptsLeft: 3,
  });

  try {
    const emailSent = await sendOTPEmail(
      user.email,
      displayName,
      otp,
      "email_verification"
    );
    if (!emailSent) {
      console.error("❌ [Register] Failed to send OTP email to:", user.email);
    }
  } catch (emailError) {
    console.error(
      "❌ [Register] Error sending OTP email:",
      emailError instanceof Error ? emailError.message : String(emailError)
    );
  }
}

function verificationSuccessResponse(
  user: UserDoc,
  message: string,
  status = 201
) {
  return NextResponse.json(
    {
      message,
      requiresVerification: true,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/register");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const { username, fullName, email, password } = validationResult.data;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser.email === email && existingUser.googleId) {
        return NextResponse.json(
          {
            message: "An account with this email already exists. Sign in with Google instead.",
            useGoogleAuth: true,
          },
          { status: 400 }
        );
      }

      // Account exists but email not verified — resend OTP instead of a duplicate error
      if (existingUser.email === email && !existingUser.isEmailVerified) {
        if (!existingUser.password) {
          return NextResponse.json(
            { message: "Email already exists" },
            { status: 400 }
          );
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.password);
        if (!passwordMatches) {
          return NextResponse.json(
            {
              message:
                "An account with this email already exists. Sign in with your password or use Forgot Password.",
            },
            { status: 400 }
          );
        }

        if (existingUser.username !== username) {
          return NextResponse.json(
            { message: "Email already exists" },
            { status: 400 }
          );
        }

        existingUser.fullName = fullName;
        await existingUser.save();

        await issueEmailVerificationOtp(existingUser, fullName);

        return verificationSuccessResponse(
          existingUser,
          "We sent a new verification code to your email. Enter it below to finish signing up.",
          200
        );
      }

      return NextResponse.json(
        {
          message:
            existingUser.username === username
              ? "Username already exists"
              : "Email already exists",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      isEmailVerified: false,
    });

    await newUser.save();
    await issueEmailVerificationOtp(newUser, fullName);

    return verificationSuccessResponse(
      newUser,
      "Almost there! An OTP has been sent to your email. Please verify to start using your account."
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
