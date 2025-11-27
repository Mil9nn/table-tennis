// schemas/matchSchema.ts
import { z } from "zod";

export const PlayerRef = z.object({
  userId: z.string().min(1, "Username required"),
  displayName: z.string().optional(),
  positionLabel: z.string().optional(),
});

export const TeamSchema = z.object({
  teamName: z.string().min(1, "Team name required"),
  players: z.array(PlayerRef).min(1, "At least one player"),
});

export const CreateMatchSchema = z.object({
  category: z.enum(["individual", "team"]),
  type: z.enum(["singles", "doubles", "mixed-doubles"]).optional(),
  teamFormat: z.enum(["5-singles", "olympic", "3-singles", "custom"]).optional(),
  bestOfGames: z.enum(["1", "3", "5", "7", "9"]),
  city: z.string().optional(),
  venue: z.object({
    placeId: z.string().optional(),
    name: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  scorerUsername: z.string().min(1, "Scorer required"),
  playerOrder: z.array(z.string()).optional(),
  teams: z.array(TeamSchema).optional(),
});
