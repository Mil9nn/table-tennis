import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  startDate: Date,
  endDate: Date,
  location: {
    city: String,
    venue: String,
    address: String
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  format: {
    type: String,
    enum: ['knockout', 'round_robin', 'group_stage'],
    default: 'knockout'
  }
}, {
  timestamps: true
});

export default mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema);