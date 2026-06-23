// services/tournamentService.ts
/**
 * DEPRECATED: This file is kept for backward compatibility
 * Please import from "@/services/tournament" instead
 *
 * This file re-exports all functionality from the new modular tournament services
 */

// Re-export everything from the new modular structure
export * from "./tournament";

// For legacy code that might import specific types
import type { IStanding } from "@/models/Tournament";
export type { IStanding };
