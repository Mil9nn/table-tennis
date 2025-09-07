import mongoose, { Schema, model, models } from "mongoose";

const PlayerSchema = new Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  displayName: { type: String, required: true }
});

const ShotSchema = new Schema({
  shotName: String,
  timestamp: Number,
  player: Number,
  scoreP1: Number,
  scoreP2: Number,
});

const GameSchema = new Schema({
  gameNumber: Number,
  player1Score: Number,
  player2Score: Number,
  winner: Number,
  shots: [ShotSchema],
  startTime: Number,
  endTime: Number,
});

const MatchSchema = new Schema({
  matchId: String, // Add this to store the original match ID
  player1: PlayerSchema,
  player2: PlayerSchema,
  bestOf: Number,
  games: [GameSchema],
  winner: PlayerSchema,
  startTime: Number,
  endTime: Number,
  stats: Object,
  createdAt: { type: Date, default: Date.now },
});

export default models.Match || model("Match", MatchSchema);