/**
 * Route Wrapper Utilities
 *
 * Higher-order functions for consistent error handling across API routes.
 * Eliminates try-catch boilerplate and ensures consistent error responses.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonError } from "./http";

type RouteContext = { params: Promise<Record<string, string>> };

type RouteHandler<T extends RouteContext = RouteContext> = (
  req: NextRequest,
  context: T
) => Promise<Response>;

/**
 * Wrap a route handler with automatic error handling
 *
 * Catches any thrown errors (including ApiError) and returns appropriate responses.
 * Eliminates try-catch boilerplate from every route.
 *
 * @example
 * ```ts
 * export const POST = withErrorHandling(async (req, { params }) => {
 *   const { userId } = await requireAuth(req);
 *   const { id } = await params;
 *
 *   // Business logic - can throw ApiError or any error
 *   const tournament = await loadTournament(id, userId, { requireOrganizer: true });
 *
 *   return jsonOk({ tournament });
 * });
 * ```
 */
export function withErrorHandling<T extends RouteContext>(
  handler: RouteHandler<T>
): RouteHandler<T> {
  return async (req: NextRequest, context: T): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}

/**
 * Wrap a route handler with DB connection and error handling
 *
 * Combines database connection with error handling for convenience.
 * Use this for routes that need database access.
 *
 * @example
 * ```ts
 * export const GET = withDBAndErrorHandling(async (req, { params }) => {
 *   const { id } = await params;
 *   const tournament = await Tournament.findById(id);
 *   return jsonOk({ tournament });
 * });
 * ```
 */
export function withDBAndErrorHandling<T extends RouteContext>(
  handler: RouteHandler<T>
): RouteHandler<T> {
  return async (req: NextRequest, context: T): Promise<Response> => {
    try {
      await connectDB();
      return await handler(req, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}
