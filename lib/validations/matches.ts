/**
 * Match Validation Schemas
 *
 * Validates match creation, scoring, and related operations
 */

import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Match types
export const matchTypeSchema = z.enum(["singles", "doubles"], {
  error: "Match type must be 'singles' or 'doubles'",
});

// Match status
export const matchStatusSchema = z.enum(["not_started", "in_progress", "completed", "cancelled"]);

// Server position
export const serverPositionSchema = z.enum(["left", "right"]);

// Create individual match schema
export const createIndividualMatchSchema = z.object({
  matchType: matchTypeSchema,

  numberOfSets: z.number()
    .int("Number of sets must be an integer")
    .min(1, "Must have at least 1 set")
    .max(7, "Cannot exceed 7 sets"),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim(),

  venue: z.string()
    .min(3, "Venue must be at least 3 characters")
    .max(200, "Venue must not exceed 200 characters")
    .trim()
    .optional(),

  participants: z.array(objectIdSchema)
    .min(2, "Match must have at least 2 participants")
    .max(4, "Match cannot have more than 4 participants"),

  tournament: objectIdSchema.optional(),
})
.strict()
.refine(
  (data) => {
    // Singles matches must have exactly 2 participants
    if (data.matchType === "singles") {
      return data.participants.length === 2;
    }
    return true;
  },
  {
    message: "Singles matches must have exactly 2 participants",
    path: ["participants"],
  }
)
.refine(
  (data) => {
    // Doubles matches must have exactly 4 participants
    if (data.matchType === "doubles") {
      return data.participants.length === 4;
    }
    return true;
  },
  {
    message: "Doubles matches must have exactly 4 participants",
    path: ["participants"],
  }
)
.refine(
  (data) => {
    // Check for duplicate participants
    const uniqueParticipants = new Set(data.participants);
    return uniqueParticipants.size === data.participants.length;
  },
  {
    message: "Duplicate participants are not allowed",
    path: ["participants"],
  }
);

// Update match score schema
export const updateMatchScoreSchema = z.object({
  gameIndex: z.number().int().min(0, "Game index must be non-negative"),

  playerIndex: z.number().int().min(0).max(3, "Player index must be between 0 and 3"),

  action: z.enum(["add", "undo"], {
    error: "Action must be 'add' or 'undo'",
  }),

  shotType: z.enum([
    "serve",
    "forehand",
    "backhand",
    "smash",
    "drop",
    "lob",
    "block",
    "push",
    "flick",
    "loop",
    "counter",
    "chop",
    "other"
  ]).optional(),

  outcome: z.enum(["win", "error"]).optional(),

  originPosition: z.object({
    x: z.number().min(0).max(100, "X position must be between 0 and 100"),
    y: z.number().min(0).max(100, "Y position must be between 0 and 100"),
  }).optional(),

  landingPosition: z.object({
    x: z.number().min(0).max(100, "X position must be between 0 and 100"),
    y: z.number().min(0).max(100, "Y position must be between 0 and 100"),
  }).optional(),
})
.strict()
.refine(
  (data) => {
    // If action is 'add', shotType and outcome are required
    if (data.action === "add") {
      return data.shotType !== undefined && data.outcome !== undefined;
    }
    return true;
  },
  {
    message: "shotType and outcome are required when action is 'add'",
    path: ["action"],
  }
);

// Update match status schema
export const updateMatchStatusSchema = z.object({
  status: matchStatusSchema,
}).strict();

// Server configuration schema
export const serverConfigSchema = z.object({
  gameIndex: z.number().int().min(0, "Game index must be non-negative"),
  server: z.number().int().min(0).max(3, "Server must be between 0 and 3"),
  serverPosition: serverPositionSchema,
  receiverPosition: serverPositionSchema,
}).strict();

// Swap players schema (for doubles)
export const swapPlayersSchema = z.object({
  side: z.enum(["team1", "team2"], {
    error: "Side must be 'team1' or 'team2'",
  }),
}).strict();

// Extended match type schema for queries (includes 'all')
export const matchTypeQuerySchema = z.enum(["singles", "doubles", "all"]);

// Team match format schema
export const teamMatchFormatSchema = z.enum(["five_singles", "single_double_single", "custom", "all"]);

// Query params for GET individual matches
export const getMatchesQuerySchema = z.object({
  context: z.enum(["casual", "tournament", "all"]).optional(),
  type: matchTypeQuerySchema.optional(),
  status: z.enum(["all", "scheduled", "in_progress", "completed", "cancelled"]).optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid dateFrom format").optional(),
  dateTo: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid dateTo format").optional(),
  sortBy: z.enum(["createdAt", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
  skip: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
}).strict();

// Query params for GET team matches
export const getTeamMatchesQuerySchema = z.object({
  format: teamMatchFormatSchema.optional(),
  status: z.enum(["all", "scheduled", "in_progress", "completed", "cancelled"]).optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid dateFrom format").optional(),
  dateTo: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid dateTo format").optional(),
  sortBy: z.enum(["createdAt", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
  skip: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
}).strict();

// Update individual match schema (for PUT /api/matches/individual/[id])
export const updateIndividualMatchSchema = z.object({
  venue: z.string()
    .min(3, "Venue must be at least 3 characters")
    .max(200, "Venue must not exceed 200 characters")
    .trim()
    .optional(),
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),
  notes: z.string()
    .max(1000, "Notes must not exceed 1000 characters")
    .trim()
    .optional(),
  shotTrackingMode: z.enum(["detailed", "simple"], {
    error: "shotTrackingMode must be 'detailed' or 'simple'",
  }).optional(),
}).strict();

// Update team match schema (for PUT /api/matches/team/[id])
export const updateTeamMatchSchema = z.object({
  venue: z.string()
    .min(3, "Venue must be at least 3 characters")
    .max(200, "Venue must not exceed 200 characters")
    .trim()
    .optional(),
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),
  status: matchStatusSchema.optional(),
  notes: z.string()
    .max(1000, "Notes must not exceed 1000 characters")
    .trim()
    .optional(),
  shotTrackingMode: z.enum(["detailed", "simple"], {
    error: "shotTrackingMode must be 'detailed' or 'simple'",
  }).optional(),
}).strict();

// Export type inference
export type CreateIndividualMatchInput = z.infer<typeof createIndividualMatchSchema>;
export type UpdateMatchScoreInput = z.infer<typeof updateMatchScoreSchema>;
export type UpdateMatchStatusInput = z.infer<typeof updateMatchStatusSchema>;
export type ServerConfigInput = z.infer<typeof serverConfigSchema>;
export type SwapPlayersInput = z.infer<typeof swapPlayersSchema>;
export type UpdateIndividualMatchInput = z.infer<typeof updateIndividualMatchSchema>;
export type UpdateTeamMatchInput = z.infer<typeof updateTeamMatchSchema>;
export type GetMatchesQuery = z.infer<typeof getMatchesQuerySchema>;
export type GetTeamMatchesQuery = z.infer<typeof getTeamMatchesQuerySchema>;
