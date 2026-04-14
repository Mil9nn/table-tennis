import mongoose from "mongoose";
import Match, { IMatchBase } from "./MatchBase";
import {
  createIdBasedGameSchema,
  createIdServerConfigSchema,
  playerStatsSchema,
} from "./shared/matchSchemas";

/**
 * Individual Match Model
 *
 * Extends the base Match model with individual-specific fields
 * Supports: singles, doubles
 *
 * Uses MongoDB discriminators for proper type separation
 */

export interface IIndividualMatch extends IMatchBase {
  matchCategory: 'individual';
  matchType: 'singles' | 'doubles';
  numberOfSets: number;
  participants: mongoose.Types.ObjectId[];
  currentGame: number;
  currentServerPlayerId?: mongoose.Types.ObjectId | null;
  /** @deprecated transitional compatibility */
  currentServer?: string | null;
  games: any[];
  finalScore: {
    setsById?: Map<string, number>;
    /** @deprecated transitional compatibility */
    side1Sets?: number;
    /** @deprecated transitional compatibility */
    side2Sets?: number;
  };
  winnerId?: mongoose.Types.ObjectId | null;
  /** @deprecated transitional compatibility */
  winnerSide?: "side1" | "side2" | null;
  serverConfig: any;
  statistics?: {
    playerStats: Map<string, any>;
  };
}

const individualGameSchema = createIdBasedGameSchema();
const serverConfigSchema = createIdServerConfigSchema();

// Individual Match Schema - extends base Match
const IndividualMatchSchema = new mongoose.Schema(
  {
    // Individual-specific fields only (base fields inherited from Match)

    matchType: {
      type: String,
      enum: ["singles", "doubles"],
      required: true,
    },

    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    currentGame: { type: Number, default: 1 },

    currentServerPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    games: [individualGameSchema],

    finalScore: {
      setsById: { type: Map, of: Number, default: {} },
    },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

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
IndividualMatchSchema.pre("save", function (next) {
  if (this.matchType === "doubles") {
    if (this.participants.length !== 4) {
      return next(new Error("Doubles matches require exactly 4 participants"));
    }
  } else {
    if (this.participants.length !== 2) {
      return next(new Error("Singles matches require exactly 2 participants"));
    }
  }
  next();
});

// Indexes for efficient leaderboard queries
// Core query filter: status + matchType + createdAt
IndividualMatchSchema.index({ status: 1, matchType: 1, createdAt: -1 });
// Tournament-specific queries
IndividualMatchSchema.index({ tournament: 1, status: 1, matchType: 1 });
// Player lookup
IndividualMatchSchema.index({ participants: 1, status: 1 });
// Compound index for main leaderboard queries (matchCategory is from base schema)
IndividualMatchSchema.index({ matchCategory: 1, status: 1, matchType: 1, createdAt: -1 });

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
