/**
 * HTTP Response Utilities
 *
 * Standardized error handling and response formatting for API routes.
 * Replaces scattered error handling patterns with a consistent approach.
 */

import { NextResponse, NextRequest } from "next/server";

/**
 * Custom API Error class for throwing typed errors
 * Can be caught by withErrorHandling wrapper for consistent responses
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: string;

  constructor(
    status: number,
    message: string,
    options?: { code?: string; details?: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }

  static badRequest(message: string, details?: string) {
    return new ApiError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(resource: string = "Resource") {
    return new ApiError(404, `${resource} not found`, { code: "NOT_FOUND" });
  }

  static conflict(message: string, details?: string) {
    return new ApiError(409, message, { code: "CONFLICT", details });
  }

  static tooManyRequests(message: string = "Too many requests") {
    return new ApiError(429, message, { code: "TOO_MANY_REQUESTS" });
  }

  static internal(message: string = "Internal server error", details?: string) {
    return new ApiError(500, message, { code: "INTERNAL_ERROR", details });
  }

  static serviceUnavailable(message: string = "Service temporarily unavailable") {
    return new ApiError(503, message, { code: "SERVICE_UNAVAILABLE" });
  }
}

/**
 * Standard success response
 */
export function jsonOk<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standard error response
 * Handles ApiError instances and unknown errors consistently
 */
export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const body: Record<string, unknown> = {
      error: error.message,
    };

    if (error.code) {
      body.code = error.code;
    }

    if (error.details && process.env.NODE_ENV === "development") {
      body.details = error.details;
    }

    return NextResponse.json(body, { status: error.status });
  }

  // Unknown error - log and return generic message
  console.error("Unhandled API error:", error);

  const body: Record<string, unknown> = {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  };

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    body.details = error.message;
  }

  return NextResponse.json(body, { status: 500 });
}

/**
 * Create error response directly (for cases where you don't want to throw)
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  options?: { code?: string; details?: string }
): NextResponse {
  const body: Record<string, unknown> = { error: message };

  if (options?.code) {
    body.code = options.code;
  }

  if (options?.details && process.env.NODE_ENV === "development") {
    body.details = options.details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Error handling wrapper for API routes
 * Automatically catches errors and returns standardized error responses
 *
 * @example
 * export const POST = withErrorHandling(async (req) => {
 *   const { userId } = await requireAuth(req);
 *   // ... route logic
 *   return NextResponse.json({ success: true });
 * });
 */
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}

