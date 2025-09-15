import mongoose from "mongoose";

const shotSchema = new mongoose.Schema({
  shotNumber: Number,
  player: String,
  shotType: {
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
      "net_point",
      "serve_point",
    ],
  },
  result: {
    type: String,
    enum: ["winner", "error", "in_play"],
  },
  timestamp: { type: Date, default: Date.now },
});

const gameSchema = new mongoose.Schema({
  gameNumber: Number,
  player1Score: { type: Number, default: 0 },
  player2Score: { type: Number, default: 0 },
  winner: String,
  shots: [shotSchema],
  duration: Number, // in seconds
  startTime: Date,
  endTime: Date,
});

const matchSchema = new mongoose.Schema(
  {
    matchCategory: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },
    matchType: {
      type: String,
      required: true,
    },
    numberOfSets: {
      type: Number,
      enum: [1, 3, 5, 7, 9],
      default: 3,
    },
    city: String,
    venue: String,
    scorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Individual Match Fields
    players: {
      player1: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
      player2: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
      player3: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
      player4: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
    },

    // Team Match Fields
    team1: {
      name: String,
      players: [
        {
          id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: String,
          role: String, // A, B, C etc
        },
      ],
    },
    team2: {
      name: String,
      players: [
        {
          id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: String,
          role: String, // X, Y, Z etc
        },
      ],
    },

    // Match Progress
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    currentGame: { type: Number, default: 1 },

    // Games/Sets Data
    games: [gameSchema],

    // Match Results
    finalScore: {
      player1Sets: { type: Number, default: 0 },
      player2Sets: { type: Number, default: 0 },
    },
    winner: String,
    matchDuration: Number, // total duration in seconds

    // Match Statistics
    statistics: {
      totalShots: { type: Number, default: 0 },
      longestRally: { type: Number, default: 0 },
      aces: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
      playerStats: {
        player1: {
          winners: { type: Number, default: 0 },
          errors: { type: Number, default: 0 },
          aces: { type: Number, default: 0 },
          shotBreakdown: {
            forehand: { type: Number, default: 0 },
            backhand: { type: Number, default: 0 },
            smash: { type: Number, default: 0 },
            serve: { type: Number, default: 0 },
          },
        },
        player2: {
          winners: { type: Number, default: 0 },
          errors: { type: Number, default: 0 },
          aces: { type: Number, default: 0 },
          shotBreakdown: {
            forehand: { type: Number, default: 0 },
            backhand: { type: Number, default: 0 },
            smash: { type: Number, default: 0 },
            serve: { type: Number, default: 0 },
          },
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
