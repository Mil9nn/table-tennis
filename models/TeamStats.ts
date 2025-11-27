import mongoose from "mongoose";

const recentTeamMatchSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "TeamMatch", required: true },
  opponent: { type: String, required: true },
  result: { type: String, enum: ["win", "loss", "tie"], required: true },
  score: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const playerContributionSchema = new mongoose.Schema({
  subMatchesPlayed: { type: Number, default: 0 },
  subMatchesWon: { type: Number, default: 0 },
  subMatchesLost: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 }
}, { _id: false });

const teamStatsSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    unique: true
  },

  // Match Stats
  totalMatches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  ties: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },

  // SubMatch Stats
  subMatchesPlayed: { type: Number, default: 0 },
  subMatchesWon: { type: Number, default: 0 },
  subMatchesLost: { type: Number, default: 0 },

  // Player Contributions (Map of userId -> stats)
  playerContributions: {
    type: Map,
    of: playerContributionSchema,
    default: () => new Map()
  },

  // Recent Performance (Last 10 matches)
  recentMatches: {
    type: [recentTeamMatchSchema],
    default: []
  },

  // Form
  currentStreak: { type: Number, default: 0 }, // Positive = wins, negative = losses
  bestWinStreak: { type: Number, default: 0 },

  // Timestamps
  lastMatchDate: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Unique index on team
teamStatsSchema.index({ team: 1 }, { unique: true });

// Index for leaderboard sorting
teamStatsSchema.index({ wins: -1, winRate: -1 });

// Index for active teams
teamStatsSchema.index({ lastMatchDate: -1 });

export default mongoose.models.TeamStats ||
  mongoose.model("TeamStats", teamStatsSchema);
