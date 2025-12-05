import mongoose from "mongoose";
import {
  createShotSchema,
  createGameSchema,
  createServerConfigSchema,
  playerStatsSchema,
} from "./shared/matchSchemas";

// Create schemas with individual match enums (side1/side2)
const shotSchema = createShotSchema(["side1", "side2"]);
const gameSchema = createGameSchema(shotSchema, ["side1", "side2"]);
const serverConfigSchema = createServerConfigSchema(
  ["side1", "side2"],
  ["side1_main", "side1_partner", "side2_main", "side2_partner"]
);

// Match Schema
const IndividualMatchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      default: null
    },

    matchCategory: {
      type: String,
      enum: ["individual"],
      required: true,
      default: "individual",
    },

    matchType: {
      type: String,
      enum: ["singles", "doubles", "mixed_doubles"],
      required: true,
    },

    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: String,
    venue: String,

    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    currentGame: { type: Number, default: 1 },

    currentServer: {
      type: String,
      enum: [
        "side1",
        "side2",
        "side1_main",
        "side1_partner",
        "side2_main",
        "side2_partner",
      ],
      default: null,
    },

    games: [gameSchema],

    finalScore: {
      side1Sets: { type: Number, default: 0 },
      side2Sets: { type: Number, default: 0 },
    },
    winnerSide: { type: String, enum: ["side1", "side2"], default: null },

    serverConfig: {
      type: serverConfigSchema,
      default: null,
    },

    matchDuration: Number,

    // Tournament context
    groupId: { type: String, default: null }, // For round-robin group matches

    // Knockout/Bracket metadata
    bracketPosition: {
      round: { type: Number }, // Round number in bracket
      matchNumber: { type: Number }, // Match number within round
      nextMatchNumber: { type: Number }, // Which match in next round winner advances to
    },
    roundName: { type: String }, // "Quarter-Finals", "Semi-Finals", "Final", etc.
    courtNumber: { type: Number }, // Court assignment
    isThirdPlaceMatch: { type: Boolean, default: false }, // Is this a 3rd place match

    // Enhanced Match Statistics
    statistics: {
      // Per-player stats (works for singles/doubles)
      playerStats: {
        type: Map,
        of: playerStatsSchema,
      },
    },
  },
  { timestamps: true }
);

IndividualMatchSchema.virtual("playerStatsWithRatio").get(function () {
  if (!this.statistics?.playerStats) return {};

  const result: Record<string, any> = {};
  this.statistics.playerStats.forEach((stats: any, playerId: string) => {

    result[playerId] = {
      ...stats.toObject()
    };
  });

  return result;
});

export default mongoose.models.IndividualMatch ||
  mongoose.model("IndividualMatch", IndividualMatchSchema);
