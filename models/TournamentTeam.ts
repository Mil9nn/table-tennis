// models/TournamentTeam.ts
import mongoose, { Schema, Document } from "mongoose";
import {
  baseTournamentFields,
  baseTournamentIndexes,
  standingSchema,
  roundSchema,
  groupSchema
} from "./TournamentBase";
import type { KnockoutStatistics } from "@/types/knockoutStatistics.type";

/**
 * Team Tournament Model
 *
 * For tournaments where participants are teams (not individual users)
 * Supports: team match formats (five_singles, single_double_single, custom)
 *
 * Benefits of separate model:
 * - Proper type refs (Team instead of mixed User/Team)
 * - Built-in Mongoose population
 * - Clearer validation rules
 * - Type safety
 */

export interface ISeeding {
  participant: mongoose.Types.ObjectId; // Team
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

export interface IStanding {
  participant: mongoose.Types.ObjectId; // Team
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  points: number;
  rank: number;
  form: string[];
  headToHead?: Map<string, number>;
}

export interface IGroup {
  groupId: string;
  groupName: string;
  participants: mongoose.Types.ObjectId[]; // Teams
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;
  standings: IStanding[];
}

export interface ITeamConfig {
  matchFormat: "five_singles" | "single_double_single" | "custom";
  setsPerSubMatch: number;
  customSubMatches?: Array<{
    matchNumber: number;
    matchType: "singles" | "doubles";
  }>;
}

export interface ITournamentTeam extends Document {
  // Category (fixed as 'team')
  category: 'team';

  // Participants (Teams)
  participants: mongoose.Types.ObjectId[];

  // Team-specific configuration
  teamConfig: ITeamConfig;

  // Seeding (Teams)
  seeding: ISeeding[];

  // Groups (with Team participants)
  groups?: IGroup[];

  // Qualified participants for hybrid (Teams)
  qualifiedParticipants?: mongoose.Types.ObjectId[];

  // Round Robin specific
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;

  // Standings (Teams)
  standings: IStanding[];

  // Virtual property (populated from BracketState)
  bracket?: any;

  // Knockout statistics (generated after tournament completion)
  knockoutStatistics?: KnockoutStatistics;

  // All base fields from TournamentBase
  name: string;
  format: "round_robin" | "knockout" | "hybrid";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";
  organizer: mongoose.Types.ObjectId;
  seedingMethod: "manual" | "ranking" | "random" | "none";
  useGroups: boolean;
  numberOfGroups?: number;
  advancePerGroup?: number;
  knockoutConfig?: {
    allowCustomMatching: boolean;
    autoGenerateBracket: boolean;
    thirdPlaceMatch: boolean;
    consolationBracket: boolean;
  };
  hybridConfig?: {
    roundRobinUseGroups: boolean;
    roundRobinNumberOfGroups?: number;
    qualificationMethod: "top_n_overall" | "top_n_per_group" | "percentage";
    qualifyingCount?: number;
    qualifyingPercentage?: number;
    qualifyingPerGroup?: number;
    knockoutAllowCustomMatching: boolean;
    knockoutThirdPlaceMatch: boolean;
  };
  currentPhase?: "round_robin" | "knockout" | "transition";
  phaseTransitionDate?: Date;
  rules: {
    pointsForWin: number;
    pointsForLoss: number;
    setsPerMatch: number;
    pointsPerSet: number;
    advanceTop: number;
    deuceSetting: "standard" | "no_deuce";
    tiebreakRules: string[];
  };
  drawGenerated: boolean;
  drawGeneratedAt?: Date;
  drawGeneratedBy?: mongoose.Types.ObjectId;
  joinCode?: string;
  allowJoinByCode: boolean;
  registrationDeadline?: Date;
  venue: string;
  city: string;
  maxParticipants?: number;
  minParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Customize schemas for Team tournaments
const teamStandingSchema = new Schema({
  ...standingSchema.obj,
  participant: { type: Schema.Types.ObjectId, ref: "Team", required: true }
}, { _id: false });

const teamGroupSchema = new Schema({
  ...groupSchema.obj,
  participants: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  standings: [teamStandingSchema]
}, { _id: false });

const tournamentTeamSchema = new Schema(
  {
    // Fixed category
    category: {
      type: String,
      enum: ['team'],
      default: 'team',
      required: true
    },

    // Participants (Teams only)
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true
    }],

