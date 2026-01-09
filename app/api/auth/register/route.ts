import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { registerSchema } from "@/lib/validations/auth";
import { generateOTP, sendOTPEmail } from "@/lib/zeptomail";

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

    // 2. Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Hash OTP before storing (production pattern)
    const otpHash = await bcrypt.hash(otp, 10);

    // 4. Save hashed OTP with userId for efficient lookup
    await VerificationToken.create({
      userId: newUser._id,
      token: otpHash, // Store hashed OTP in token field
      type: "email_verification",
      expiresAt,
      attemptsLeft: 3,
    });

    // 5. Send OTP email (await to ensure it completes in serverless environments)
    // User can register even if email service is temporarily down
    // They can request a new OTP later via /api/auth/send-otp
    let emailSent = false;
    try {
      emailSent = await sendOTPEmail(email, fullName, otp, "email_verification");
      if (!emailSent) {
        console.error("❌ [Register] Failed to send OTP email to:", email);
        // Don't fail registration - OTP can be resent later via /api/auth/send-otp
      }
    } catch (emailError) {
      console.error("❌ [Register] Error sending OTP email:", emailError instanceof Error ? emailError.message : String(emailError));
      // Don't fail registration - OTP can be resent later via /api/auth/send-otp
    }

    // Return success - user created but NOT verified yet
    // User cannot log in until email is verified (login route checks isEmailVerified)
    return NextResponse.json(
      {
        message: "Almost there! An OTP has been sent to your email. Please verify to start using your account.",
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