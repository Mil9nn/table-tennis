// services/tournament/types/tournament.types.ts

/**
 * Shared type definitions for tournament services
 * All tournament-related interfaces and types should be defined here
 */

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

export interface MatchPairing {
  player1: string;
  player2: string;
  table?: number;
  scheduledTime?: Date;
}

export interface RoundSchedule {
  roundNumber: number;
  matches: MatchPairing[];
  scheduledDate?: Date;
}

// ============================================================================
// GROUP/POOL TYPES
// ============================================================================

export interface GroupAllocation {
  groupId: string;
  groupName: string;
  participants: string[];
}

// ============================================================================
// STANDINGS TYPES
// ============================================================================

export interface MatchResult {
  _id: string;
  participants: string[];
  winnerId?: string | null;
  winnerSide?: "side1" | "side2" | null;
  finalScore: {
    setsById?: Record<string, number>;
    side1Sets?: number;
    side2Sets?: number;
  };
  games: Array<{
    scoresById?: Record<string, number>;
    side1Score?: number;
    side2Score?: number;
  }>;
  status: string;
}

export interface StandingData {
  // Transitional support: some layers still use `participant`,
  // new projection layers may use `participantId`.
  participant: string;
  participantId?: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  points: number;
  rank: number;
  form: string[];
  headToHead: Map<string, number>;
}

export interface TournamentRules {
  pointsForWin: number;
  pointsForLoss: number;
  pointsForDraw: number;
  tiebreakRules?: string[];
  setsPerMatch?: number;
}

// ============================================================================
// SEEDING TYPES
// ============================================================================

export interface SeedingInfo {
  participant: string | any; // Allow mongoose ObjectId or string
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

// ============================================================================
// PROGRESS/STATUS TYPES
// ============================================================================

export interface TournamentProgress {
  totalMatches: number;
  completedMatches: number;
  inProgressMatches: number;
  scheduledMatches: number;
  percentComplete: number;
}

export interface RoundCompletionStatus {
  roundNumber: number;
  totalMatches: number;
  completedMatches: number;
  isCompleted: boolean;
}
