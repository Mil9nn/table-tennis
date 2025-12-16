/**
 * API Utilities
 *
 * Centralized exports for all API route utilities.
 * Import from this file for convenient access.
 *
 * @example
 * ```ts
 * import {
 *   withErrorHandling,
 *   requireAuth,
 *   loadTournament,
 *   jsonOk,
 *   ApiError,
 * } from "@/lib/api";
 * ```
 */

// HTTP utilities
export { ApiError, jsonOk, jsonError, createErrorResponse } from "./http";

// Authentication
export { requireAuth, optionalAuth, type AuthUser } from "./auth";

// Tournament loading
export {
  loadTournament,
  getMatchModel,
  getParticipantPopulateConfig,
  filterValidParticipants,
  type TournamentLoadOptions,
  type LoadedTournament,
} from "./tournamentLoader";

// Route wrappers
export { withErrorHandling, withDBAndErrorHandling } from "./routeWrapper";
