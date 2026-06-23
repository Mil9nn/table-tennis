
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { loginSchema } from "@/lib/validations/auth";
import { userUsesGoogleOnly } from "@/lib/auth/google-user";
import { createAuthenticatedResponse } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/login");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = loginSchema.safeParse(body);
    
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

    const { email, password } = validationResult.data;

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    if (userUsesGoogleOnly(user)) {
      return NextResponse.json(
        {
          message: "This account uses Google sign-in. Please continue with Google.",
          useGoogleAuth: true,
        },
        { status: 400 }
      );
    }

    if (!user.password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          message: "Please verify your email before logging in.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    return createAuthenticatedResponse(user, "Login successful.");
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        message: error?.message || "Something went wrong",
        error: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
