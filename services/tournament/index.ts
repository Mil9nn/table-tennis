// services/tournament/index.ts

/**
 * Tournament Services - Centralized Exports
 * Import from this file for convenient access to all tournament services
 */

// Core Services
export {
  generateTournamentDraw,
  getMatchParticipants,
  createScheduledMatch,
  initializeStandings,
  prepareSeeding,
} from "./core/matchGenerationService";

export {
  generateDetailedLeaderboard,
  type DetailedPlayerStats,
  type MatchHistoryEntry,
  type HeadToHeadRecord,
} from "./core/statisticsService";

export {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
  validateScheduleCompleteness,
} from "./core/schedulingService";

export {
  calculateStandings,
  calculateGroupStandings,
  getHeadToHeadRecord,
} from "./core/standingsService";

export {
  generateRandomSeeding,
  generateRankingBasedSeeding,
  generatePointsBasedSeeding,
  generateRegistrationOrderSeeding,
  validateSeeding,
  seedingToMap,
  getParticipantBySeed,
  getSeedByParticipant,
} from "./core/seedingService";

// Hybrid Format Services
export {
  generateHybridRoundRobinPhase,
  transitionToKnockoutPhase,
  generateCompleteHybridTournament,
  getHybridTournamentStatus,
  type HybridGenerationOptions,
  type HybridGenerationResult,
} from "./core/hybridMatchGenerationService";

export {
  initializeHybridTournament,
  isRoundRobinPhaseComplete,
  isKnockoutPhaseComplete,
  canTransitionToKnockout,
  markTransitionPhase,
  completeTransitionToKnockout,
  getPhaseInfo,
  validateHybridConfig,
  resetToRoundRobinPhase,
  type TournamentPhase,
} from "./core/phaseManagementService";

export {
  determineQualifiedParticipants,
  applyQualificationResults,
  isParticipantQualified,
  getQualificationSummary,
  validateQualificationConfig,
  type QualificationResult,
} from "./core/qualificationService";

// Validators
export {
  TournamentValidators,
  handleValidationResult,
  type ValidationResult,
} from "./validators/tournamentValidators";

// Utils
export {
  allocateGroups,
  calculateOptimalGroupCount,
  validateGroupConfiguration,
} from "./utils/groupAllocator";

export {
  calculateWinRate,
  calculatePointsPerMatch,
  calculateSetsWinRate,
  calculateStreak,
  calculateLongestWinStreak,
  calculateDominanceRating,
  calculateAvgPointsScored,
  calculateAvgPointsConceded,
  calculateAvgSetDifferential,
  calculateSetsRatio,
  calculatePointsRatio,
  formatWinRate,
  formatStreak,
  getStreakDisplayData,
  calculateTournamentProgress as calculateProgressPercentage,
} from "./utils/tournamentCalculations";

export {
  generateUniqueJoinCode,
  isValidJoinCodeFormat,
  generateMatchIdentifier,
  generateGroupIdentifier,
} from "./utils/codeGenerator";

export {
  areAllRoundsCompleted,
  getTournamentProgress,
  calculateTournamentProgress,
  getRoundCompletionStatus,
  estimateTournamentDuration,
  estimateTournamentEndDate,
  calculateMatchesPerRound,
  calculateTotalRounds,
  calculateTotalMatches,
  isTournamentCompleted,
  isTournamentStarted,
  getNextMatch,
  getInProgressMatches,
  getCompletedMatchesCount,
  calculateTournamentStatus,
} from "./utils/progressHelpers";

// Update Service
export {
  fetchMatches,
  getAllMatchIds,
  getTournamentStatus,
  updateTournamentAfterMatch,
  updateRoundRobinStandings,
} from "./tournamentUpdateService";

// Types
export type {
  MatchPairing,
  RoundSchedule,
  GroupAllocation,
  MatchResult,
  StandingData,
  TournamentRules,
  SeedingInfo,
  TournamentProgress,
  RoundCompletionStatus,
} from "./types/tournament.types";
