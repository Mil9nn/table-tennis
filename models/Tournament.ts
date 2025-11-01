// models/Tournament.ts
import mongoose, { Schema, Document } from "mongoose";
import IndividualMatch from "./IndividualMatch";

export interface ITournament extends Document {
  name: string;
  format: "round_robin" | "knockout" | "swiss";
  category: "individual" | "team";
  matchType: "singles" | "doubles" | "mixed_doubles";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";
  
  participants: mongoose.Types.ObjectId[];
  organizer: mongoose.Types.ObjectId;
  
  // Round Robin specific
  rounds: Array<{
    roundNumber: number;
    matches: mongoose.Types.ObjectId[];
    completed: boolean;
  }>;
  
  standings: Array<{
    participant: mongoose.Types.ObjectId;
    played: number;
    won: number;
    lost: number;
    setsWon: number;
    setsLost: number;
    points: number;
    rank: number;
  }>;
  
  // Tournament rules
  rules: {
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    setsPerMatch: number;
    advanceTop: number; // How many advance to next stage
  };
  
  venue?: string;
  city: string;
  description?: string;
  prizePool?: string;
  registrationDeadline?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true },
    format: {
      type: String,
      enum: ["round_robin", "knockout", "swiss"],
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
    
    rounds: [
      {
        roundNumber: { type: Number, required: true },
        matches: [{ type: Schema.Types.ObjectId, ref: "IndividualMatch" }],
        completed: { type: Boolean, default: false },
      },
    ],
    
    standings: [
      {
        participant: { type: Schema.Types.ObjectId, ref: "User" },
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        lost: { type: Number, default: 0 },
        setsWon: { type: Number, default: 0 },
        setsLost: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
      },
    ],
    
    rules: {
      pointsForWin: { type: Number, default: 2 },
      pointsForLoss: { type: Number, default: 0 },
      pointsForDraw: { type: Number, default: 1 },
      setsPerMatch: { type: Number, default: 3 },
      advanceTop: { type: Number, default: 0 },
    },
    
    venue: { type: String },
    city: { type: String, required: true },
    description: { type: String },
    prizePool: { type: String },
    registrationDeadline: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Tournament || 
  mongoose.model<ITournament>("Tournament", tournamentSchema);