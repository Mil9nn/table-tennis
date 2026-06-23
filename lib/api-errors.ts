/**
 * API Error Helpers
 *
 * Consistent error response utilities for API routes.
 */

import { NextResponse } from "next/server";

export interface ApiErrorOptions {
  details?: string;
  showDetailsInDev?: boolean;
}

/**
 * Create a consistent JSON error response
 *
 * @param message - Error message to return
 * @param status - HTTP status code (default: 500)
 * @param options - Additional options
 */
export function jsonError(
  message: string,
  status: number = 500,
  options: ApiErrorOptions = {}
): NextResponse {
  const { details, showDetailsInDev = true } = options;

  const responseBody: { error: string; details?: string } = {
    error: message,
  };

  if (details && showDetailsInDev && process.env.NODE_ENV === "development") {
    responseBody.details = details;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  notFound: (resource: string = "Resource") =>
    jsonError(`${resource} not found`, 404),

  badRequest: (message: string, details?: string) =>
    jsonError(message, 400, { details }),

  unauthorized: (message: string = "Unauthorized") =>
    jsonError(message, 401),

  forbidden: (message: string = "Forbidden") =>
    jsonError(message, 403),

  serverError: (message: string = "Internal server error", details?: string) =>
    jsonError(message, 500, { details }),

  validationError: (message: string, details?: string) =>
    jsonError(message, 400, { details }),
} as const;
