const mongoose = require('mongoose');

const matchHistorySchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null
  },
  tournamentMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentMatch',
    default: null
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    winnerScore: {
      type: Number,
      required: true
    },
    loserScore: {
      type: Number,
      required: true
    }
  },
  games: [{
    gameNumber: Number,
    player1Points: Number,
    player2Points: Number,
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duration: Number
  }],
  totalDuration: {
    type: Number,
    required: true
  },
  matchType: {
    type: String,
    enum: ['tournament', 'friendly', 'practice'],
    default: 'tournament'
  },
  completedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
matchHistorySchema.index({ player1: 1, completedAt: -1 });
matchHistorySchema.index({ player2: 1, completedAt: -1 });
matchHistorySchema.index({ tournament: 1 });

module.exports = mongoose.model('MatchHistory', matchHistorySchema);