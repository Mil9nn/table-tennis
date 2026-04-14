import mongoose, { Document } from "mongoose";
import Match, { IMatchBase } from "./MatchBase";
import {
  createIdBasedGameSchema,
  createIdServerConfigSchema,
  playerStatsSchema,
  teamInfoSchema,
} from "./shared/matchSchemas";

/**
 * Team Match Model
 *
 * Extends the base Match model with team-specific fields
 * Supports: five_singles, single_double_single, custom formats
 *
 * Uses MongoDB discriminators for proper type separation
 */

export interface ITeamMatch extends IMatchBase {
  matchCategory: 'team';
  matchFormat: 'five_singles' | 'single_double_single' | 'custom';
  numberOfGamesPerRubber: number;
  numberOfSubMatches: number;
  currentSubMatch: number;
  team1: any; // teamInfoSchema
  team2: any; // teamInfoSchema
  subMatches: mongoose.Types.DocumentArray<any>;
  finalScore: {
    matchesByTeamId: Map<string, number>;
    /** @deprecated transitional compatibility */
    team1Matches?: number;
    /** @deprecated transitional compatibility */
    team2Matches?: number;
  };
  winnerTeamId: mongoose.Types.ObjectId | null;
  /** @deprecated transitional compatibility */
  winnerTeam?: 'team1' | 'team2' | null;
  serverConfig: any;
  statistics?: {
    longestStreak: number;
    clutchPointsWon: number;
    playerStats: Map<string, any>;
  };
  scheduledDate?: Date;
}

const gameSchema = createIdBasedGameSchema();
const serverConfigSchema = createIdServerConfigSchema();

const subMatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true },
  matchType: { type: String, enum: ["singles", "doubles"], default: "singles" },

  // Change to arrays to support doubles
  playerTeam1: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  playerTeam2: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  numberOfGames: { type: Number, enum: [1, 3, 5, 7], default: 3 },

  serverConfig: {
    type: serverConfigSchema,
    default: null,
  },

  currentServerPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  games: [gameSchema],

  finalScore: {
    scoresByTeamId: { type: Map, of: Number, default: {} },
  },

  winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },

  status: {
    type: String,
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
    default: "scheduled",
  },

  startedAt: Date,
  completedAt: Date,
});

/* -------------------- TEAM / TEAMMATCH SCHEMA -------------------- */
// Team Match Schema - extends base Match (base fields inherited automatically)
const TeamMatchSchema = new mongoose.Schema(
  {
    // Team-specific fields only (base fields inherited from Match)

    matchFormat: {
      type: String,
      enum: [
        "five_singles",
        "single_double_single",
        "custom",
      ],
      required: true,
    },

    // per-rubber number of games (best of 5 typical for ITTF team)
    numberOfGamesPerRubber: { type: Number, enum: [1, 3, 5, 7], default: 3 },

    // number of submatches (usually 5 for Swaythling)
    numberOfSubMatches: { type: Number, default: 5 },
    currentSubMatch: { type: Number, default: 1 },

    // team descriptors
    team1: { type: teamInfoSchema, required: true },
    team2: { type: teamInfoSchema, required: true },

    // embedded submatches
    subMatches: { type: [subMatchSchema], default: [] },

    // final team-level score (matches won)
    finalScore: {
      matchesByTeamId: { type: Map, of: Number, default: {} },
    },

    winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },

    // match-level server config
    serverConfig: {
      type: serverConfigSchema,
      default: null,
    },

    scheduledDate: { type: Date }, // Scheduled date/time for the match

    // -------------------- STATISTICS --------------------
    statistics: {
      longestStreak: { type: Number, default: 0 },
      clutchPointsWon: { type: Number, default: 0 },

      // Per-player stats map (playerId -> stats object)
      playerStats: {
        type: Map,
        of: playerStatsSchema,
      },
    },
  }
);

/* -------------------- VIRTUALS -------------------- */

// playerStatsWithRatio virtual for convenience (mirrors IndividualMatch)
TeamMatchSchema.virtual("playerStatsWithRatio").get(function () {
  if (!this.statistics?.playerStats) return {};

  const result: Record<string, any> = {};
  // Map stored as native Map in mongoose doc; iterate safely
  try {
    this.statistics.playerStats.forEach((stats: any, playerId: string) => {
      // stats may be a Mongoose subdocument; convert to plain object if possible
      const statsObj = stats.toObject ? stats.toObject() : { ...stats };
      result[playerId] = {
        ...statsObj,
      };
    });
  } catch (e) {
    // fallback: iterate keys
    for (const [k, stats] of Object.entries(
      this.statistics.playerStats || {}
    )) {
      result[k] = {
        ...(stats as any),
      };
    }
  }
  return result;
});

// Validation: Ensure teams are properly configured
TeamMatchSchema.pre('save', function(next) {
  if (!this.team1 || !this.team2) {
    return next(new Error('Team matches must have both team1 and team2'));
  }

  if (this.matchFormat === 'custom' && (!this.subMatches || this.subMatches.length === 0)) {
    return next(new Error('Custom format requires subMatches configuration'));
  }

  next();
});

// Create discriminator model (prevent overwrite during hot reload)
let TeamMatch: mongoose.Model<ITeamMatch>;
if (Match.discriminators && Match.discriminators['team']) {
  TeamMatch = Match.discriminators['team'] as mongoose.Model<ITeamMatch>;
} else {
  TeamMatch = Match.discriminator<ITeamMatch>(
    'team',
    TeamMatchSchema
  );
}

export default TeamMatch;
