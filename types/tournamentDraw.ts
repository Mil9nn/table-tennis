export interface SchedulePairing {
  player1: string; // ObjectId string
  player2: string;
}

export interface ScheduleRound {
  roundNumber: number;
  scheduledDate: Date;
  matches: SchedulePairing[];
}

export type RoundRobinSchedule = ScheduleRound[];

export interface GroupAllocation {
  groupId: string;
  groupName: string;
  participants: string[];
}

// Knockout Configuration
export interface KnockoutConfig {
  allowCustomMatching: boolean; // Allow organizer to manually pair participants at each stage
  autoGenerateBracket: boolean; // Auto-generate bracket based on seeding
  thirdPlaceMatch: boolean; // Include 3rd place playoff match
  consolationBracket: boolean; // Include consolation bracket for losers
}

// Enhanced Bracket Match with more metadata
export interface BracketMatch {
  matchId?: string; // Assigned after creating IndividualMatch
  participant1: string | null;  // participant ID or null for BYE/TBD
  participant2: string | null;  // participant ID or null for BYE/TBD
  winner?: string | null; // Winner participant ID after match completion
  completed: boolean;
  
  // Position tracking
  bracketPosition: {
    round: number; // Round number (1 = Round of 16, 2 = Quarterfinals, etc.)
    matchNumber: number; // Match number within the round
    nextMatchNumber?: number; // Which match in next round winner advances to
  };
  
  // Source tracking for custom matching
  sourceMatches?: {
    match1?: string; // Previous match ID that feeds participant1
    match2?: string; // Previous match ID that feeds participant2
  };
  
  // Metadata
  scheduledDate?: Date;
  courtNumber?: number;
  roundName?: string; // "Round of 16", "Quarterfinals", "Semifinals", "Final", etc.
  isThirdPlaceMatch?: boolean;
}

// Bracket Round with enhanced metadata
export interface BracketRound {
  roundNumber: number;
  roundName: string; // "Round of 16", "Quarterfinals", "Semifinals", "Final"
  matches: BracketMatch[];
  completed: boolean;
  scheduledDate?: Date;
}

// Complete Knockout Bracket
export interface KnockoutBracket {
  size: number; // Total participants (should be power of 2, or handle byes)
  rounds: BracketRound[];
  currentRound: number; // Track which round is currently active
  completed: boolean;
  
  // Third place match (optional)
  thirdPlaceMatch?: BracketMatch;
}

// Helper type for bracket generation
export interface BracketNode {
  participantId: string | null;
  seedNumber?: number;
  isBye: boolean;
}
