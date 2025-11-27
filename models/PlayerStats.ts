import mongoose from "mongoose";

const recentMatchSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "IndividualMatch", required: true },
  opponent: { type: String, required: true },
  result: { type: String, enum: ["win", "loss"], required: true },
  score: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const headToHeadSchema = new mongoose.Schema({
  matches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 }
}, { _id: false });

const shotStatsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
}, { _id: false });

const detailedShotsSchema = new mongoose.Schema({
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
  backhand_drop: { type: Number, default: 0 }
}, { _id: false });

const shotsSchema = new mongoose.Schema({
  forehand: { type: shotStatsSchema, default: () => ({}) },
  backhand: { type: shotStatsSchema, default: () => ({}) },
  serve: { type: shotStatsSchema, default: () => ({}) },
  offensive: { type: Number, default: 0 },
  defensive: { type: Number, default: 0 },
  neutral: { type: Number, default: 0 },
  detailed: { type: detailedShotsSchema, default: () => ({}) }
}, { _id: false });

const playerStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  matchType: {
    type: String,
    enum: ["singles", "doubles", "mixed_doubles"],
    required: true
  },

  // Match Stats
  totalMatches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },

  // Set/Game Stats
  setsWon: { type: Number, default: 0 },
  setsLost: { type: Number, default: 0 },
  setWinRate: { type: Number, default: 0 },

  // Point Stats
  totalPoints: { type: Number, default: 0 },
  pointsWon: { type: Number, default: 0 },
  pointsLost: { type: Number, default: 0 },

  // Shot Analysis
  shots: { type: shotsSchema, default: () => ({}) },

  // Streak Tracking
  currentStreak: { type: Number, default: 0 }, // Positive = wins, negative = losses
  bestWinStreak: { type: Number, default: 0 },
  worstLoseStreak: { type: Number, default: 0 },

  // Head-to-Head Cache (Map of opponentId -> stats)
  headToHead: {
    type: Map,
    of: headToHeadSchema,
    default: () => new Map()
  },

  // Recent Performance (Last 10 matches)
  recentMatches: {
    type: [recentMatchSchema],
    default: []
  },

  // Timestamps
  lastMatchDate: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound unique index: each user has one document per match type
playerStatsSchema.index({ user: 1, matchType: 1 }, { unique: true });

// Index for leaderboard sorting
playerStatsSchema.index({ matchType: 1, wins: -1, winRate: -1 });

// Index for active players
playerStatsSchema.index({ lastMatchDate: -1 });

export default mongoose.models.PlayerStats ||
  mongoose.model("PlayerStats", playerStatsSchema);

  
