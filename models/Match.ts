import mongoose from 'mongoose';

const ShotSchema = new mongoose.Schema({
  shotName: {
    type: String,
    required: true
  },
  player: {
    type: String,        // Simple string ID
    ref: 'User',         // References User model for population
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  pointNumber: {
    type: Number,
    required: true
  }
});

const GameSchema = new mongoose.Schema({
  gameNumber: {
    type: Number,
    required: true
  },
  player1Score: {
    type: Number,
    required: true,
    default: 0
  },
  player2Score: {
    type: Number,
    required: true,
    default: 0
  },
  winner: {
    type: String,        // Simple string ID
    ref: 'User',         // References User model for population
    default: null
  },
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  },
  shots: [ShotSchema]
});

const MatchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    type: String,        // Simple string ID
    ref: 'User',         // References User model for population
    required: true
  },
  player2: {
    type: String,        // Simple string ID  
    ref: 'User',         // References User model for population
    required: true
  },
  winner: {
    type: String,        // Simple string ID
    ref: 'User',         // References User model for population
    default: null
  },
  bestOf: {
    type: Number,
    required: true,
    enum: [1, 3, 5, 7]   // Common tennis match formats
  },
  games: [GameSchema],
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  }
}, {
  timestamps: true      // Adds createdAt and updatedAt
});

// Indexes for better query performance
MatchSchema.index({ player1: 1 });
MatchSchema.index({ player2: 1 });
MatchSchema.index({ winner: 1 });
MatchSchema.index({ createdAt: -1 });
MatchSchema.index({ matchId: 1 }, { unique: true });
MatchSchema.index({ player1: 1, player2: 1 });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

export default Match;