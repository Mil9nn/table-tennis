/**
 * Phase Management Service
 *
 * Manages the lifecycle and phase transitions for hybrid (round-robin -> knockout) tournaments.
 * This service handles:
 * - Phase initialization
 * - Phase completion checks
 * - Phase transition logic
 * - State management across phases
 */

import mongoose from "mongoose";
import { ITournament } from "@/models/Tournament";
import { Tournament } from "@/services/tournament/repositories/TournamentRepository";

export type TournamentPhase = "round_robin" | "knockout" | "transition";

/**
 * Initialize a hybrid tournament with round-robin phase
 */
export function initializeHybridTournament(tournament: Tournament): void {
  if (tournament.format !== "hybrid") {
    throw new Error("Tournament must be hybrid format");
  }

  if (!tournament.hybridConfig) {
    throw new Error("Hybrid configuration is required");
  }

  // Set initial phase to round-robin
  tournament.currentPhase = "round_robin";

  // Initialize groups if configured
  if (tournament.hybridConfig.roundRobinUseGroups) {
    tournament.useGroups = true;
    tournament.numberOfGroups = tournament.hybridConfig.roundRobinNumberOfGroups;
  }
}

/**
 * Check if round-robin phase is complete
 */
export function isRoundRobinPhaseComplete(tournament: Tournament): boolean {
  if (tournament.format !== "hybrid" || tournament.currentPhase !== "round_robin") {
    return false;
  }

  // Determine if tournament uses groups
  // For hybrid tournaments, check both useGroups and hybridConfig.roundRobinUseGroups
  const usesGroups =
    tournament.useGroups ||
    (tournament.format === "hybrid" &&
      tournament.hybridConfig?.roundRobinUseGroups);

  // Check if using groups
  if (usesGroups && tournament.groups && tournament.groups.length > 0) {
    // All groups must have all rounds completed
    // Also verify that groups have rounds and matches
    return tournament.groups.every((group) => {
      if (!group || !group.rounds || group.rounds.length === 0) {
        return false; // Group has no rounds
      }
      
      // All rounds in the group must be completed
      return group.rounds.every((round: any) => {
        // Round must exist, have matches, and be marked as completed
        if (!round) return false;
        if (!round.matches || round.matches.length === 0) {
          return false; // Round has no matches
        }
        // Check if round is explicitly marked as completed
        return round.completed === true;
      });
    });
  }

  // Check if all rounds are completed (non-grouped)
  if (tournament.rounds && tournament.rounds.length > 0) {
    return tournament.rounds.every((round: any) => {
      if (!round) return false;
      if (!round.matches || round.matches.length === 0) {
        return false; // Round has no matches
      }
      // Check if round is explicitly marked as completed
      return round.completed === true;
    });
  }

  return false;
}

/**
 * Check if knockout phase is complete
 */
export function isKnockoutPhaseComplete(tournament: Tournament): boolean {
  if (tournament.format !== "hybrid" || tournament.currentPhase !== "knockout") {
    return false;
  }

  // Check if bracket exists and is completed
  if (tournament.bracket) {
    return tournament.bracket.completed === true;
  }

  return false;
}

/**
 * Check if tournament can transition to knockout phase
 */
export function canTransitionToKnockout(tournament: Tournament): {
  canTransition: boolean;
  reason?: string;
} {
  if (tournament.format !== "hybrid") {
    return { canTransition: false, reason: "Tournament is not hybrid format" };
  }

  if (tournament.currentPhase !== "round_robin") {
    return {
      canTransition: false,
      reason: `Tournament is in ${tournament.currentPhase} phase`,
    };
  }

  // Determine if tournament uses groups
  const usesGroups =
    tournament.useGroups ||
    (tournament.format === "hybrid" &&
      tournament.hybridConfig?.roundRobinUseGroups);

  // Defensive check: if groups are expected, ensure they exist and are properly structured
  if (usesGroups) {
    if (!tournament.groups || tournament.groups.length === 0) {
      return {
        canTransition: false,
        reason: "Tournament is configured to use groups but no groups exist",
      };
    }

    // Validate that all groups have rounds
    const groupsWithoutRounds = tournament.groups.filter(
      (group) => !group.rounds || group.rounds.length === 0
    );
    if (groupsWithoutRounds.length > 0) {
      return {
        canTransition: false,
        reason: `Some groups are missing rounds (${groupsWithoutRounds.length} group(s) affected)`,
      };
    }

    // Validate that all groups have at least some matches
    const groupsWithoutMatches = tournament.groups.filter((group) => {
      const hasMatches = group.rounds.some(
        (round: any) => round.matches && round.matches.length > 0
      );
      return !hasMatches;
    });
    if (groupsWithoutMatches.length > 0) {
      return {
        canTransition: false,
        reason: `Some groups have no matches (${groupsWithoutMatches.length} group(s) affected)`,
      };
    }
  }

  if (!isRoundRobinPhaseComplete(tournament)) {
    return {
      canTransition: false,
      reason: "Round-robin phase is not complete",
    };
  }

  // For group tournaments, check if all groups have standings
  if (usesGroups && tournament.groups) {
    const groupsWithoutStandings = tournament.groups.filter(
      (group) => !group.standings || !Array.isArray(group.standings) || group.standings.length === 0
    );
    if (groupsWithoutStandings.length > 0) {
      return {
        canTransition: false,
        reason: `Standings have not been calculated for ${groupsWithoutStandings.length} group(s)`,
      };
    }
  } else {
    // For non-group tournaments, check overall standings
    if (!tournament.standings || tournament.standings.length === 0) {
      return {
        canTransition: false,
        reason: "Standings have not been calculated",
      };
    }
  }

  return { canTransition: true };
}

