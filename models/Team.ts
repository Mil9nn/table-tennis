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
  logo: String,
  assignments: {
    type: Map,
    of: String,
    default: {}
  },
  joinCode: { type: String, unique: true, sparse: true },
  allowJoinByCode: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.models.Team || mongoose.model('Team', teamSchema);