    // Team-specific configuration
    teamConfig: {
      type: {
        matchFormat: {
          type: String,
          enum: ["five_singles", "single_double_single", "custom"],
          default: "five_singles",
          required: true
        },
        setsPerSubMatch: { type: Number, default: 3, required: true },
        customSubMatches: [{
          matchNumber: { type: Number },
          matchType: { type: String, enum: ["singles", "doubles"] },
        }],
      },
      required: true
    },

    // Seeding (Teams only)
    seeding: [{
      participant: { type: Schema.Types.ObjectId, ref: "Team" },
      seedNumber: { type: Number, required: true },
      seedingRank: { type: Number },
      seedingPoints: { type: Number },
    }],

    // Groups (with Team participants)
    groups: [teamGroupSchema],

    // Qualified participants for hybrid (Teams)
    qualifiedParticipants: [{ type: Schema.Types.ObjectId, ref: "Team" }],

    // Rounds (round-robin matches)
    rounds: [roundSchema],

    // Standings (Teams)
    standings: [teamStandingSchema],

    // All base fields
    ...baseTournamentFields,
  },
  {
    timestamps: true,
    collection: 'tournaments', // Share collection with individual tournaments
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true } // Include virtuals when converting to object
  }
);

// Indexes
baseTournamentIndexes.forEach(index => {
  tournamentTeamSchema.index(index as any);
});

// Additional team-specific indexes
tournamentTeamSchema.index({ category: 1 });
tournamentTeamSchema.index({ participants: 1 });
tournamentTeamSchema.index({ 'teamConfig.matchFormat': 1 });

// Validation: Ensure teamConfig is properly set
tournamentTeamSchema.pre('save', function(next) {
  if (!(this as any).teamConfig || !(this as any).teamConfig.matchFormat) {
    return next(new Error('Team tournaments must have teamConfig with matchFormat'));
  }

  // Validate custom subMatches if format is custom
  if ((this as any).teamConfig.matchFormat === 'custom') {
    if (!(this as any).teamConfig.customSubMatches || (this as any).teamConfig.customSubMatches.length === 0) {
      return next(new Error('Custom team format requires customSubMatches configuration'));
    }
  }

  next();
});

// Virtual to populate bracket from BracketState collection
tournamentTeamSchema.virtual('bracket', {
  ref: 'BracketState',
  localField: '_id',
  foreignField: 'tournament',
  justOne: true
});

// Cascade delete hook - Delete all related data when tournament is deleted
tournamentTeamSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Import Match models (lazy to avoid circular dependencies)
    const Match = (await import('./MatchBase')).default;
    const BracketState = (await import('./BracketState')).default;

    // Delete all matches for this tournament
    await Match.deleteMany({ tournament: this._id }, { session });

    // Delete bracket state if exists
    await BracketState.deleteOne({ tournament: this._id }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// Cascade delete for findOneAndDelete
tournamentTeamSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const Match = (await import('./MatchBase')).default;
      const BracketState = (await import('./BracketState')).default;

      await Match.deleteMany({ tournament: doc._id }, { session });
      await BracketState.deleteOne({ tournament: doc._id }, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
});

// Prevent OverwriteModelError in Next.js development hot reload
const TournamentTeam =
  (mongoose.models.TournamentTeam as mongoose.Model<ITournamentTeam>) ||
  mongoose.model<ITournamentTeam>('TournamentTeam', tournamentTeamSchema);

export default TournamentTeam;