/**
 * Mark tournament as transitioning to knockout phase
 */
export function markTransitionPhase(tournament: Tournament): void {
  if (tournament.format !== "hybrid") {
    throw new Error("Tournament must be hybrid format");
  }

  tournament.currentPhase = "transition";
  tournament.phaseTransitionDate = new Date();
}

/**
 * Complete transition to knockout phase
 */
export function completeTransitionToKnockout(tournament: Tournament): void {
  if (tournament.format !== "hybrid") {
    throw new Error("Tournament must be hybrid format");
  }

  if (tournament.currentPhase !== "transition") {
    throw new Error("Tournament must be in transition phase");
  }

  tournament.currentPhase = "knockout";
}

/**
 * Get current phase information
 */
export function getPhaseInfo(tournament: Tournament): {
  currentPhase: TournamentPhase | null;
  roundRobinComplete: boolean;
  knockoutComplete: boolean;
  canTransition: boolean;
  qualifiedCount: number;
} {
  if (tournament.format !== "hybrid") {
    return {
      currentPhase: null,
      roundRobinComplete: false,
      knockoutComplete: false,
      canTransition: false,
      qualifiedCount: 0,
    };
  }

  const currentPhase = tournament.currentPhase || "round_robin";
  const roundRobinComplete = isRoundRobinPhaseComplete(tournament);
  const knockoutComplete = isKnockoutPhaseComplete(tournament);
  const { canTransition } = canTransitionToKnockout(tournament);
  const qualifiedCount = tournament.qualifiedParticipants?.length || 0;

  return {
    currentPhase,
    roundRobinComplete,
    knockoutComplete,
    canTransition,
    qualifiedCount,
  };
}

/**
 * Validate hybrid configuration
 */
export function validateHybridConfig(tournament: Tournament): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (tournament.format !== "hybrid") {
    errors.push("Tournament must be hybrid format");
    return { isValid: false, errors };
  }

  if (!tournament.hybridConfig) {
    errors.push("Hybrid configuration is required");
    return { isValid: false, errors };
  }

  const config = tournament.hybridConfig;

  // Validate qualification method
  if (!config.qualificationMethod) {
    errors.push("Qualification method is required");
  }

  // Validate qualification parameters based on method
  switch (config.qualificationMethod) {
    case "top_n_per_group":
      if (!config.roundRobinUseGroups) {
        errors.push("Groups must be enabled for top_n_per_group qualification");
      }
      if (!config.qualifyingPerGroup || config.qualifyingPerGroup < 1) {
        errors.push("Qualifying per group must be at least 1");
      }
      break;
  }

  // Validate group configuration
  if (config.roundRobinUseGroups) {
    if (
      !config.roundRobinNumberOfGroups ||
      config.roundRobinNumberOfGroups < 2
    ) {
      errors.push("Number of groups must be at least 2");
    }
    if (
      config.roundRobinNumberOfGroups &&
      tournament.participants &&
      config.roundRobinNumberOfGroups >= tournament.participants.length
    ) {
      errors.push("Number of groups must be less than total participants");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Reset tournament to round-robin phase (for testing or re-runs)
 */
export function resetToRoundRobinPhase(tournament: Tournament): void {
  if (tournament.format !== "hybrid") {
    throw new Error("Tournament must be hybrid format");
  }

  // Clear phase tracking
  tournament.currentPhase = "round_robin";
  tournament.phaseTransitionDate = undefined;
  tournament.qualifiedParticipants = [];

  // Clear knockout data
  tournament.bracket = undefined;

  // Keep round-robin data intact (rounds, standings, groups)
  // This allows re-running the transition with different parameters
}
