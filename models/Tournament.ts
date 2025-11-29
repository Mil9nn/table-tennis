// models/Tournament.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISeeding {
  participant: mongoose.Types.ObjectId;
  seedNumber: number;
  seedingRank?: number; // ITTF ranking or custom ranking
  seedingPoints?: number;
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
  standings: Array<{
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
    form: string[]; // Last 5 results: "W", "L", "D"
  }>;
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

// Knockout tournament interfaces
export interface IParticipantSlot {
  type: "direct" | "from_match" | "from_group" | "bye" | "tbd";
  participantId?: mongoose.Types.ObjectId;
  fromMatchPosition?: number;
  isWinnerOf?: boolean;
  fromGroupId?: string;
  fromGroupPosition?: number;
}

export interface IBracketMatch {
  matchId?: mongoose.Types.ObjectId;
  bracketPosition: number;
  roundNumber: number;
  participant1: IParticipantSlot;
  participant2: IParticipantSlot;
  winner?: mongoose.Types.ObjectId;
  loser?: mongoose.Types.ObjectId;
  nextMatchPosition?: number;
  loserNextPosition?: number;
  scheduledTime?: Date;
  completed: boolean;
}

export interface IKnockoutRound {
  roundNumber: number;
  name: string;
  matches: IBracketMatch[];
  completed: boolean;
  scheduledDate?: Date;
}

export interface IKnockoutBracket {
  size: number;
  rounds: IKnockoutRound[];
  consolationBracket?: boolean;
  thirdPlaceMatchPosition?: number;
}

export interface ITournamentStage {
  stageNumber: number;
  name: string;
  format: "round_robin" | "knockout";
  startDate?: Date;
  endDate?: Date;
  status: "pending" | "in_progress" | "completed";
  groups?: IGroup[];
  bracket?: IKnockoutBracket;
  qualification?: {
    fromStage: number;
    qualifyingPositions: number[];
    luckyLosers?: number;
    qualifyingMethod: "position" | "points" | "custom";
  };
}

export interface ITournament extends Document {
  name: string;
  format: "round_robin" | "knockout" | "multi_stage";
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

