import mongoose from "mongoose";

// Base shot schema factory - configurable for different side enums
export function createShotSchema(sideEnum: string[]) {
  return new mongoose.Schema({
    shotNumber: Number,

    side: { type: String, enum: sideEnum, required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    stroke: {
      type: String,
      enum: [
        "forehand_drive",
        "backhand_drive",
        "forehand_topspin",
        "backhand_topspin",
        "forehand_loop",
        "backhand_loop",
        "forehand_smash",
        "backhand_smash",
        "forehand_push",
        "backhand_push",
        "forehand_chop",
        "backhand_chop",
        "forehand_flick",
        "backhand_flick",
        "forehand_block",
        "backhand_block",
        "forehand_drop",
        "backhand_drop",
        "net_point",
        "serve_point",
      ],
      default: null,
    },

    server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Shot coordinate system:
    // Origin: -50 to 150 (player can hit from anywhere, including off-table)
    // Landing: 0 to 100 (point scored = ball landed on table)
    // Extended coordinate system: -50 to 0 (left/top margin), 0 to 100 (table), 100 to 150 (right/bottom margin)
    originX: { type: Number, min: -50, max: 150 },
    originY: { type: Number, min: -50, max: 150 },
    landingX: { type: Number, min: 0, max: 100 },
    landingY: { type: Number, min: 0, max: 100 },

    timestamp: { type: Date, default: Date.now },
  });
}

// Base game schema factory - configurable for different side enums
export function createGameSchema(shotSchema: mongoose.Schema, sideEnum: string[]) {
  return new mongoose.Schema({
    gameNumber: Number,

    side1Score: { type: Number, default: 0 },
    side2Score: { type: Number, default: 0 },

    winnerSide: { type: String, enum: sideEnum, default: null },

    completed: { type: Boolean, default: false },

    shots: [shotSchema],

    duration: Number,
    startTime: Date,
    endTime: Date,
  });
}

// Alternative team-based game schema factory for team matches
export function createTeamGameSchema(shotSchema: mongoose.Schema, sideEnum: string[]) {
  return new mongoose.Schema({
    gameNumber: Number,

    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 },

    winnerSide: { type: String, enum: sideEnum, default: null },

    completed: { type: Boolean, default: false },

    shots: [shotSchema],

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

// Player stats schema for detailed shot analysis
export const playerStatsSchema = new mongoose.Schema({
  detailedShots: {
    forehand_drive: { type: Number, default: 0 },
    backhand_drive: { type: Number, default: 0 },
    forehand_topspin: { type: Number, default: 0 },
    backhand_topspin: { type: Number, default: 0 },
    forehand_loop: { type: Number, default: 0 },
    backhand_loop: { type: Number, default: 0 },
    forehand_smash: { type: Number, default: 0 },
    backhand_smash: { type: Number, default: 0 },
    forehand_push: { type: Number, default: 0 },
    backhand_push: { type: Number, default: 0 },
    forehand_chop: { type: Number, default: 0 },
    backhand_chop: { type: Number, default: 0 },
    forehand_flick: { type: Number, default: 0 },
    backhand_flick: { type: Number, default: 0 },
    forehand_block: { type: Number, default: 0 },
    backhand_block: { type: Number, default: 0 },
    forehand_drop: { type: Number, default: 0 },
    backhand_drop: { type: Number, default: 0 },
  },
});

// Team info schema for team matches
export const teamInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
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











