// services/tournament/core/standings/index.ts

/**
 * Standings Module
 * 
 * Clean, modular architecture for calculating tournament standings.
 * 
 * Architecture:
 * - ParticipantNormalizer: Abstracts participant identity (player vs team)
 * - SinglesStandingsService: Calculates standings for singles tournaments
 * - DoublesStandingsService: Calculates standings for doubles tournaments
 * - StandingsCalculator: Factory that routes to appropriate service
 * 
 * Key Principles:
 * - Strict separation of concerns (singles vs doubles)
 * - Canonical team identity (order-independent for doubles)
 * - No shared logic that assumes "1 player per side" for doubles
 * - Deterministic and idempotent calculations
 */

export type { IParticipantNormalizer } from "./participantNormalizer";
export { SinglesParticipantNormalizer, DoublesParticipantNormalizer } from "./participantNormalizer";
export type { IStandingsService } from "./standingsService.interface";
export { SinglesStandingsService } from "./singlesStandingsService";
export { DoublesStandingsService } from "./doublesStandingsService";
export { StandingsCalculator, calculateStandings } from "./standingsCalculator";
export { sortStandingsWithTiebreakers } from "./standingsSorting";

