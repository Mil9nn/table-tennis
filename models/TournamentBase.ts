// models/TournamentBase.ts
import { Schema } from "mongoose";

/**
 * Shared sub-schemas used across all tournament types
 */

export const standingSchema = new Schema({
  participant: { type: Schema.Types.ObjectId, required: true }, // No ref - will be set in specific models
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  setsWon: { type: Number, default: 0 },
  setsLost: { type: Number, default: 0 },
  setsDiff: { type: Number, default: 0 },
  pointsScored: { type: Number, default: 0 },
  pointsConceded: { type: Number, default: 0 },
  pointsDiff: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  form: [{ type: String }],
  headToHead: { type: Map, of: Number },
}, { _id: false });

export const roundSchema = new Schema({
  roundNumber: { type: Number, required: true },
  matches: [{ type: Schema.Types.ObjectId, ref: "Match" }], // References base Match model
  completed: { type: Boolean, default: false },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
}, { _id: false });

export const groupSchema = new Schema({
  groupId: { type: String, required: true },
  groupName: { type: String, required: true },
  participants: [{ type: Schema.Types.ObjectId }], // No ref - will be set in specific models
  rounds: [roundSchema],
  standings: [standingSchema],
}, { _id: false });

/**
 * Base tournament schema fields shared by all tournament types
 * This will be extended by TournamentIndividual and TournamentTeam
 */
export const baseTournamentFields = {
  // Basic information
  name: { type: String, required: true },
  format: {
    type: String,
    enum: ["round_robin", "knockout", "hybrid"],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["draft", "upcoming", "in_progress", "completed", "cancelled"],
    default: "draft",
  },

  // Organizer (always a User)
  organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // Seeding system - participant ref will be set in specific models
  seedingMethod: {
    type: String,
    enum: ["manual", "ranking", "random", "none"],
    default: "none",
  },

  // Groups/Pools (for larger tournaments)
  useGroups: { type: Boolean, default: false },
  numberOfGroups: { type: Number },
  advancePerGroup: { type: Number },

  // Knockout specific
  knockoutConfig: {
    allowCustomMatching: { type: Boolean, default: true },
    autoGenerateBracket: { type: Boolean, default: true },
    thirdPlaceMatch: { type: Boolean, default: false },
    consolationBracket: { type: Boolean, default: false },
  },
  // Note: bracket field removed - now stored in separate BracketState collection

  // Hybrid format specific (round-robin -> knockout)
  hybridConfig: {
    type: {
      // Round-robin phase settings
      roundRobinUseGroups: { type: Boolean, default: false },
      roundRobinNumberOfGroups: { type: Number },

      // Qualification settings
      qualificationMethod: {
        type: String,
        enum: ["top_n_overall", "top_n_per_group", "percentage"],
        default: "top_n_overall",
      },
      qualifyingCount: { type: Number },
      qualifyingPercentage: { type: Number },
      qualifyingPerGroup: { type: Number },

      // Knockout phase settings
      knockoutAllowCustomMatching: { type: Boolean, default: false },
      knockoutThirdPlaceMatch: { type: Boolean, default: false },
    },
    required: false,
  },

  // Phase tracking for hybrid tournaments
  currentPhase: {
    type: String,
    enum: ["round_robin", "knockout", "transition"],
  },
  phaseTransitionDate: { type: Date },

  // Tournament rules (ITTF-compliant defaults)
  rules: {
    pointsForWin: { type: Number, default: 1 },
    pointsForLoss: { type: Number, default: 0 },
    setsPerMatch: { type: Number, default: 3 },
    pointsPerSet: { type: Number, default: 11 },
    advanceTop: { type: Number, default: 0 },
    deuceSetting: {
      type: String,
      enum: ["standard", "no_deuce"],
      default: "standard",
    },
    tiebreakRules: {
      type: [String],
      default: [
        "points",
        "head_to_head",
        "sets_ratio",
        "points_ratio",
        "sets_won",
      ],
    },
  },

  // Draw management
  drawGenerated: { type: Boolean, default: false },
  drawGeneratedAt: { type: Date },
  drawGeneratedBy: { type: Schema.Types.ObjectId, ref: "User" },

  // Participant registration
  joinCode: { type: String, unique: true, sparse: true },
  allowJoinByCode: { type: Boolean, default: false },
  registrationDeadline: { type: Date },

  // Venue information
  venue: { type: String, required: true },
  city: { type: String, required: true },
  maxParticipants: { type: Number },
  minParticipants: { type: Number, default: 2 },

  // Knockout tournament statistics (cached on completion)
  knockoutStatistics: { type: Schema.Types.Mixed, default: undefined },
};

/**
 * Common indexes for all tournament types
 */
export const baseTournamentIndexes = [
  { status: 1 },
  { format: 1 },
  { startDate: -1 },
  { city: 1 },
  { organizer: 1 },
  { drawGenerated: 1 },
];
