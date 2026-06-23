/**
 * Team Validation Schemas
 *
 * Validates team creation, updates, and related operations
 */

import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Player positions in team match
export const playerPositionSchema = z.enum([
  "position_1",
  "position_2",
  "position_3",
  "position_4",
  "position_5",
  "doubles_team_1_player_1",
  "doubles_team_1_player_2",
  "doubles_team_2_player_1",
  "doubles_team_2_player_2",
]);

/** Shared fields for team creation (multipart or JSON body). */
const teamCreateCoreSchema = z.object({
  name: z.string()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name must not exceed 100 characters")
    .trim()
    .refine(
      (name) => !/^\s|\s$/.test(name),
      "Team name cannot start or end with whitespace"
    ),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),

  captain: objectIdSchema,

  players: z.array(objectIdSchema)
    .min(1, "Team must include the captain on the roster")
    .max(20, "Team cannot have more than 20 players"),
});

const teamCreateRefinements = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .strict()
    .refine(
      (data: { captain: string; players: string[] }) =>
        data.players.includes(data.captain),
      {
        message: "Captain must be one of the team players",
        path: ["captain"],
      }
    )
    .refine(
      (data: { players: string[] }) => {
        const uniquePlayers = new Set(data.players);
        return uniquePlayers.size === data.players.length;
      },
      {
        message: "Duplicate players are not allowed",
        path: ["players"],
      }
    );

/** JSON `POST /api/teams` (no file upload). */
export const createTeamJsonBodySchema = teamCreateRefinements(teamCreateCoreSchema);

// Create team schema (multipart: optional image)
export const createTeamSchema = teamCreateRefinements(
  teamCreateCoreSchema.extend({
    teamImage: z.instanceof(Blob).optional(),
  })
);

// Update team schema
export const updateTeamSchema = z.object({
  name: z.string()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name must not exceed 100 characters")
    .trim()
    .refine(
      (name) => !/^\s|\s$/.test(name),
      "Team name cannot start or end with whitespace"
    )
    .optional(),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),

  captain: objectIdSchema.optional(),

  players: z.array(objectIdSchema)
    .min(1, "Team must include the captain on the roster")
    .max(20, "Team cannot have more than 20 players")
    .optional(),

  teamImage: z.instanceof(Blob).optional(),
}).strict()
  .refine(
    (data) => {
      if (!data.players || !data.captain) return true;
      return data.players.includes(data.captain);
    },
    {
      message: "Captain must be one of the team players",
      path: ["captain"],
    }
  )
  .refine(
    (data) => {
      if (!data.players) return true;
      const uniquePlayers = new Set(data.players);
      return uniquePlayers.size === data.players.length;
    },
    {
      message: "Duplicate players are not allowed",
      path: ["players"],
    }
  );

export const joinTeamBodySchema = z.object({
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Join code must be 6 letters or numbers"),
}).strict();

export const toggleTeamJoinCodeSchema = z.object({
  enable: z.boolean(),
}).strict();

// Assign player positions schema
export const assignPlayerPositionsSchema = z.object({
  assignments: z.record(
    objectIdSchema,
    playerPositionSchema
  ).refine(
    (assignments) => {
      // Check that all positions are unique
      const positions = Object.values(assignments);
      const uniquePositions = new Set(positions);
      return uniquePositions.size === positions.length;
    },
    {
      message: "Each position can only be assigned to one player",
    }
  ),
}).strict();

// Search teams query schema
export const searchTeamsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  sortBy: z.enum(["name", "wins", "players", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 15),
  skip: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 0),
}).strict();

// Export type inference
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AssignPlayerPositionsInput = z.infer<typeof assignPlayerPositionsSchema>;
export type SearchTeamsQuery = z.infer<typeof searchTeamsQuerySchema>;
export type JoinTeamBody = z.infer<typeof joinTeamBodySchema>;
export type ToggleTeamJoinCodeBody = z.infer<typeof toggleTeamJoinCodeSchema>;
