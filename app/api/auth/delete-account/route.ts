import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { withAuth } from "@/lib/api-utils";
import { clearAuthCookie } from "@/lib/jwt";
import { deleteAccountSchema } from "@/lib/validations/auth";
import {
  deleteUserAccount,
  DeleteAccountError,
} from "@/lib/auth/delete-account";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(
    request,
    "POST",
    "/api/auth/delete-account"
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const validation = deleteAccountSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    await deleteUserAccount(auth.userId, { password });

    const response = NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
    clearAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof DeleteAccountError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("Delete account error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
