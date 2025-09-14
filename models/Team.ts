import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String, // captain, player
    joinedDate: { type: Date, default: Date.now }
  }],
  description: String,
  city: String,
  stats: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export default mongoose.models.Team || mongoose.model('Team', teamSchema);
