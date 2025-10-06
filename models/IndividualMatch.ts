import mongoose from "mongoose";

// Shot Schema
const shotSchema = new mongoose.Schema({
  shotNumber: Number,

  side: { type: String, enum: ["side1", "side2"], required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Separate stroke vs errors to avoid crashes
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
    default: null, // only used if outcome = "error"
  },

  outcome: {
    type: String,
    enum: ["winner", "error", "let"],
    required: true,
  },

  server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  timestamp: { type: Date, default: Date.now },
});

// Game Schema
const gameSchema = new mongoose.Schema({
  gameNumber: Number,

  side1Score: { type: Number, default: 0 },
  side2Score: { type: Number, default: 0 },

  winnerSide: { type: String, enum: ["side1", "side2"], default: null },

  completed: { type: Boolean, default: false },
  expedite: { type: Boolean, default: false }, // ITTF expedite system marker

  shots: [shotSchema],

  duration: Number,
  startTime: Date,
  endTime: Date,
});

const serverConfigSchema = new mongoose.Schema({
  firstServer: {
    type: String,
    enum: [
      "side1",
      "side2",
      "side1_main",
      "side1_partner",
      "side2_main",
      "side2_partner",
    ],
    default: null,
  },
  firstReceiver: {
    type: String,
    enum: [
      "side1",
      "side2",
      "side1_main",
      "side1_partner",
      "side2_main",
      "side2_partner",
    ],
    default: null,
  },
  serverOrder: [
    {
      type: String,
      enum: ["side1_main", "side1_partner", "side2_main", "side2_partner"],
    },
  ],
});

// Match Schema
const IndividualMatchSchema = new mongoose.Schema(
  {
    matchCategory: {
      type: String,
      enum: ["individual"],
      required: true,
      default: "individual",
    },

    matchType: {
      type: String,
      enum: ["singles", "doubles", "mixed_doubles"],
      required: true,
    },

    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: String,
    venue: String,

    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    currentGame: { type: Number, default: 1 },

    currentServer: {
      type: String,
      enum: [
        "side1",
        "side2",
        "side1_main",
        "side1_partner",
        "side2_main",
        "side2_partner",
      ],
      default: null,
    },

    games: [gameSchema],

    finalScore: {
      side1Sets: { type: Number, default: 0 },
      side2Sets: { type: Number, default: 0 },
    },
    winnerSide: { type: String, enum: ["side1", "side2"], default: null },

    serverConfig: {
      type: serverConfigSchema,
      default: null,
    },

    matchDuration: Number,

    // Enhanced Match Statistics
    statistics: {
      winners: { type: Number, default: 0 },
      unforcedErrors: { type: Number, default: 0 },
      aces: { type: Number, default: 0 },
      serveErrors: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      clutchPointsWon: { type: Number, default: 0 },

      // Per-player stats (works for singles/doubles)
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
  },
  { timestamps: true }
);

// VIRTUALS
IndividualMatchSchema.virtual("statistics.winnerErrorRatio").get(function () {
  const winners = this.statistics?.winners || 0;
  const errors = this.statistics?.unforcedErrors || 0;
  const total = winners + errors;
  return total > 0 ? (winners / total).toFixed(2) : "0.00";
});

IndividualMatchSchema.virtual("playerStatsWithRatio").get(function () {
  if (!this.statistics?.playerStats) return {};

  const result: Record<string, any> = {};
  this.statistics.playerStats.forEach((stats: any, playerId: string) => {
    const winners = stats?.winners || 0;
    const errors = stats?.unforcedErrors || 0;
    const total = winners + errors;

    result[playerId] = {
      ...stats.toObject(),
      winnerErrorRatio: total > 0 ? winners / total : 0,
    };
  });

  return result;
});

export default mongoose.models.IndividualMatch ||
  mongoose.model("IndividualMatch", IndividualMatchSchema);
