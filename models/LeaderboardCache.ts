import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRankingEntry {
  rank: number;
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  profileImage?: string;
  matches: number;
  wins: number;
  losses: number;
  ties?: number;
  winRate: number;
  setsWon?: number;
  setsLost?: number;
  streak?: number;
  lastMatchDate?: Date;
}

export interface ILeaderboardCache extends Document {
  type: "individual_singles" | "individual_doubles" | "individual_mixed_doubles" | "team";
  rankings: IRankingEntry[];
  generatedAt: Date;
  expiresAt: Date;
}

const rankingEntrySchema = new Schema<IRankingEntry>(
  {
    rank: Number,
    entityId: Schema.Types.ObjectId,
    entityName: String,
    profileImage: String,
    matches: Number,
    wins: Number,
    losses: Number,
    ties: Number,
    winRate: Number,
    setsWon: Number,
    setsLost: Number,
    streak: Number,
    lastMatchDate: Date,
  },
  { _id: false }
);

const leaderboardCacheSchema = new Schema<ILeaderboardCache>(
  {
    type: {
      type: String,
      enum: [
        "individual_singles",
        "individual_doubles",
        "individual_mixed_doubles",
        "team",
      ],
      required: true,
    },
    rankings: { type: [rankingEntrySchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

leaderboardCacheSchema.index({ type: 1, generatedAt: -1 });
leaderboardCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models.LeaderboardCache as Model<ILeaderboardCache>) ||
  mongoose.model<ILeaderboardCache>("LeaderboardCache", leaderboardCacheSchema);
