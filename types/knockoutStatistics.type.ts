// types/knockoutStatistics.type.ts

/**
 * Knockout Tournament Statistics Types
 *
 * These types define the structure for comprehensive tournament statistics
 * that are cached when a knockout tournament is completed.
 */

/**
 * Main statistics container for knockout tournaments
 */
export interface KnockoutStatistics {
  generatedAt: Date;
  generatedBy?: string; // User ID who triggered completion
  outcome: TournamentOutcome;
  participantProgression: ParticipantProgression[];
  participantStats: ParticipantStats[];
  performanceMetrics: PerformanceMetrics[];
}

/**
 * Tournament outcome - Champion, Runner-up, Third Place
 */
export interface TournamentOutcome {
  champion: Medalist;
  runnerUp: Medalist;
  thirdPlace?: Medalist; // Optional if no 3rd place match
  finalMatchScore: MatchScore;
  thirdPlaceMatchScore?: MatchScore;
}

/**
 * Medalist information (Champion, Runner-up, Third Place)
 */
export interface Medalist {
  participantId: string;
  participantName: string;
  seedNumber?: number;
}

/**
 * Match score with set breakdown
 */
export interface MatchScore {
  side1Sets: number;
  side2Sets: number;
  setsBreakdown: number[][]; // [[11, 9], [11, 7], [8, 11]]
}

/**
 * Participant progression through tournament
 */
export interface ParticipantProgression {
  participantId: string;
  participantName: string;
  seedNumber?: number;
  matchesPlayed: number;
  roundReached: string; // "Champion", "Runner-up", "Semi-finalist", "Quarter-finalist", "Round of 16", etc.
  eliminationRound?: string; // Round where they were eliminated
  eliminatedBy?: {
    participantId: string;
    participantName: string;
  };
}

/**
 * Win-Loss statistics for participants
 */
export interface ParticipantStats {
  participantId: string;
  participantName: string;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
}

/**
 * Performance metrics for participants
 */
export interface PerformanceMetrics {
  participantId: string;
  participantName: string;
  avgPointsPerSet: number;
  avgPointsConcededPerSet: number;
  biggestWin: MatchHighlight;
  closestMatch: MatchHighlight;
}

/**
 * Match highlight (biggest win, closest match, etc.)
 */
export interface MatchHighlight {
  opponentName: string;
  setScore: string; // "3-0", "3-2", etc.
  pointMargin?: number; // For biggest win
  deciderScore?: string; // "11-9" for closest match
  roundName: string;
}
