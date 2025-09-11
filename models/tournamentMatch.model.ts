import mongoose from 'mongoose';

const tournamentMatchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  round: {
    type: Number,
    required: true,
    min: 1
  },
  matchNumber: {
    type: Number,
    required: true,
    min: 1
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
    default: null
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  score: {
    player1Score: {
      type: Number,
      default: 0,
      min: 0
    },
    player2Score: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  games: [{
    gameNumber: {
      type: Number,
      required: true
    },
    player1Points: {
      type: Number,
      required: true,
      min: 0
    },
    player2Points: {
      type: Number,
      required: true,
      min: 0
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    duration: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'walkover'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  bracketPosition: {
    type: String,
    required: true
  },
  nextMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentMatch',
    default: null
  },
  totalDuration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
tournamentMatchSchema.index({ tournament: 1, round: 1 });
tournamentMatchSchema.index({ player1: 1, player2: 1 });
tournamentMatchSchema.index({ status: 1 });

module.exports = mongoose.model('TournamentMatch', tournamentMatchSchema);