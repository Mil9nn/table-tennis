import mongoose from 'mongoose'

const playerStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalMatches: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  winPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalGames: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  gamesLost: {
    type: Number,
    default: 0
  },
  gameWinPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  pointsScored: {
    type: Number,
    default: 0
  },
  pointsConceded: {
    type: Number,
    default: 0
  },
  avgPointsPerGame: {
    type: Number,
    default: 0
  },
  avgPointsPerMatch: {
    type: Number,
    default: 0
  },
  totalPlayTime: {
    type: Number,
    default: 0
  },
  avgGameDuration: {
    type: Number,
    default: 0
  },
  avgMatchDuration: {
    type: Number,
    default: 0
  },
  totalShots: {
    type: Number,
    default: 0
  },
  shotBreakdown: [{
    shot: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  favoriteShot: {
    type: String,
    default: null
  },
  favoriteShotCount: {
    type: Number,
    default: 0
  },
  leastUsedShot: {
    type: String,
    default: null
  },
  leastUsedShotCount: {
    type: Number,
    default: 0
  },
  tournamentsPlayed: {
    type: Number,
    default: 0
  },
  tournamentsWon: {
    type: Number,
    default: 0
  },
  tournamentFinals: {
    type: Number,
    default: 0
  },
  tournamentSemiFinals: {
    type: Number,
    default: 0
  },
  recentForm: [{
    type: String,
    enum: ['W', 'L']
  }],
  currentStreak: {
    type: {
      type: String,
      enum: ['win', 'loss'],
      default: null
    },
    count: {
      type: Number,
      default: 0
    }
  },
  opponentStats: [{
    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    matches: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    }
  }],
  currentRank: {
    type: Number,
    default: null
  },
  bestRank: {
    type: Number,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
playerStatsSchema.index({ winPercentage: -1 });
playerStatsSchema.index({ totalMatches: -1 });
playerStatsSchema.index({ currentRank: 1 });

// Pre-save middleware
playerStatsSchema.pre('save', function(next) {
  if (this.totalMatches > 0) {
    this.winPercentage = (this.wins / this.totalMatches) * 100;
  }
  if (this.totalGames > 0) {
    this.gameWinPercentage = (this.gamesWon / this.totalGames) * 100;
    this.avgPointsPerGame = this.pointsScored / this.totalGames;
  }
  if (this.totalMatches > 0) {
    this.avgPointsPerMatch = this.pointsScored / this.totalMatches;
  }
  if (this.totalGames > 0 && this.totalPlayTime > 0) {
    this.avgGameDuration = this.totalPlayTime / this.totalGames;
  }
  if (this.totalMatches > 0 && this.totalPlayTime > 0) {
    this.avgMatchDuration = this.totalPlayTime / this.totalMatches;
  }
  next();
});

module.exports = mongoose.model('PlayerStats', playerStatsSchema);