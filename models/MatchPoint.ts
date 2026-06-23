import mongoose, { Schema, Document, Types } from "mongoose";
import { shotCategories } from "@/constants/constants";

const getAllShotValues = (): string[] =>
  Object.values(shotCategories)
    .flatMap((category) => category.shots)
    .map((shot) => shot.value);

export interface IMatchPoint extends Document {
  match: Types.ObjectId;
  matchCategory: "individual" | "team";
  /** Subdocument _id for embedded team submatch; null for individual rubbers */
  teamSubMatchId: Types.ObjectId | null;
  gameNumber: number;
  shotNumber: number;
  side: string;
  player: Types.ObjectId;
  stroke: string | null;
  serveType: string | null;
  server: Types.ObjectId | null;
  originX?: number;
  originY?: number;
  landingX?: number;
  landingY?: number;
  timestamp: Date;
}

const matchPointSchema = new Schema<IMatchPoint>(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    matchCategory: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },
    teamSubMatchId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    gameNumber: { type: Number, required: true },
    shotNumber: { type: Number, required: true },
    side: {
      type: String,
      required: true,
    },
    player: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stroke: {
      type: String,
      enum: getAllShotValues(),
      default: null,
    },
    serveType: {
      type: String,
      enum: ["side_spin", "top_spin", "back_spin", "mix_spin", "no_spin"],
      default: null,
    },
    server: { type: Schema.Types.ObjectId, ref: "User", default: null },
    originX: { type: Number, min: -100, max: 200 },
    originY: { type: Number, min: -100, max: 200 },
    landingX: { type: Number, min: 0, max: 100 },
    landingY: { type: Number, min: 0, max: 100 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "matchpoints" }
);

matchPointSchema.index(
  { match: 1, teamSubMatchId: 1, gameNumber: 1, shotNumber: 1 },
  { unique: true }
);
matchPointSchema.index({ match: 1, gameNumber: 1 });

const MatchPoint =
  mongoose.models.MatchPoint ||
  mongoose.model<IMatchPoint>("MatchPoint", matchPointSchema);

export default MatchPoint;