  // Round Robin specific
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
  }>;

  standings: IStanding[];

  // Multi-stage tournament support
  isMultiStage?: boolean;
  stages?: ITournamentStage[];
  currentStageNumber?: number;

  // Knockout bracket (for single-stage knockout tournaments)
  bracket?: IKnockoutBracket;

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

  // Custom bracket matching (for knockout tournaments)
  customBracketMatches?: Array<{
    participant1: mongoose.Types.ObjectId;
    participant2: mongoose.Types.ObjectId;
  }>;

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
      enum: ["round_robin", "knockout", "multi_stage"],
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
    groups: [
      {
        groupId: { type: String, required: true },
        groupName: { type: String, required: true },
        participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
        rounds: [
          {
            roundNumber: { type: Number, required: true },
            matches: [{ type: Schema.Types.ObjectId, ref: "IndividualMatch" }],
            completed: { type: Boolean, default: false },
            scheduledDate: { type: Date },
          },
        ],
        standings: [
          {
            participant: { type: Schema.Types.ObjectId, ref: "User" },
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
          },
        ],
      },
    ],
    advancePerGroup: { type: Number },

    // Rounds
    rounds: [
      {
        roundNumber: { type: Number, required: true },
        matches: [{ type: Schema.Types.ObjectId, ref: "IndividualMatch" }],
        completed: { type: Boolean, default: false },
        scheduledDate: { type: Date },
        scheduledTime: { type: String },
      },
    ],

    // Standings
    standings: [
      {
        participant: { type: Schema.Types.ObjectId, ref: "User" },
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
      },
    ],

    // Multi-stage tournament support
    isMultiStage: { type: Boolean, default: false },
    stages: [
      {
        stageNumber: { type: Number, required: true },
        name: { type: String, required: true },
        format: {
          type: String,
          enum: ["round_robin", "knockout"],
          required: true,
        },
        startDate: { type: Date },
        endDate: { type: Date },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
          default: "pending",
        },
        groups: [
          {
            groupId: { type: String },
            groupName: { type: String },
            participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
            rounds: [
              {
                roundNumber: { type: Number },
                matches: [{ type: Schema.Types.ObjectId, ref: "IndividualMatch" }],
                completed: { type: Boolean, default: false },
                scheduledDate: { type: Date },
              },
            ],
            standings: [
              {
                participant: { type: Schema.Types.ObjectId, ref: "User" },
                played: { type: Number, default: 0 },
                won: { type: Number, default: 0 },
                lost: { type: Number, default: 0 },
                points: { type: Number, default: 0 },
                rank: { type: Number, default: 0 },
              },
            ],
          },
        ],
        bracket: {
          size: { type: Number },
          rounds: [
            {
              roundNumber: { type: Number },
              name: { type: String },
              matches: [
                {
                  matchId: { type: Schema.Types.ObjectId, ref: "IndividualMatch" },
                  bracketPosition: { type: Number, required: true },
                  roundNumber: { type: Number, required: true },
                  participant1: {
                    type: {
                      type: String,
                      enum: ["direct", "from_match", "from_group", "bye", "tbd"],
                    },
                    participantId: { type: Schema.Types.ObjectId, ref: "User" },
                    fromMatchPosition: { type: Number },
                    isWinnerOf: { type: Boolean },
                    fromGroupId: { type: String },
                    fromGroupPosition: { type: Number },
                  },
                  participant2: {
                    type: {
                      type: String,
                      enum: ["direct", "from_match", "from_group", "bye", "tbd"],
                    },
                    participantId: { type: Schema.Types.ObjectId, ref: "User" },
                    fromMatchPosition: { type: Number },
                    isWinnerOf: { type: Boolean },
                    fromGroupId: { type: String },
                    fromGroupPosition: { type: Number },
                  },
                  winner: { type: Schema.Types.ObjectId, ref: "User" },
                  loser: { type: Schema.Types.ObjectId, ref: "User" },
                  nextMatchPosition: { type: Number },
                  loserNextPosition: { type: Number },
                  scheduledTime: { type: Date },
                  completed: { type: Boolean, default: false },
                },
              ],
              completed: { type: Boolean, default: false },
              scheduledDate: { type: Date },
            },
          ],
          consolationBracket: { type: Boolean, default: false },
          thirdPlaceMatchPosition: { type: Number },
        },
        qualification: {
          fromStage: { type: Number },
          qualifyingPositions: [{ type: Number }],
          luckyLosers: { type: Number },
          qualifyingMethod: {
            type: String,
            enum: ["position", "points", "custom"],
          },
        },
      },
    ],
    currentStageNumber: { type: Number, default: 1 },

    // Knockout bracket (for single-stage knockout tournaments)
    bracket: {
      size: { type: Number },
      rounds: [
        {
          roundNumber: { type: Number },
          name: { type: String },
          matches: [
            {
              matchId: { type: Schema.Types.ObjectId, ref: "IndividualMatch" },
              bracketPosition: { type: Number, required: true },
              roundNumber: { type: Number, required: true },
              participant1: {
                type: {
                  type: String,
                  enum: ["direct", "from_match", "from_group", "bye", "tbd"],
                },
                participantId: { type: Schema.Types.ObjectId, ref: "User" },
                fromMatchPosition: { type: Number },
                isWinnerOf: { type: Boolean },
                fromGroupId: { type: String },
                fromGroupPosition: { type: Number },
              },
              participant2: {
                type: {
                  type: String,
                  enum: ["direct", "from_match", "from_group", "bye", "tbd"],
                },
                participantId: { type: Schema.Types.ObjectId, ref: "User" },
                fromMatchPosition: { type: Number },
                isWinnerOf: { type: Boolean },
                fromGroupId: { type: String },
                fromGroupPosition: { type: Number },
              },
              winner: { type: Schema.Types.ObjectId, ref: "User" },
              loser: { type: Schema.Types.ObjectId, ref: "User" },
              nextMatchPosition: { type: Number },
              loserNextPosition: { type: Number },
              scheduledTime: { type: Date },
              completed: { type: Boolean, default: false },
            },
          ],
          completed: { type: Boolean, default: false },
          scheduledDate: { type: Date },
        },
      ],
      consolationBracket: { type: Boolean, default: false },
      thirdPlaceMatchPosition: { type: Number },
    },

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

    // Custom bracket matching (for knockout tournaments)
    customBracketMatches: [
      {
        participant1: { type: Schema.Types.ObjectId, ref: "User" },
        participant2: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

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