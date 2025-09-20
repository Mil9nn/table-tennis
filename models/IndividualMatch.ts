import mongoose from "mongoose";

const shotSchema = new mongoose.Schema({
  shotNumber: Number,
  side: { type: String, enum: ["side1", "side2"] },
  player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  side1Score: { type: Number, default: 0 },
  side2Score: { type: Number, default: 0 },
  winner: String,
  shots: [shotSchema],
  duration: Number, // in seconds
  startTime: Date,
  endTime: Date,
});

const IndividualMatchSchema = new mongoose.Schema(
  {
    matchCategory: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },

    matchType: { type: String, enum: ["singles", "doubles", "mixed_doubles"], required: true },
    numberOfSets: { type: Number, enum: [1, 3, 5, 7, 9], default: 3 },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: String,
    venue: String,

    // Match Progress
    status: { type: String, enum: ["scheduled", "in_progress", "completed", "cancelled"], default: "scheduled" },
    currentGame: { type: Number, default: 1 },

    games: [gameSchema],

    finalScore: {
      side1Sets: { type: Number, default: 0 },
      side2Sets: { type: Number, default: 0 },
    },
    winner: String,
    matchDuration: Number,

    // Enhanced Match Statistics
    statistics: {
      totalShots: { type: Number, default: 0 },
      totalRallies: { type: Number, default: 0 },
      averageRallyLength: { type: Number, default: 0 },
      longestRally: { type: Number, default: 0 },
      aces: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },

      // Per-player stats (flexible map: works for singles, doubles, team)
      playerStats: {
        type: Map,
        of: new mongoose.Schema({
          winners: { type: Number, default: 0 },
          errors: { type: Number, default: 0 },
          aces: { type: Number, default: 0 },
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
            net_point: { type: Number, default: 0 },
            serve_point: { type: Number, default: 0 },
          },
        }),
      },

      // Team-specific statistics
      teamStats: {
        team1: {
          gamesWon: { type: Number, default: 0 },
          gamesLost: { type: Number, default: 0 },
          // Individual player contributions in team context
          playerContributions: [
            {
              playerName: String,
              gamesPlayed: { type: Number, default: 0 },
              gamesWon: { type: Number, default: 0 },
              shotsPlayed: { type: Number, default: 0 },
              winners: { type: Number, default: 0 },
              errors: { type: Number, default: 0 },
            },
          ],
        },
        team2: {
          gamesWon: { type: Number, default: 0 },
          gamesLost: { type: Number, default: 0 },
          // Individual player contributions in team context
          playerContributions: [
            {
              playerName: String,
              gamesPlayed: { type: Number, default: 0 },
              gamesWon: { type: Number, default: 0 },
              shotsPlayed: { type: Number, default: 0 },
              winners: { type: Number, default: 0 },
              errors: { type: Number, default: 0 },
            },
          ],
        },
      },
    },
  },
);

export default mongoose.models.IndividualMatch || mongoose.model("IndividualMatch", IndividualMatchSchema);