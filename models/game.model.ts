import mongoose, { Schema, model, models } from "mongoose";

const ShotSchema = new Schema({
  shotName: String,
  timestamp: Number,
  player: Number,
  scoreP1: Number,
  scoreP2: Number,
});

const GameSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  player1: {
    score: Number,
    gamesWon: Number,
    shots: [ShotSchema],
  },
  player2: {
    score: Number,
    gamesWon: Number,
    shots: [ShotSchema],
  },
  createdAt: { type: Date, default: Date.now },
});

export default models.Game || model("Game", GameSchema);
