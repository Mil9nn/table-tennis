// services/tournament/core/standings/standingsCalculator.ts

import { MatchResult, StandingData, TournamentRules } from "../../types/tournament.types";
import { IStandingsService } from "./standingsService.interface";
import { SinglesStandingsService } from "./singlesStandingsService";
import { DoublesStandingsService } from "./doublesStandingsService";

/**
 * Standings Calculator Factory
 * 
 * Factory pattern to create the appropriate standings service based on tournament type.
 * Provides a clean interface for calculating standings without exposing implementation details.
 */
export class StandingsCalculator {
  private service: IStandingsService;

  /**
   * Create a StandingsCalculator for the given tournament type
   * 
   * @param matchType - "singles" or "doubles"
   * @param doublesPairs - Optional array of doubles pairs (required for doubles tournaments)
   */
  constructor(
    matchType: "singles" | "doubles",
    doublesPairs?: Array<{ _id: string | any; player1: string | any; player2: string | any }>
  ) {
    if (matchType === "singles") {
      this.service = new SinglesStandingsService();
    } else {
      // doubles
      this.service = new DoublesStandingsService(doublesPairs);
    }
  }

  /**
   * Calculate standings for a set of participants and matches
   * 
   * @param participants - Array of participant IDs
   * @param matches - Array of completed matches
   * @param rules - Tournament rules for point allocation
   * @returns Sorted array of standings with ranks
   */
  calculateStandings(
    participants: string[],
    matches: MatchResult[],
    rules: TournamentRules
  ): StandingData[] {
    return this.service.calculateStandings(participants, matches, rules);
  }

  /**
   * Get the participant normalizer for this calculator
   */
  getNormalizer() {
    return this.service.getNormalizer();
  }

  /**
   * Static factory method for convenience
   */
  static create(
    matchType: "singles" | "doubles",
    doublesPairs?: Array<{ _id: string | any; player1: string | any; player2: string | any }>
  ): StandingsCalculator {
    return new StandingsCalculator(matchType, doublesPairs);
  }
}

/**
 * Convenience function for calculating standings
 * 
 * @param matchType - "singles" or "doubles"
 * @param participants - Array of participant IDs
 * @param matches - Array of completed matches
 * @param rules - Tournament rules for point allocation
 * @param doublesPairs - Optional array of doubles pairs (required for doubles tournaments)
 * @returns Sorted array of standings with ranks
 */
export function calculateStandings(
  matchType: "singles" | "doubles",
  participants: string[],
  matches: MatchResult[],
  rules: TournamentRules,
  doublesPairs?: Array<{ _id: string | any; player1: string | any; player2: string | any }>
): StandingData[] {
  const calculator = StandingsCalculator.create(matchType, doublesPairs);
  return calculator.calculateStandings(participants, matches, rules);
}

