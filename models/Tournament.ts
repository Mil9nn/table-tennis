const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  format: {
    type: String,
    required: true,
    enum: ['single_elimination', 'double_elimination', 'round_robin'],
    default: 'single_elimination'
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 4,
    max: 64,
    validate: {
      validator: function(v) {
        if (this.format === 'single_elimination' || this.format === 'double_elimination') {
          return (v & (v - 1)) === 0;
        }
        return true;
      },
      message: 'Max participants must be a power of 2 for elimination tournaments'
    }
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  prizePool: {
    type: Number,
    default: 0,
    min: 0
  },
  bestOf: {
    type: Number,
    required: true,
    enum: [3, 5, 7],
    default: 3
  },
  registrationDeadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Registration deadline must be in the future'
    }
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.registrationDeadline;
      },
      message: 'Start date must be after registration deadline'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'registration_open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    seed: {
      type: Number,
      default: null
    },
    eliminated: {
      type: Boolean,
      default: false
    },
    eliminatedAt: {
      type: Date,
      default: null
    },
    finalPosition: {
      type: Number,
      default: null
    }
  }],
  brackets: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  runnerUp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ 'participants.user': 1 });

// Pre-save middleware
tournamentSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    this.currentParticipants = this.participants.length;
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);
