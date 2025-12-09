import mongoose, { Document } from "mongoose";
import Match from "./MatchBase";
import {
  createShotSchema,
  createGameSchema,
  createServerConfigSchema,
  playerStatsSchema,
} from "./shared/matchSchemas";

/**
 * Individual Match Model
 *
 * Extends the base Match model with individual-specific fields
 * Supports: singles, doubles, mixed_doubles
 *
 * Uses MongoDB discriminators for proper type separation
 */

export interface IIndividualMatch extends Document {
  matchCategory: 'individual';
  matchType: 'singles' | 'doubles' | 'mixed_doubles';
  numberOfSets: number;
  participants: mongoose.Types.ObjectId[];
  currentGame: number;
  currentServer: string | null;
  games: any[];
  finalScore: {
    side1Sets: number;
    side2Sets: number;
  };
  winnerSide: 'side1' | 'side2' | null;
  serverConfig: any;
  statistics?: {
    playerStats: Map<string, any>;
  };
}

// Create schemas with individual match enums (side1/side2)
const shotSchema = createShotSchema(["side1", "side2"]);
const gameSchema = createGameSchema(shotSchema, ["side1", "side2"]);
const serverConfigSchema = createServerConfigSchema(
  ["side1", "side2"],
  ["side1_main", "side1_partner", "side2_main", "side2_partner"]
);

// Individual Match Schema - extends base Match
const IndividualMatchSchema = new mongoose.Schema(
  {
    // Individual-specific fields only (base fields inherited from Match)

    matchType: {
      type: String,
      enum: ["singles", "doubles", "mixed_doubles"],
      required: true,
    },

    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

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

    // Enhanced Match Statistics
    statistics: {
      // Per-player stats (works for singles/doubles)
      playerStats: {
        type: Map,
        of: playerStatsSchema,
      },
    },
  }
);

// Virtuals
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

// Validation: Doubles requires even number of participants (2 or 4)
IndividualMatchSchema.pre('save', function(next) {
  if (this.matchType === 'doubles' || this.matchType === 'mixed_doubles') {
    if (this.participants.length !== 4) {
      return next(new Error('Doubles matches require exactly 4 participants'));
    }
  } else {
    if (this.participants.length !== 2) {
      return next(new Error('Singles matches require exactly 2 participants'));
    }
  }
  next();
});

// Create discriminator model (prevent overwrite during hot reload)
let IndividualMatch: mongoose.Model<IIndividualMatch>;
if (Match.discriminators && Match.discriminators['individual']) {
  IndividualMatch = Match.discriminators['individual'] as mongoose.Model<IIndividualMatch>;
} else {
  IndividualMatch = Match.discriminator<IIndividualMatch>(
    'individual',
    IndividualMatchSchema
  );
}

export default IndividualMatch;
