import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { registerSchema } from "@/lib/validations/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/ses";

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

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token
    await VerificationToken.create({
      userId: newUser._id,
      token: verificationToken,
      type: "email_verification",
      expiresAt,
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(
      newUser.email,
      newUser.fullName,
      verificationToken
    );

    if (!emailSent) {
      console.error("Failed to send verification email during registration");
      // Don't fail registration, user can request a new email later
    }

    // Return success without setting auth cookie - user must verify email first
    return NextResponse.json(
      {
        message: "Registration successful! Please check your email to verify your account.",
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