/**
 * Tournament Validation Schemas
 *
 * Validates tournament creation, updates, and related operations
 */

import { z } from "zod";
import { matchTypeSchema } from "./matches";

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Tournament formats
export const tournamentFormatSchema = z.enum(["round_robin", "knockout", "hybrid"], {
  error: "Format must be 'round_robin', 'knockout', or 'hybrid'",
});

// Tournament categories
export const tournamentCategorySchema = z.enum(["individual", "team"], {
  error: "Category must be 'individual' or 'team'",
});

// Re-export matchTypeSchema for convenience
export { matchTypeSchema };

// Seeding methods
export const seedingMethodSchema = z.enum(["none", "manual", "ranking", "random"], {
  error: "Seeding method must be 'none', 'manual', 'ranking', or 'random'",
});

// Deuce settings
export const deuceSettingSchema = z.enum(["standard", "no_advantage"], {
  error: "Deuce setting must be 'standard' or 'no_advantage'",
});

// Tournament rules schema
export const tournamentRulesSchema = z.object({
  pointsForWin: z.number().int().min(0).max(10).default(2),
  pointsForLoss: z.number().int().min(0).max(10).default(0),
  setsPerMatch: z.number().int().min(1).max(7).default(3),
  pointsPerSet: z.number().int().min(5).max(21).default(11),
  advanceTop: z.number().int().min(0).optional().default(0),
  deuceSetting: deuceSettingSchema.default("standard"),
  tiebreakRules: z.array(z.enum([
    "points",
    "head_to_head",
    "sets_ratio",
    "points_ratio",
    "sets_won"
  ])).optional().default([
    "points",
    "head_to_head",
    "sets_ratio",
    "points_ratio",
    "sets_won"
  ]),
}).strict();

// Knockout config schema
export const knockoutConfigSchema = z.object({
  thirdPlaceMatch: z.boolean().optional().default(false),
  consolationBracket: z.boolean().optional().default(false),
}).strict().optional();

// Hybrid config schema
export const hybridConfigSchema = z.object({
  roundRobinRules: tournamentRulesSchema.optional(),
  knockoutRules: tournamentRulesSchema.optional(),
}).strict().optional();

// Team config schema
export const teamConfigSchema = z.object({
  matchFormat: z.enum([
    "five_singles",
    "four_singles_one_doubles",
    "three_singles_two_doubles",
    "custom"
  ]),
  setsPerSubMatch: z.number().int().min(1).max(5).default(3),
}).strict().optional();

// Create tournament schema
export const createTournamentSchema = z.object({
  name: z.string()
    .min(3, "Tournament name must be at least 3 characters")
    .max(100, "Tournament name must not exceed 100 characters")
    .trim(),

  format: tournamentFormatSchema,

  category: tournamentCategorySchema,

  matchType: matchTypeSchema,

  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
      "Start date cannot be in the past"),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim(),

  venue: z.string()
    .min(3, "Venue must be at least 3 characters")
    .max(200, "Venue must not exceed 200 characters")
    .trim(),

  participants: z.array(objectIdSchema)
    .optional()
    .default([]),

  rules: tournamentRulesSchema.optional(),

  useGroups: z.boolean().optional().default(false),

  numberOfGroups: z.number().int().min(2).max(8).optional(),

  advancePerGroup: z.number().int().min(1).max(10).optional(),

  seedingMethod: seedingMethodSchema.optional().default("none"),

  knockoutConfig: knockoutConfigSchema,

  hybridConfig: hybridConfigSchema,

  teamConfig: teamConfigSchema,
})
.strict()
.refine(
  (data) => {
    // If useGroups is true, numberOfGroups and advancePerGroup must be provided
    if (data.useGroups) {
      return data.numberOfGroups !== undefined && data.advancePerGroup !== undefined;
    }
    return true;
  },
  {
    message: "When using groups, both numberOfGroups and advancePerGroup are required",
    path: ["useGroups"],
  }
)
.refine(
  (data) => {
    // Groups cannot be used with round-robin format
    if (data.format === "round_robin" && data.useGroups) {
      return false;
    }
    return true;
  },
  {
    message: "Groups cannot be used with round-robin format. Use 'hybrid' format instead.",
    path: ["useGroups"],
  }
)
.refine(
  (data) => {
    // Team tournaments must have teamConfig
    if (data.category === "team" && !data.teamConfig) {
      return false;
    }
    return true;
  },
  {
    message: "Team tournaments must have teamConfig",
    path: ["teamConfig"],
  }
)
.refine(
  (data) => {
    // Hybrid format must have hybridConfig
    if (data.format === "hybrid" && !data.hybridConfig) {
      return false;
    }
    return true;
  },
  {
    message: "Hybrid tournaments must have hybridConfig",
    path: ["hybridConfig"],
  }
)
.refine(
  (data) => {
    // Singles matches need 2 participants if provided
    if (data.matchType === "singles" && data.participants && data.participants.length > 0) {
      return data.participants.length >= 2;
    }
    return true;
  },
  {
    message: "Singles tournaments need at least 2 participants",
    path: ["participants"],
  }
)
.refine(
  (data) => {
    // Doubles matches need 4 participants if provided
    if (data.matchType === "doubles" && data.participants && data.participants.length > 0) {
      return data.participants.length >= 4 && data.participants.length % 2 === 0;
    }
    return true;
  },
  {
    message: "Doubles tournaments need at least 4 participants (even number)",
    path: ["participants"],
  }
);

// Update tournament schema (all fields optional except what should be validated)
export const updateTournamentSchema = z.object({
  name: z.string()
    .min(3, "Tournament name must be at least 3 characters")
    .max(100, "Tournament name must not exceed 100 characters")
    .trim()
    .optional(),

  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .optional(),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),

  venue: z.string()
    .min(3, "Venue must be at least 3 characters")
    .max(200, "Venue must not exceed 200 characters")
    .trim()
    .optional(),

  rules: tournamentRulesSchema.optional(),

  seedingMethod: seedingMethodSchema.optional(),

  knockoutConfig: knockoutConfigSchema,

  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
}).strict();

// Join tournament schema
export const joinTournamentSchema = z.object({
  tournamentId: objectIdSchema,
  joinCode: z.string()
    .length(6, "Join code must be exactly 6 characters")
    .regex(/^[A-Z0-9]{6}$/, "Invalid join code format")
    .optional(),
  participantId: objectIdSchema.optional(), // For team tournaments
}).strict();

// Add participant schema
export const addParticipantSchema = z.object({
  participantId: objectIdSchema,
}).strict();

// Seeding schema
export const seedingSchema = z.object({
  seeding: z.array(z.object({
    participant: objectIdSchema,
    seedNumber: z.number().int().min(1),
  })).min(1, "At least one seed is required"),
}).strict();

// Query params validation for GET tournaments
export const getTournamentsQuerySchema = z.object({
  status: z.enum(["all", "draft", "active", "completed", "cancelled"]).optional(),
  format: z.enum(["all", "round_robin", "knockout", "hybrid"]).optional(),
  category: z.enum(["all", "individual", "team"]).optional(),
  city: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
  skip: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
  sortBy: z.enum(["startDate", "name", "participants", "createdAt"]).optional().default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
}).strict();

// Export type inference
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type SeedingInput = z.infer<typeof seedingSchema>;
export type GetTournamentsQuery = z.infer<typeof getTournamentsQuerySchema>;
