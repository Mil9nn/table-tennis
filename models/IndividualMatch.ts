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

export interface IMatchTeam {
  players: mongoose.Types.ObjectId[];
}

export interface IIndividualMatch extends IMatchBase {
  matchCategory: 'individual';
  matchType: 'singles' | 'doubles';
  numberOfSets: number;
  teams?: IMatchTeam[];
  participants: mongoose.Types.ObjectId[];
  currentGame: number;
  currentServerPlayerId?: mongoose.Types.ObjectId | null;
  /** @deprecated transitional compatibility */
  currentServer?: string | null;
  games: any[];
  finalScore: {
    setsByTeam?: number[];
    setsById?: Map<string, number>;
    /** @deprecated transitional compatibility */
    side1Sets?: number;
    /** @deprecated transitional compatibility */
    side2Sets?: number;
  };
  winnerTeamIndex?: number | null;
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
const matchTeamSchema = new mongoose.Schema(
  {
    players: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
  },
  { _id: false }
);

const IndividualMatchSchema = new mongoose.Schema(
  {
    matchType: {
      type: String,
      enum: ["singles", "doubles"],
      required: true,
    },

    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    teams: { type: [matchTeamSchema], default: undefined },

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
      setsByTeam: { type: [Number], default: undefined },
      setsById: { type: Map, of: Number, default: {} },
    },

    winnerTeamIndex: { type: Number, enum: [0, 1], default: null },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    serverConfig: {
      type: serverConfigSchema,
      default: null,
    },

    statistics: {
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

// Derive deprecated flat fields from the new team-indexed fields
IndividualMatchSchema.pre("save", function (next) {
  // --- Derive participants[] from teams[] ---
  if (this.teams && this.teams.length === 2) {
    const flat = [
      ...this.teams[0].players,
      ...this.teams[1].players,
    ];
    this.participants = flat;
  }

  // --- Derive winnerId from winnerTeamIndex + teams ---
  if (
    this.winnerTeamIndex != null &&
    this.teams &&
    this.teams[this.winnerTeamIndex]
  ) {
    this.winnerId = this.teams[this.winnerTeamIndex].players[0] ?? null;
  }

  // --- Derive finalScore.setsById from setsByTeam + teams ---
  if (
    this.finalScore?.setsByTeam &&
    this.teams &&
    this.teams.length === 2
  ) {
    const setsById = new Map<string, number>();
    const t0Main = this.teams[0].players[0]?.toString();
    const t1Main = this.teams[1].players[0]?.toString();
    if (t0Main) setsById.set(t0Main, this.finalScore.setsByTeam[0] ?? 0);
    if (t1Main) setsById.set(t1Main, this.finalScore.setsByTeam[1] ?? 0);
    this.finalScore.setsById = setsById;
  }

  // --- Derive game-level scoresById from scoresByTeam + teams ---
  if (this.teams && this.teams.length === 2 && this.games) {
    const t0Main = this.teams[0].players[0]?.toString();
    const t1Main = this.teams[1].players[0]?.toString();
    for (const game of this.games) {
      if (game.scoresByTeam && t0Main && t1Main) {
        const scoresById = new Map<string, number>();
        scoresById.set(t0Main, game.scoresByTeam[0] ?? 0);
        scoresById.set(t1Main, game.scoresByTeam[1] ?? 0);
        game.scoresById = scoresById;
      }
      if (game.winnerTeamIndex != null && this.teams[game.winnerTeamIndex]) {
        game.winnerId = this.teams[game.winnerTeamIndex].players[0] ?? null;
      }
    }
  }

  // --- Validate participant counts ---
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

// Reuse global registry first (Turbopack can load Match in multiple chunks)
let IndividualMatch: mongoose.Model<IIndividualMatch>;
if (mongoose.models.individual) {
  IndividualMatch = mongoose.models.individual as mongoose.Model<IIndividualMatch>;
} else if (Match.discriminators?.individual) {
  IndividualMatch = Match.discriminators.individual as mongoose.Model<IIndividualMatch>;
} else {
  IndividualMatch = Match.discriminator<IIndividualMatch>(
    "individual",
    IndividualMatchSchema
  );
}

export default IndividualMatch;
