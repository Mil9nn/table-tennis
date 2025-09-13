import mongoose, {Schema, Document} from 'mongoose';

const ShotSchema = new mongoose.Schema({
  shotName: { type: String, required: true },
  player: {
    type: mongoose.Schema.Types.ObjectId,   // ✅ ObjectId
    ref: 'User',
    required: true
  },
  timestamp: { type: Number, required: true },
  pointNumber: { type: Number, required: true }
});

const GameSchema = new mongoose.Schema({
  gameNumber: { type: Number, required: true },
  player1Score: { type: Number, required: true, default: 0 },
  player2Score: { type: Number, required: true, default: 0 },
  winner: {
    type: mongoose.Schema.Types.ObjectId,   // ✅ ObjectId
    ref: 'User',
    default: null
  },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  shots: [ShotSchema]
});

// Venue interface
interface IVenue {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string; // Google Places ID
}

// Sub-match for team matches
interface ISubMatch {
  subMatchNumber: number;
  matchType: 'singles' | 'doubles';
  player1: string; // User ID
  player2: string; // User ID  
  player3?: string; // For doubles (partner of player1)
  player4?: string; // For doubles (partner of player2)
  winner?: string; // User ID
  games: {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner: string | null;
    startTime: number;
    endTime: number;
    shots: {
      shotName: string;
      player: string;
      timestamp: number;
      pointNumber: number;
    }[];
  }[];
  startTime?: number;
  endTime?: number;
  status: 'pending' | 'in-progress' | 'completed';
}

// Team composition
interface ITeam {
  teamName?: string;
  players: string[]; // Array of User IDs
  captain?: string; // User ID of team captain
}

export interface IMatch extends Document {
  // Basic match info
  matchId: string;
  matchCategory: 'individual' | 'team';
  
  // For individual matches (current system)
  player1?: string;
  player2?: string;
  player3?: string; // doubles
  player4?: string; // doubles
  
  // For team matches
  team1?: ITeam;
  team2?: ITeam;
  teamFormat?: 'format1' | 'format2' | 'format3'; // The 3 formats you mentioned
  subMatches?: ISubMatch[];
  
  // Match details
  winner?: string; // User ID or team identifier
  bestOf: number;
  venue?: IVenue;
  scorer: string; // User ID of the scorer
  
  // Timing
  startTime: number;
  endTime?: number;
  
  // Legacy fields for individual matches
  games?: {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner: string | null;
    startTime: number;
    endTime: number;
    shots: {
      shotName: string;
      player: string;
      timestamp: number;
      pointNumber: number;
    }[];
  }[];
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  placeId: { type: String }
});

const SubMatchSchema = new Schema<ISubMatch>({
  subMatchNumber: { type: Number, required: true },
  matchType: { type: String, enum: ['singles', 'doubles'], required: true },
  player1: { type: String, ref: 'User', required: true },
  player2: { type: String, ref: 'User', required: true },
  player3: { type: String, ref: 'User' },
  player4: { type: String, ref: 'User' },
  winner: { type: String, ref: 'User' },
  games: [{
    gameNumber: { type: Number, required: true },
    player1Score: { type: Number, default: 0 },
    player2Score: { type: Number, default: 0 },
    winner: { type: String, ref: 'User', default: null },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    shots: [{
      shotName: { type: String, required: true },
      player: { type: String, ref: 'User', required: true },
      timestamp: { type: Number, required: true },
      pointNumber: { type: Number, required: true }
    }]
  }],
  startTime: { type: Number },
  endTime: { type: Number },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
});

const TeamSchema = new Schema<ITeam>({
  teamName: { type: String },
  players: [{ type: String, ref: 'User', required: true }],
  captain: { type: String, ref: 'User' }
});

const MatchSchema = new Schema<IMatch>({
  matchId: { type: String, required: true, unique: true },
  matchCategory: { type: String, enum: ['individual', 'team'], required: true },
  
  // Individual match fields
  player1: { type: String, ref: 'User' },
  player2: { type: String, ref: 'User' },
  player3: { type: String, ref: 'User' },
  player4: { type: String, ref: 'User' },
  
  // Team match fields
  team1: TeamSchema,
  team2: TeamSchema,
  teamFormat: { type: String, enum: ['format1', 'format2', 'format3'] },
  subMatches: [SubMatchSchema],
  
  // Common fields
  winner: { type: String }, // Can be User ID or team identifier
  bestOf: { type: Number, required: true },
  venue: VenueSchema,
  scorer: { type: String, ref: 'User', required: true },
  
  startTime: { type: Number, required: true },
  endTime: { type: Number },
  
  // Legacy games for individual matches
  games: [{
    gameNumber: { type: Number, required: true },
    player1Score: { type: Number, default: 0 },
    player2Score: { type: Number, default: 0 },
    winner: { type: String, ref: 'User', default: null },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    shots: [{
      shotName: { type: String, required: true },
      player: { type: String, ref: 'User', required: true },
      timestamp: { type: Number, required: true },
      pointNumber: { type: Number, required: true }
    }]
  }],
  
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
}, {
  timestamps: true
});


// Indexes for better query performance
MatchSchema.index({ matchId: 1 });
MatchSchema.index({ 'team1.players': 1 });
MatchSchema.index({ 'team2.players': 1 });
MatchSchema.index({ player1: 1, player2: 1 });
MatchSchema.index({ scorer: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ createdAt: -1 });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

export default Match;