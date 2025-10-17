import mongoose, { Types } from "mongoose";

const shotSchema = new mongoose.Schema({
  shotNumber: Number,
  side: { type: String, enum: ["team1", "team2"], required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  stroke: {
    type: String,
    enum: [
      "forehand_drive",
      "backhand_drive",
      "forehand_topspin",
      "backhand_topspin",
      "forehand_loop",
      "backhand_loop",
      "forehand_smash",
      "backhand_smash",
      "forehand_push",
      "backhand_push",
      "forehand_chop",
      "backhand_chop",
      "forehand_flick",
      "backhand_flick",
      "forehand_block",
      "backhand_block",
      "forehand_drop",
      "backhand_drop",
    ],
    default: null,
  },

  errorType: {
    type: String,
    enum: ["net", "long", "serve"],
    default: null,
  },

  outcome: { type: String, enum: ["winner", "error", "let"], required: true },
  server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  timestamp: { type: Date, default: Date.now },
});

// Game Schema
const gameSchema = new mongoose.Schema({
  gameNumber: Number,

  team1Score: { type: Number, default: 0 },
  team2Score: { type: Number, default: 0 },

  winnerSide: { type: String, enum: ["team1", "team2"], default: null },
  completed: { type: Boolean, default: false },
  expedite: { type: Boolean, default: false },

  shots: [shotSchema],

  duration: Number,
  startTime: Date,
  endTime: Date,
});

// Server Config (doubles rotation, etc.)
const serverConfigSchema = new mongoose.Schema({
  firstServer: {
    type: String,
    enum: [
      "team1",
      "team2",
      "team1_player1",
      "team1_player2",
      "team2_player1",
      "team2_player2",
    ],
    default: null,
  },
  firstReceiver: {
    type: String,
    enum: [
      "team1",
      "team2",
      "team1_player1",
      "team1_player2",
      "team2_player1",
      "team2_player2",
    ],
    default: null,
  },
  serverOrder: [
    {
      type: String,
      enum: [
        "team1_player1",
        "team1_player2",
        "team2_player1",
        "team2_player2",
      ],
    },
  ],
});

// --- SubMatch Schema (rubbers inside team match) ---
const subMatchSchema = new mongoose.Schema({
  subMatchNumber: Number,
  type: { type: String, enum: ["singles", "doubles", "mixed_doubles"], required: true },

  team1Players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  team2Players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],

  games: [gameSchema],
  currentGame: { type: Number, default: 1 },

  finalScore: {
    team1Sets: { type: Number, default: 0 },
    team2Sets: { type: Number, default: 0 },
  },

  winnerSide: { type: String, enum: ["team1", "team2"], default: null },

  serverConfig: { type: serverConfigSchema, default: null },
  completed: { type: Boolean, default: false },

  // --- Per-player statistics (same as IndividualMatch) ---
  statistics: {
    winners: { type: Number, default: 0 },
    unforcedErrors: { type: Number, default: 0 },
    aces: { type: Number, default: 0 },
    serveErrors: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    clutchPointsWon: { type: Number, default: 0 },

    playerStats: {
      type: Map,
      of: new mongoose.Schema({
        winners: { type: Number, default: 0 },
        unforcedErrors: { type: Number, default: 0 },
        aces: { type: Number, default: 0 },
        serveErrors: { type: Number, default: 0 },

        detailedShots: {
          forehand_drive: { type: Number, default: 0 },
          backhand_drive: { type: Number, default: 0 },
          forehand_topspin: { type: Number, default: 0 },
          backhand_topspin: { type: Number, default: 0 },
          forehand_loop: { type: Number, default: 0 },
          backhand_loop: { type: Number, default: 0 },
          forehand_smash: { type: Number, default: 0 },
          backhand_smash: { type: Number, default: 0 },
          forehand_push: { type: Number, default: 0 },
          backhand_push: { type: Number, default: 0 },
          forehand_chop: { type: Number, default: 0 },
          backhand_chop: { type: Number, default: 0 },
          forehand_flick: { type: Number, default: 0 },
          backhand_flick: { type: Number, default: 0 },
          forehand_block: { type: Number, default: 0 },
          backhand_block: { type: Number, default: 0 },
          forehand_drop: { type: Number, default: 0 },
          backhand_drop: { type: Number, default: 0 },
        },

        errorsByType: {
          net: { type: Number, default: 0 },
          long: { type: Number, default: 0 },
          serve: { type: Number, default: 0 },
        },
      }),
    },
  },
});

export interface ITeamMatch extends Document {
  team1: {
    name: string;
    players: Array<{
      user: Types.ObjectId | {
        username: string;
        fullName?: string;
        profileImage?: string;
        _id: string;
      };
    }>;
    assignments: Record<string, string> | Map<string, string>;
  };
  team2: {
    name: string;
    players: Array<{
      user: Types.ObjectId | {
        username: string;
        fullName?: string;
        profileImage?: string;
        _id: string;
      };
    }>;
    assignments: Record<string, string> | Map<string, string>;
  };
  scorer?: {
    username: string;
    fullName?: string;
    profileImage?: string;
    _id: string;
  };
  subMatches: Array<{
    team1Players: Array<any>;
    team2Players: Array<any>;
    games: Array<{
      shots: Array<{
        player: any;
      }>;
    }>;
  }>;
}

// --- Team Match Schema ---
const TeamMatchSchema = new mongoose.Schema(
  {
    matchCategory: { type: String, enum: ["team"], required: true, default: "team" },

    format: {
      type: String,
      enum: [
        "swaythling_format",   // ABCAB vs XYZYX
        "single_double_single", // A, AB, B vs X, XY, Y
        "five_singles_full",    // ABCDE vs XYZPQ
        "three_singles",         // A,B,C vs X,Y,Z
      ],
      required: true,
    },

    numberOfSetsPerSubMatch: { type: Number, enum: [3, 5, 7], default: 5 },

    team1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    team2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    subMatches: [subMatchSchema],
    currentSubMatch: { type: Number, default: 1 },

    finalScore: {
      team1Matches: { type: Number, default: 0 },
      team2Matches: { type: Number, default: 0 },
    },

    winnerTeam: { type: String, enum: ["team1", "team2"], default: null },

    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: String,
    venue: String,

    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },

    matchDuration: Number,
  },
  { timestamps: true }
);

// VIRTUALS
TeamMatchSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

TeamMatchSchema.virtual("subMatchStats").get(function () {
  return this.subMatches.map((sm: any) => ({
    subMatchNumber: sm.subMatchNumber,
    winnerSide: sm.winnerSide,
    playerStats: sm.statistics?.playerStats || {},
  }));
});

export default mongoose.models.TeamMatch || mongoose.model("TeamMatch", TeamMatchSchema);
