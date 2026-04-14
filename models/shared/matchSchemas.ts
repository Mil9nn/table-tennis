import mongoose from "mongoose";
import { shotCategories } from "../../constants/constants";

// Extract all shot values from shotCategories
const getAllShotValues = (): string[] => {
  return Object.values(shotCategories)
    .flatMap((category) => category.shots)
    .map((shot) => shot.value);
};

// Base shot schema factory - configurable for different side enums
export function createShotSchema(sideEnum: string[]) {
  return new mongoose.Schema({
    shotNumber: Number,

    side: { type: String, enum: sideEnum, required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    stroke: {
      type: String,
      enum: getAllShotValues(),
      default: null,
    },

    // If stroke is a serve_point, record the serve type
    serveType: {
      type: String,
      enum: ["side_spin", "top_spin", "back_spin", "mix_spin", "no_spin"],
      default: null,
    },

    server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Shot coordinate system:
    // Origin: -100 to 200 (player can hit from anywhere, including off-table up to 2m+)
    // Landing: 0 to 100 (point scored = ball landed on table)
    // Extended coordinate system: -100 to 0 (left/top margin), 0 to 100 (table), 100 to 200 (right/bottom margin)
    // Distance zones: <70cm (26 units), 70cm-2m (26-73 units), >2m (73+ units)
    // 1 unit = 2.74cm (table is 274cm long)
    originX: { type: Number, min: -100, max: 200 },
    originY: { type: Number, min: -100, max: 200 },
    landingX: { type: Number, min: 0, max: 100 },
    landingY: { type: Number, min: 0, max: 100 },

    timestamp: { type: Date, default: Date.now },
  });
}

/**
 * Per-game schema (scores + metadata only).
 * Point-by-point data lives in the `matchpoints` collection, not embedded here.
 */
export function createGameSchema(sideEnum: string[]) {
  return new mongoose.Schema({
    gameNumber: Number,

    side1Score: { type: Number, default: 0 },
    side2Score: { type: Number, default: 0 },

    winnerSide: { type: String, enum: sideEnum, default: null },

    completed: { type: Boolean, default: false },

    duration: Number,
    startTime: Date,
    endTime: Date,
  });
}

/** Team rubber game schema (scores + metadata only; shots in `matchpoints`). */
export function createTeamGameSchema(sideEnum: string[]) {
  return new mongoose.Schema({
    gameNumber: Number,

    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 },

    winnerSide: { type: String, enum: sideEnum, default: null },

    completed: { type: Boolean, default: false },

    duration: Number,
    startTime: Date,
    endTime: Date,
  });
}

// Base server config schema factory - configurable for different side enums
export function createServerConfigSchema(sideEnum: string[], extendedEnums: string[] = []) {
  return new mongoose.Schema({
    firstServer: {
      type: String,
      enum: [...sideEnum, ...extendedEnums],
      default: null,
    },
    firstReceiver: {
      type: String,
      enum: [...sideEnum, ...extendedEnums],
      default: null,
    },
    serverOrder: [
      {
        type: String,
        enum: extendedEnums,
      },
    ],
  });
}

// ID-based game schema (no side/team keys)
export function createIdBasedGameSchema() {
  return new mongoose.Schema({
    gameNumber: { type: Number, required: true },
    scoresById: { type: Map, of: Number, default: {} },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "in_progress",
    },
    duration: Number,
    startTime: Date,
    endTime: Date,
  });
}

// ID-based server configuration (player/team ids only)
export function createIdServerConfigSchema() {
  return new mongoose.Schema({
    firstServerPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    firstReceiverPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    serverOrderPlayerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  });
}

// Player stats schema for detailed shot analysis
// Build schema dynamically from shotCategories (excluding serve_point and net_point)
const buildDetailedShotsSchema = () => {
  const detailedShots: Record<string, { type: typeof mongoose.Schema.Types.Number; default: number }> = {};
  
  Object.values(shotCategories)
    .flatMap((category) => category.shots)
    .filter((shot) => shot.value !== "serve_point" && shot.value !== "net_point")
    .forEach((shot) => {
      detailedShots[shot.value] = { type: Number as any, default: 0 };
    });
  
  return detailedShots;
};

export const playerStatsSchema = new mongoose.Schema({
  detailedShots: buildDetailedShotsSchema(),
});

// Team info schema for team matches
export const teamInfoSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  logo: { type: String },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // players array — matches your Team schema style (user + role + joinedDate)
  players: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["captain", "player"], default: "player" },
      joinedDate: { type: Date, default: Date.now },
    },
  ],

  // assignments map (A,B,C -> playerId ; X,Y,Z -> playerId)
  assignments: {
    type: Map,
    of: String,
    default: {},
  },

  city: String,
  stats: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
  },
});


































