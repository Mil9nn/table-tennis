// services/tournament/core/standings/standingsService.interface.ts

import { MatchResult, StandingData, TournamentRules } from "../../types/tournament.types";
import { IParticipantNormalizer } from "./participantNormalizer";

/**
 * Standings Service Interface
 * 
 * Defines the contract for calculating standings.
 * Each implementation handles a specific tournament type (singles/doubles).
 */
export interface IStandingsService {
  /**
   * Calculate standings for a set of participants and matches
   * 
   * @param participants - Array of participant IDs (normalized)
   * @param matches - Array of completed matches
   * @param rules - Tournament rules for point allocation
   * @returns Sorted array of standings with ranks
   */
  calculateStandings(
    participants: string[],
    matches: MatchResult[],
    rules: TournamentRules
  ): StandingData[];

  /**
   * Get the participant normalizer for this service
   */
  getNormalizer(): IParticipantNormalizer;
}

