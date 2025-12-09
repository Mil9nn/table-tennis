import mongoose, { Document } from "mongoose";
import Match from "./MatchBase";
import {
  createShotSchema,
  createTeamGameSchema,
  createServerConfigSchema,
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

export interface ITeamMatch extends Document {
  matchCategory: 'team';
  matchFormat: 'five_singles' | 'single_double_single' | 'custom';
  numberOfSetsPerSubMatch: number;
  numberOfSubMatches: number;
  currentSubMatch: number;
  team1: any; // teamInfoSchema
  team2: any; // teamInfoSchema
  subMatches: any[];
  finalScore: {
    team1Matches: number;
    team2Matches: number;
  };
  winnerTeam: 'team1' | 'team2' | null;
  serverConfig: any;
  statistics?: {
    longestStreak: number;
    clutchPointsWon: number;
    playerStats: Map<string, any>;
  };
  scheduledDate?: Date;
}

// Create schemas with team match enums (team1/team2)
const shotSchema = createShotSchema(["team1", "team2"]);
const gameSchema = createTeamGameSchema(shotSchema, ["team1", "team2"]);
const serverConfigSchema = createServerConfigSchema(
  ["team1", "team2"],
  ["team1_main", "team1_partner", "team2_main", "team2_partner"]
);

const subMatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true },
  matchType: { type: String, enum: ["singles", "doubles"], default: "singles" },

  // Change to arrays to support doubles
  playerTeam1: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  playerTeam2: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  numberOfSets: { type: Number, enum: [1, 3, 5, 7], default: 3 },

  serverConfig: {
    type: serverConfigSchema,
    default: null,
  },

  currentServer: {
    type: String,
    enum: [
      "team1",
      "team2",
      "team1_main",
      "team1_partner",
      "team2_main",
      "team2_partner",
    ],
    default: null,
  },

  games: [gameSchema],

  finalScore: {
    team1Sets: { type: Number, default: 0 },
    team2Sets: { type: Number, default: 0 },
  },

  winnerSide: { type: String, enum: ["team1", "team2"], default: null },

  status: {
    type: String,
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
    default: "scheduled",
  },

  completed: { type: Boolean, default: false },

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

    // per-submatch number of sets (best of 5 typical for ITTF team)
    numberOfSetsPerSubMatch: { type: Number, enum: [1, 3, 5, 7], default: 3 },

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
      team1Matches: { type: Number, default: 0 },
      team2Matches: { type: Number, default: 0 },
    },

    winnerTeam: { type: String, enum: ["team1", "team2"], default: null },

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
