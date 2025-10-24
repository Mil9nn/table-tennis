import mongoose from "mongoose";

// Shot Schema (reused / identical to IndividualMatch)
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

  server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  timestamp: { type: Date, default: Date.now },
});

// Game Schema (reused / identical to IndividualMatch)
const gameSchema = new mongoose.Schema({
  gameNumber: Number,

  team1Score: { type: Number, default: 0 },
  team2Score: { type: Number, default: 0 },

  winnerSide: { type: String, enum: ["team1", "team2"], default: null },

  completed: { type: Boolean, default: false },
  expedite: { type: Boolean, default: false }, // ITTF expedite system marker

  shots: [shotSchema],

  duration: Number,
  startTime: Date,
  endTime: Date,
});

// Server Config (match-level, supports singles/doubles keys used in UI)
const serverConfigSchema = new mongoose.Schema({
  firstServer: {
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
  firstReceiver: {
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
  serverOrder: [
    {
      type: String,
      enum: ["team1_main", "team1_partner", "team2_main", "team2_partner"],
    },
  ],
});

const subMatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true },
  matchType: { type: String, enum: ["singles", "doubles"], default: "singles" },

  // Change to arrays to support doubles
  playerTeam1: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  playerTeam2: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  numberOfSets: { type: Number, enum: [3, 5, 7], default: 5 },

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

// Team info used in team1/team2
const teamInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // players array — matches your Team schema style (user + role + joinedDate)
  players: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["captain", "player"], default: "player" },
      joinedDate: { type: Date, default: Date.now },
    },
  ],

  // assignments map (A,B,C -> playerId ; X,Y,Z -> playerId)
  assignments: {
    type: Map,
    of: String,
    default: {},
  },

  city: String,
  stats: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
  },
});

/* -------------------- MAIN TEAM MATCH SCHEMA -------------------- */

const TeamMatchSchema = new mongoose.Schema(
  {
    matchCategory: {
      type: String,
      enum: ["team"],
      required: true,
      default: "team",
    },

    matchType: {
      type: String,
    },
    
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
    numberOfSetsPerSubMatch: { type: Number, enum: [3, 5, 7], default: 5 },

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

    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // match-level server config & currentServer (for default singles server behavior)
    serverConfig: {
      type: serverConfigSchema,
      default: null,
    },

    // status, timestamps, meta
    city: String,
    venue: String,
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },

    matchDuration: Number,

    // -------------------- STATISTICS --------------------
    statistics: {
      longestStreak: { type: Number, default: 0 },
      clutchPointsWon: { type: Number, default: 0 },

      // Per-player stats map (playerId -> stats object)
      playerStats: {
        type: Map,
        of: new mongoose.Schema({

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
        }),
      },
    },
  },
  { timestamps: true }
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

export default mongoose.models.TeamMatch ||
  mongoose.model("TeamMatch", TeamMatchSchema);
