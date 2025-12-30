import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { registerSchema } from "@/lib/validations/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/zeptomail";

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/register");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input using Zod schema
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

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return NextResponse.json(
        { 
          message: existingUser.username === username 
            ? "Username already exists" 
            : "Email already exists" 
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // PRODUCTION-GRADE SECURITY FLOW:
    // 1. Create user first (isEmailVerified = false)
    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      isEmailVerified: false, // Email verification required before login
    });

    await newUser.save();

    // 2. Generate verification token (plain text for email)
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 3. Hash token before storing in database (security best practice)
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // 4. Save hashed verification token
    await VerificationToken.create({
      userId: newUser._id,
      token: hashedToken, // Store hashed token
      type: "email_verification",
      expiresAt,
    });

    // 5. Send email asynchronously (don't block registration)
    // User can register even if email service is temporarily down
    // They can request a new verification email later
    sendVerificationEmail(email, fullName, verificationToken).catch((error) => {
      console.error("Failed to send verification email (async):", error);
      // Don't fail registration - email can be resent later via /api/auth/send-verification
    });

    // Return success - user created but NOT verified yet
    // User cannot log in until email is verified (login route checks isEmailVerified)
    return NextResponse.json(
      {
        message: "Account created! Please check your email to verify your account. You cannot log in until your email is verified.",
        requiresVerification: true,
        user: {
          _id: newUser._id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}