import mongoose from "mongoose";

const shotSchema = new mongoose.Schema({
  shotNumber: Number,

  side: { type: String, enum: ["side1", "side2"], required: true },
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

  // Shot coordinate system:
  // Origin: -50 to 150 (player can hit from anywhere, including off-table)
  // Landing: 0 to 100 (point scored = ball landed on table)
  // Extended coordinate system: -50 to 0 (left/top margin), 0 to 100 (table), 100 to 150 (right/bottom margin)
  originX: { type: Number, min: -50, max: 150 },
  originY: { type: Number, min: -50, max: 150 },
  landingX: { type: Number, min: 0, max: 100 },
  landingY: { type: Number, min: 0, max: 100 },

  timestamp: { type: Date, default: Date.now },
});

// Game Schema
const gameSchema = new mongoose.Schema({
  gameNumber: Number,

  side1Score: { type: Number, default: 0 },
  side2Score: { type: Number, default: 0 },

  winnerSide: { type: String, enum: ["side1", "side2"], default: null },

  completed: { type: Boolean, default: false },

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
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      default: null
    },

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
      // Per-player stats (works for singles/doubles)
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

IndividualMatchSchema.virtual("playerStatsWithRatio").get(function () {
  if (!this.statistics?.playerStats) return {};

  const result: Record<string, any> = {};
  this.statistics.playerStats.forEach((stats: any, playerId: string) => {

    result[playerId] = {
      ...stats.toObject()
    };
  });

  return result;
});

export default mongoose.models.IndividualMatch ||
  mongoose.model("IndividualMatch", IndividualMatchSchema);
