/**
 * Hybrid Match Generation Service
 *
 * Orchestrates match generation for hybrid (round-robin -> knockout) tournaments.
 * This service coordinates:
 * - Round-robin phase match generation
 * - Phase transition
 * - Knockout phase match generation based on qualified participants
 */

import mongoose from "mongoose";
import { ITournament } from "@/models/Tournament";
import {
  initializeHybridTournament,
  markTransitionPhase,
  completeTransitionToKnockout,
  canTransitionToKnockout,
  validateHybridConfig,
} from "./phaseManagementService";
import {
  determineQualifiedParticipants,
  applyQualificationResults,
  validateQualificationConfig,
} from "./qualificationService";
import {
  generateSingleRoundRobinMatches,
  generateGroupMatches,
  generateKnockoutMatches,
} from "./matchGenerationService";

export interface HybridGenerationOptions {
  scorerId: mongoose.Types.ObjectId;
  courtsAvailable?: number;
  matchDuration?: number;
  startDate?: Date;
}

export interface HybridGenerationResult {
  success: boolean;
  phase: "round_robin" | "knockout";
  matchesCreated: number;
  groupsCreated?: number;
  message: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Generate round-robin phase matches for hybrid tournament
 */
export async function generateHybridRoundRobinPhase(
  tournament: ITournament,
  options: HybridGenerationOptions
): Promise<HybridGenerationResult> {
  // Validate hybrid configuration
  const configValidation = validateHybridConfig(tournament);
  if (!configValidation.isValid) {
    return {
      success: false,
      phase: "round_robin",
      matchesCreated: 0,
      message: "Invalid hybrid configuration",
      errors: configValidation.errors,
    };
  }

  // Initialize hybrid tournament
  initializeHybridTournament(tournament);

  // Generate matches based on group configuration
  const hybridConfig = tournament.hybridConfig!;

  if (hybridConfig.roundRobinUseGroups) {
    // Generate group-based round-robin
    await generateGroupMatches(
      tournament,
      tournament.participants.map((p) => p.toString()),
      tournament.seeding || [],
      options.scorerId.toString(),
      {
        courtsAvailable: options.courtsAvailable,
        matchDuration: options.matchDuration,
      }
    );

    // Count matches created
    const matchCount = tournament.groups?.reduce(
      (total, group) =>
        total + group.rounds.reduce((sum, round) => sum + round.matches.length, 0),
      0
    ) || 0;

    return {
      success: true,
      phase: "round_robin",
      matchesCreated: matchCount,
      groupsCreated: tournament.groups?.length || 0,
      message: `Round-robin phase created with ${tournament.groups?.length || 0} groups and ${matchCount} matches`,
      warnings: configValidation.errors.length > 0 ? configValidation.errors : undefined,
    };
  } else {
    // Generate single group round-robin
    await generateSingleRoundRobinMatches(
      tournament,
      tournament.participants.map((p) => p.toString()),
      tournament.seeding || [],
      options.scorerId.toString(),
      {
        courtsAvailable: options.courtsAvailable,
        matchDuration: options.matchDuration,
      }
    );

    // Count matches created
    const matchCount = tournament.rounds.reduce(
      (total, round) => total + round.matches.length,
      0
    );

    return {
      success: true,
      phase: "round_robin",
      matchesCreated: matchCount,
      message: `Round-robin phase created with ${matchCount} matches`,
      warnings: configValidation.errors.length > 0 ? configValidation.errors : undefined,
    };
  }
}

/**
 * Transition tournament from round-robin to knockout phase
 */
export async function transitionToKnockoutPhase(
  tournament: ITournament,
  options: HybridGenerationOptions
): Promise<HybridGenerationResult> {
  // Validate transition is possible
  const transitionCheck = canTransitionToKnockout(tournament);
  if (!transitionCheck.canTransition) {
    return {
      success: false,
      phase: "round_robin",
      matchesCreated: 0,
      message: "Cannot transition to knockout phase",
      errors: [transitionCheck.reason || "Unknown error"],
    };
  }

  // Validate qualification configuration
  const qualificationValidation = validateQualificationConfig(tournament);
  if (!qualificationValidation.isValid) {
    return {
      success: false,
      phase: "round_robin",
      matchesCreated: 0,
      message: "Invalid qualification configuration",
      errors: qualificationValidation.errors,
    };
  }

  // Mark tournament as transitioning
  markTransitionPhase(tournament);

  // Determine qualified participants
  const qualificationResult = determineQualifiedParticipants(tournament);

  // Apply qualification results
  applyQualificationResults(tournament, qualificationResult);

  // Save tournament with qualification data
  await tournament.save();

  // Generate knockout bracket with qualified participants
  const hybridConfig = tournament.hybridConfig!;

  // Configure knockout settings
  tournament.knockoutConfig = {
    allowCustomMatching: hybridConfig.knockoutAllowCustomMatching,
    autoGenerateBracket: true,
    thirdPlaceMatch: hybridConfig.knockoutThirdPlaceMatch,
    consolationBracket: false,
  };

  // Generate knockout matches
  await generateKnockoutMatches(
    tournament,
    tournament.qualifiedParticipants!.map((p) => p.toString()),
    // Re-seed based on round-robin standings
    tournament.qualifiedParticipants!.map((p, index) => ({
      participant: p,
      seedNumber: index + 1,
    })),
    options.scorerId.toString(),
    {
      courtsAvailable: options.courtsAvailable,
      matchDuration: options.matchDuration,
    }
  );

  // Count knockout matches created
  const knockoutMatchCount = tournament.bracket?.rounds.reduce(
    (total: number, round: any) => total + round.matches.length,
    0
  ) || 0;

  // Complete transition
  completeTransitionToKnockout(tournament);

  return {
    success: true,
    phase: "knockout",
    matchesCreated: knockoutMatchCount,
    message: `Knockout phase created with ${qualificationResult.qualifiedCount} qualified participants and ${knockoutMatchCount} matches`,
    warnings: qualificationValidation.warnings.length > 0
      ? qualificationValidation.warnings
      : undefined,
  };
}

/**
 * Generate complete hybrid tournament (both phases at once)
 * Note: This creates round-robin matches only. Knockout phase must be generated
 * after round-robin is complete and standings are calculated.
 */
export async function generateCompleteHybridTournament(
  tournament: ITournament,
  options: HybridGenerationOptions
): Promise<HybridGenerationResult> {
  // Only generate round-robin phase initially
  const roundRobinResult = await generateHybridRoundRobinPhase(tournament, options);

  if (!roundRobinResult.success) {
    return roundRobinResult;
  }

  // Return with instructions for next step
  return {
    ...roundRobinResult,
    message:
      roundRobinResult.message +
      ". Complete round-robin matches and calculate standings before transitioning to knockout phase.",
  };
}

/**
 * Get hybrid tournament status
 */
export function getHybridTournamentStatus(tournament: ITournament): {
  format: string;
  currentPhase: string | null;
  roundRobinComplete: boolean;
  knockoutComplete: boolean;
  canTransition: boolean;
  qualifiedCount: number;
  totalParticipants: number;
  nextAction: string;
} {
  if (tournament.format !== "hybrid") {
    return {
      format: tournament.format,
      currentPhase: null,
      roundRobinComplete: false,
      knockoutComplete: false,
      canTransition: false,
      qualifiedCount: 0,
      totalParticipants: tournament.participants.length,
      nextAction: "Not a hybrid tournament",
    };
  }

  const currentPhase = tournament.currentPhase || "round_robin";
  const qualifiedCount = tournament.qualifiedParticipants?.length || 0;
  const transitionCheck = canTransitionToKnockout(tournament);

  let nextAction = "";
  if (currentPhase === "round_robin") {
    if (transitionCheck.canTransition) {
      nextAction = "Ready to transition to knockout phase";
    } else {
      nextAction = "Complete round-robin matches";
    }
  } else if (currentPhase === "knockout") {
    nextAction = "Complete knockout matches";
  } else if (currentPhase === "transition") {
    nextAction = "Transition in progress";
  }

  return {
    format: tournament.format,
    currentPhase,
    roundRobinComplete: transitionCheck.canTransition,
    knockoutComplete: tournament.bracket?.completed || false,
    canTransition: transitionCheck.canTransition,
    qualifiedCount,
    totalParticipants: tournament.participants.length,
    nextAction,
  };
}
