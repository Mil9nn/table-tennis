/**
 * Authentication Utilities
 *
 * Centralized auth handling for API routes.
 * Replaces duplicated token verification patterns.
 */

import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { ApiError } from "./http";

export interface AuthUser {
  userId: string;
}

/**
 * Require authenticated user - throws ApiError if not authenticated
 *
 * @example
 * ```ts
 * export const POST = withErrorHandling(async (req, context) => {
 *   const { userId } = await requireAuth(req);
 *   // userId is guaranteed to be valid here
 * });
 * ```
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw ApiError.unauthorized("Authentication required");
  }

  const decoded = verifyToken(token);

  if (!decoded?.userId) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  return { userId: decoded.userId };
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 * Does not throw on missing/invalid token
 *
 * @example
 * ```ts
 * const user = await optionalAuth(req);
 * if (user) {
 *   // logged in user
 * } else {
 *   // anonymous access
 * }
 * ```
 */
export async function optionalAuth(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);

  if (!decoded?.userId) {
    return null;
  }

  return { userId: decoded.userId };
}
