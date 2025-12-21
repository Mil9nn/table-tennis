/**
 * Team Match Zod Schemas
 *
 * Shared validation schemas for team match forms.
 * Can be used on both client (forms) and server (API validation).
 */

import * as z from "zod";
import { FORMAT_REQUIREMENTS, TeamMatchFormat } from "./teamMatchTypes";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get required positions for Team 1 based on match format
 */
export function getTeam1Positions(format: TeamMatchFormat | string): string[] {
  const requirements = FORMAT_REQUIREMENTS[format as TeamMatchFormat];
  return requirements?.team1 || [];
}

/**
 * Get required positions for Team 2 based on match format
 */
export function getTeam2Positions(format: TeamMatchFormat | string): string[] {
  const requirements = FORMAT_REQUIREMENTS[format as TeamMatchFormat];
  return requirements?.team2 || [];
}

/**
 * Check if a format requires position assignments
 */
export function formatRequiresAssignments(format: TeamMatchFormat | string): boolean {
  const team1Positions = getTeam1Positions(format);
  return team1Positions.length > 0;
}

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Custom match configuration schema (for custom format)
 */
export const customMatchConfigSchema = z.object({
  matches: z.array(
    z.object({
      type: z.enum(["singles", "doubles"]),
      team1Players: z.array(z.string()),
      team2Players: z.array(z.string()),
    })
  ),
});

/**
 * Team match creation schema with cross-field validation
 */
export const teamMatchCreateSchema = z
  .object({
    matchFormat: z.enum(["five_singles", "single_double_single", "custom"]),
    setsPerTie: z.enum(["1", "3", "5", "7"]),
    team1Id: z.string().min(1, "Select Team 1"),
    team2Id: z.string().min(1, "Select Team 2"),
    city: z.string().min(1, "Enter city/venue"),
    venue: z.string().min(1, "Venue is required"),
    team1Assignments: z.record(z.string(), z.string()).optional(),
    team2Assignments: z.record(z.string(), z.string()).optional(),
    customConfig: customMatchConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Validate teams are different
    if (data.team1Id === data.team2Id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team 1 and Team 2 cannot be the same",
        path: ["team2Id"],
      });
    }

    // Get required positions from FORMAT_REQUIREMENTS
    const team1Positions = getTeam1Positions(data.matchFormat);
    const team2Positions = getTeam2Positions(data.matchFormat);

    // Validate position assignments for formats that need them
    if (team1Positions.length > 0) {
      const team1Assignments = data.team1Assignments || {};
      const team2Assignments = data.team2Assignments || {};

      const team1AssignedPositions = new Set(Object.values(team1Assignments));
      const team2AssignedPositions = new Set(Object.values(team2Assignments));

      // Check all required positions are assigned for Team 1
      for (const pos of team1Positions) {
        if (!team1AssignedPositions.has(pos)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Team 1 must have a player assigned to position ${pos}`,
            path: ["team1Assignments"],
          });
          break;
        }
      }

      // Check all required positions are assigned for Team 2
      for (const pos of team2Positions) {
        if (!team2AssignedPositions.has(pos)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Team 2 must have a player assigned to position ${pos}`,
            path: ["team2Assignments"],
          });
          break;
        }
      }
    }

    // Validate custom format has matches configured
    if (data.matchFormat === "custom") {
      if (!data.customConfig || data.customConfig.matches.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom format requires at least one match to be configured",
          path: ["customConfig"],
        });
      }
    }
  });

/**
 * Type inferred from the schema
 */
export type TeamMatchFormValues = z.infer<typeof teamMatchCreateSchema>;

// ============================================
// FORMAT DISPLAY HELPERS
// ============================================

export const teamMatchFormats = [
  { value: "five_singles", label: "5 singles" },
  { value: "single_double_single", label: "S-D-S" },
  { value: "custom", label: "Custom" },
] as const;
