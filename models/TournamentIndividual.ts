// models/TournamentIndividual.ts
import mongoose, { Schema, Document } from "mongoose";
import {
  baseTournamentFields,
  baseTournamentIndexes,
  standingSchema,
  roundSchema,
  groupSchema
} from "./TournamentBase";

/**
 * Individual Tournament Model
 *
 * For tournaments where participants are individual users (not teams)
 * Supports: singles, doubles, mixed_doubles match types
 *
 * Benefits of separate model:
 * - Proper type refs (User instead of mixed User/Team)
 * - Built-in Mongoose population
 * - Clearer validation rules
 * - Type safety
 */

export interface ISeeding {
  participant: mongoose.Types.ObjectId; // User
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

export interface IStanding {
  participant: mongoose.Types.ObjectId; // User
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
  participants: mongoose.Types.ObjectId[]; // Users
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;
  standings: IStanding[];
}

// Doubles pair for knockout tournaments
export interface IDoublesPair {
  _id: mongoose.Types.ObjectId;
  player1: mongoose.Types.ObjectId; // User
  player2: mongoose.Types.ObjectId; // User
}

export interface ITournamentIndividual extends Document {
  // Category (fixed as 'individual')
  category: 'individual';

  // Individual-specific fields
  matchType: 'singles' | 'doubles' | 'mixed_doubles';

  // Participants (Users)
  participants: mongoose.Types.ObjectId[];

  // Doubles pairs (for doubles/mixed_doubles knockout with custom matching)
  doublesPairs?: IDoublesPair[];

  // Seeding (Users)
  seeding: ISeeding[];

  // Groups (with User participants)
  groups?: IGroup[];

  // Qualified participants for hybrid (Users)
  qualifiedParticipants?: mongoose.Types.ObjectId[];

  // Round Robin specific
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;

  // Standings (Users)
  standings: IStanding[];

  // Virtual property (populated from BracketState)
  bracket?: any;

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

// Customize schemas for Individual tournaments
const individualStandingSchema = new Schema({
  ...standingSchema.obj,
  participant: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { _id: false });

const individualGroupSchema = new Schema({
  ...groupSchema.obj,
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  standings: [individualStandingSchema]
}, { _id: false });

const tournamentIndividualSchema = new Schema(
  {
    // Fixed category
    category: {
      type: String,
      enum: ['individual'],
      default: 'individual',
      required: true
    },

    // Individual-specific: match type
    matchType: {
      type: String,
      enum: ["singles", "doubles", "mixed_doubles"],
      required: true,
    },

    // Participants (Users only)
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],

    // Doubles pairs (for doubles/mixed_doubles knockout with custom matching)
    doublesPairs: [{
      _id: { type: Schema.Types.ObjectId, auto: true },
      player1: { type: Schema.Types.ObjectId, ref: "User", required: true },
      player2: { type: Schema.Types.ObjectId, ref: "User", required: true },
    }],

    // Seeding (Users only)
    seeding: [{
      participant: { type: Schema.Types.ObjectId, ref: "User" },
      seedNumber: { type: Number, required: true },
      seedingRank: { type: Number },
      seedingPoints: { type: Number },
    }],

    // Groups (with User participants)
    groups: [individualGroupSchema],

    // Qualified participants for hybrid (Users)
    qualifiedParticipants: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Rounds (round-robin matches)
    rounds: [roundSchema],

    // Standings (Users)
    standings: [individualStandingSchema],

    // All base fields
    ...baseTournamentFields,
  },
  {
    timestamps: true,
    collection: 'tournaments', // Share collection with team tournaments
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true } // Include virtuals when converting to object
  }
);

// Indexes
baseTournamentIndexes.forEach(index => {
  tournamentIndividualSchema.index(index as any);
});

// Additional individual-specific indexes
tournamentIndividualSchema.index({ category: 1 });
tournamentIndividualSchema.index({ matchType: 1 });
tournamentIndividualSchema.index({ participants: 1 });

// Validation: Doubles requires even number of participants
tournamentIndividualSchema.pre('save', function(next) {
  if ((this as any).matchType === 'doubles' || (this as any).matchType === 'mixed_doubles') {
    if ((this as any).participants.length % 2 !== 0) {
      return next(new Error('Doubles tournaments require an even number of participants'));
    }
  }
  next();
});

// Virtual to populate bracket from BracketState collection
tournamentIndividualSchema.virtual('bracket', {
  ref: 'BracketState',
  localField: '_id',
  foreignField: 'tournament',
  justOne: true
});

// Cascade delete hook - Delete all related data when tournament is deleted
tournamentIndividualSchema.pre('deleteOne', { document: true, query: false }, async function() {
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
tournamentIndividualSchema.pre('findOneAndDelete', async function() {
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
const TournamentIndividual =
  (mongoose.models.TournamentIndividual as mongoose.Model<ITournamentIndividual>) ||
  mongoose.model<ITournamentIndividual>('TournamentIndividual', tournamentIndividualSchema);

export default TournamentIndividual;
