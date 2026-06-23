import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { googleAuthSchema } from "@/lib/validations/auth";
import { isGoogleAuthConfigured, verifyGoogleIdToken } from "@/lib/auth/google-verify";
import { resolveUserFromGoogle } from "@/lib/auth/google-user";
import { createAuthenticatedResponse } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/google");
  if (rateLimitResponse) return rateLimitResponse;

  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { message: "Google sign-in is not configured on this server." },
      { status: 503 }
    );
  }

  try {
    await connectDB();
    const body = await request.json();

    const validation = googleAuthSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const profile = await verifyGoogleIdToken(validation.data.idToken);
    const result = await resolveUserFromGoogle(profile);

    const message =
      result.action === "register"
        ? "Welcome! Your account has been created."
        : "Signed in with Google.";

    return createAuthenticatedResponse(result.user, message, result.action === "register" ? 201 : 200);
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_CONFLICT") {
      return NextResponse.json(
        { message: "This email is linked to a different Google account." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "GOOGLE_CLIENT_IDS is not configured") {
      return NextResponse.json(
        { message: "Google sign-in is not configured on this server." },
        { status: 503 }
      );
    }

    const isTokenError =
      error instanceof Error &&
      (error.message.includes("Google") ||
        error.message.includes("token") ||
        error.message.includes("Token"));

    if (isTokenError) {
      return NextResponse.json({ message: "Invalid or expired Google sign-in. Please try again." }, { status: 401 });
    }

    console.error("[Auth/Google] Error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
