import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

/**
 * Authentication result type
 */
export type AuthResult =
  | { success: true; userId: string }
  | { success: false; response: NextResponse };

/**
 * Authenticate request and return userId or error response
 * Eliminates repeated auth check patterns across API routes
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }

  return { success: true, userId: decoded.userId };
}

/**
 * Connect to DB and authenticate in one call
 * Common pattern used in most API routes
 */
export async function withAuth(
  request: NextRequest
): Promise<AuthResult> {
  await connectDB();
  return authenticateRequest(request);
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse("Unauthorized", 401),
  invalidToken: () => errorResponse("Invalid token", 401),
  forbidden: (message?: string) => errorResponse(message || "Forbidden", 403),
  notFound: (resource: string) => errorResponse(`${resource} not found`, 404),
  badRequest: (message: string) => errorResponse(message, 400),
  serverError: (message?: string) => errorResponse(message || "Something went wrong", 500),
};













