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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ["captain", "player"], default: "player" },
    joinedDate: { type: Date, default: Date.now }
  }],
  city: String,
  stats: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
  },
  assignments: {
    type: Map,
    of: mongoose.Schema.Types.ObjectId,
    default: {}
  } 
}, {
  timestamps: true
});

export default mongoose.models.Team || mongoose.model('Team', teamSchema);
