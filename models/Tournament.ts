// models/Tournament.ts
import mongoose, { Schema, Document } from "mongoose";

// Reusable sub-schemas to avoid duplication
const standingSchema = new Schema({
  participant: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

const roundSchema = new Schema({
  roundNumber: { type: Number, required: true },
  matches: [{ type: Schema.Types.ObjectId, ref: "IndividualMatch" }],
  completed: { type: Boolean, default: false },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
}, { _id: false });

const groupSchema = new Schema({
  groupId: { type: String, required: true },
  groupName: { type: String, required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  rounds: [roundSchema],
  standings: [standingSchema],
}, { _id: false });


// Interfaces (needed for TypeScript typing in other files)
export interface ISeeding {
  participant: mongoose.Types.ObjectId;
  seedNumber: number;
  seedingRank?: number; // ITTF ranking or custom ranking
  seedingPoints?: number;
}

export interface IStanding {
  participant: mongoose.Types.ObjectId;
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
  form: string[]; // Last 5 results
  headToHead?: Map<string, number>; // opponent ID -> points in H2H
}


export interface IGroup {
  groupId: string; // e.g., "A", "B", "C"
  groupName: string; // e.g., "Group A"
  participants: mongoose.Types.ObjectId[];
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
  }>;
  standings: IStanding[]; // Last 5 results: "W", "L", "D"
}

export interface ITournament extends Document {
  name: string;
  format: "round_robin" | "knockout";
  category: "individual" | "team";
  matchType: "singles" | "doubles" | "mixed_doubles";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";

  participants: mongoose.Types.ObjectId[];
  organizer: mongoose.Types.ObjectId;

  // Seeding system
  seeding: ISeeding[];
  seedingMethod: "manual" | "ranking" | "random" | "none";

  // Groups/Pools (for larger tournaments)
  useGroups: boolean;
  numberOfGroups?: number;
  groups?: IGroup[];
  advancePerGroup?: number; // How many from each group advance

  // Knockout specific
  knockoutConfig?: {
    allowCustomMatching: boolean;
    autoGenerateBracket: boolean;
    thirdPlaceMatch: boolean;
    consolationBracket: boolean;
  };
  bracket?: any; // Will store the bracket structure

  // Round Robin specific
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;

  standings: IStanding[];

  // Tournament rules (ITTF-compliant)
  rules: {
    pointsForWin: number; // ITTF: 2 points
    pointsForLoss: number; // ITTF: 0 points
    setsPerMatch: number; // Best of 3, 5, or 7
    pointsPerSet: number; // Usually 11
    advanceTop: number; // How many advance to next stage
    deuceSetting: "standard" | "no_deuce"; // Standard: win by 2
    tiebreakRules: string[]; // Order of tiebreakers
  };

  // Draw management
  drawGenerated: boolean;
  drawGeneratedAt?: Date;
  drawGeneratedBy?: mongoose.Types.ObjectId;

  // Participant registration
  joinCode?: string; // Unique 6-character code for joining
  allowJoinByCode: boolean; // Allow participants to self-register
  registrationDeadline?: Date; // Deadline for joining

  venue?: string;
  city: string;
  maxParticipants?: number;
  minParticipants?: number;

  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true },
    format: {
      type: String,
      enum: ["round_robin", "knockout"],
      required: true,
    },
    category: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },
    matchType: {
      type: String,
      enum: ["singles", "doubles", "mixed_doubles"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "upcoming", "in_progress", "completed", "cancelled"],
      default: "draft",
    },

    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Seeding
    seeding: [
      {
        participant: { type: Schema.Types.ObjectId, ref: "User" },
        seedNumber: { type: Number, required: true },
        seedingRank: { type: Number },
        seedingPoints: { type: Number },
      },
    ],
    seedingMethod: {
      type: String,
      enum: ["manual", "ranking", "random", "none"],
      default: "none",
    },

    // Groups/Pools
    useGroups: { type: Boolean, default: false },
    numberOfGroups: { type: Number },
    groups: [groupSchema],
    advancePerGroup: { type: Number },

    // Knockout specific
    knockoutConfig: {
      allowCustomMatching: { type: Boolean, default: true },
      autoGenerateBracket: { type: Boolean, default: true },
      thirdPlaceMatch: { type: Boolean, default: false },
      consolationBracket: { type: Boolean, default: false },
    },
    bracket: { type: Schema.Types.Mixed }, // Will store the bracket structure

    // Rounds
    rounds: [roundSchema],

    // Standings
    standings: [standingSchema],

    // Rules (ITTF-compliant defaults)
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

    venue: { type: String },
    city: { type: String, required: true },
    maxParticipants: { type: Number },
    minParticipants: { type: Number, default: 2 },
  },
  { timestamps: true }
);

const Tournament = mongoose.models.Tournament ||
  mongoose.model<ITournament>("Tournament", tournamentSchema);

export default Tournament;