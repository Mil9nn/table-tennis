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
import { Tournament } from "@/services/tournament/repositories/TournamentRepository";
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
  session?: mongoose.ClientSession;
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
  tournament: Tournament,
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
    // Determine participant IDs to use for group allocation
    // For doubles tournaments, use pair IDs instead of individual player IDs
    const isDoubles = (tournament as any).matchType === "doubles";
    let participantIdsForAllocation: string[] = tournament.participants.map((p) => p.toString());
    
    // Log initial state
    console.log(`[hybridMatchGeneration] Starting group allocation - isDoubles: ${isDoubles}, initial participants: ${participantIdsForAllocation.length}`);
    
    if (isDoubles) {
      const doublesPairs = (tournament as any).doublesPairs || [];
      
      // Validate that pairs exist for doubles tournaments
      if (doublesPairs.length === 0) {
        return {
          success: false,
          phase: "round_robin",
          matchesCreated: 0,
          message: "Cannot generate groups for doubles tournament",
          errors: [
            "Doubles pairs must be configured before generating groups. Please create doubles pairs first."
          ],
        };
      }
      
      console.log(`[hybridMatchGeneration] Doubles tournament detected - ${doublesPairs.length} pairs in database, ${tournament.participants.length} players`);
      
      // CRITICAL: Deduplicate pairs by canonical player combination
      // This is the ROOT FIX - ensures we only use unique pairs even if duplicates exist in DB
      const uniquePairsMap = new Map<string, { pairId: string; pair: any }>(); // Map: canonicalKey -> {pairId, pair}
      
      for (const pair of doublesPairs) {
        if (!pair || !pair._id) {
          console.warn(`[hybridMatchGeneration] Skipping invalid pair (missing _id)`);
          continue;
        }
        
        const pairId = pair._id.toString();
        const player1Id = pair.player1?.toString() || '';
        const player2Id = pair.player2?.toString() || '';
        
        if (!player1Id || !player2Id) {
          console.warn(`[hybridMatchGeneration] Skipping invalid pair (missing players): ${pairId}`);
          continue;
        }
        
        // Create canonical key (order-independent player combination)
        const canonicalKey = player1Id < player2Id 
          ? `${player1Id}:${player2Id}` 
          : `${player2Id}:${player1Id}`;
        
        // Only keep the first occurrence of each canonical pair
        if (!uniquePairsMap.has(canonicalKey)) {
          uniquePairsMap.set(canonicalKey, { pairId, pair });
        } else {
          const existing = uniquePairsMap.get(canonicalKey);
          console.warn(`[hybridMatchGeneration] Duplicate pair detected: players ${canonicalKey}. Existing ID: ${existing?.pairId}, Duplicate ID: ${pairId}. Keeping first occurrence.`);
        }
      }
      
      const uniquePairIds = Array.from(uniquePairsMap.values()).map(p => p.pairId);
      
      // CRITICAL VALIDATION: Ensure we have exactly the expected number of pairs
      const expectedPairs = tournament.participants.length / 2;
      console.log(`[hybridMatchGeneration] Pair validation - Expected: ${expectedPairs} pairs, Found: ${uniquePairIds.length} unique pairs`);
      
      if (uniquePairIds.length !== expectedPairs) {
        return {
          success: false,
          phase: "round_robin",
          matchesCreated: 0,
          message: "Invalid pairs configuration",
          errors: [
            `Expected ${expectedPairs} unique pairs for ${tournament.participants.length} participants, but found ${uniquePairIds.length} after deduplication. ` +
            `Original doublesPairs array had ${doublesPairs.length} entries. ` +
            `This suggests duplicate pairs exist in the database. Please reconfigure pairs.`
          ],
        };
      }
      
      if (uniquePairIds.length === 0) {
        return {
          success: false,
          phase: "round_robin",
          matchesCreated: 0,
          message: "Cannot generate groups for doubles tournament",
          errors: [
            "No valid doubles pairs found. Please reconfigure pairs."
          ],
        };
      }
      
      // Use deduplicated pair IDs
      participantIdsForAllocation = uniquePairIds;
      
      console.log(`[hybridMatchGeneration] Using ${participantIdsForAllocation.length} pair IDs for group allocation (converted from ${tournament.participants.length} player IDs)`);
      
      if (doublesPairs.length !== uniquePairIds.length) {
        console.warn(`[hybridMatchGeneration] Deduplication removed ${doublesPairs.length - uniquePairIds.length} duplicate pairs from database`);
      }
    }
    
    // Generate group-based round-robin
    await generateGroupMatches(
      tournament,
      participantIdsForAllocation,
      tournament.seeding || [],
      options.scorerId.toString(),
      {
        courtsAvailable: options.courtsAvailable,
        matchDuration: options.matchDuration,
      }
    );

    // Save tournament with groups data
    if (options.session) {
      await tournament.save({ session: options.session });
    } else {
      await tournament.save();
    }

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
    // Generate single group round-robin (no groups)
    // For doubles, validate pairs exist and use pair IDs
    const isDoubles = (tournament as any).matchType === "doubles";
    let participantIdsForAllocation: string[] = tournament.participants.map((p) => p.toString());
    
    if (isDoubles) {
      const doublesPairs = (tournament as any).doublesPairs || [];
      
      // Validate that pairs exist for doubles tournaments
      if (doublesPairs.length === 0) {
        return {
          success: false,
          phase: "round_robin",
          matchesCreated: 0,
          message: "Cannot generate matches for doubles tournament",
          errors: [
            "Doubles pairs must be configured before generating matches. Please create doubles pairs first."
          ],
        };
      }
      
      // Use pair IDs instead of individual player IDs
      const pairIds = doublesPairs
        .filter((pair: any) => pair != null && pair._id != null)
        .map((pair: any) => pair._id.toString());
      
      if (pairIds.length === 0) {
        return {
          success: false,
          phase: "round_robin",
          matchesCreated: 0,
          message: "Cannot generate matches for doubles tournament",
          errors: [
            "No valid doubles pairs found. Please reconfigure pairs."
          ],
        };
      }
      
      // Deduplicate pair IDs
      participantIdsForAllocation = Array.from(new Set(pairIds));
    }
    
    // Generate single group round-robin
    await generateSingleRoundRobinMatches(
      tournament,
      participantIdsForAllocation,
      tournament.seeding || [],
      options.scorerId.toString(),
      {
        courtsAvailable: options.courtsAvailable,
        matchDuration: options.matchDuration,
      }
    );

    // Save tournament with rounds data
    if (options.session) {
      await tournament.save({ session: options.session });
    } else {
      await tournament.save();
    }

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
  tournament: Tournament,
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

  // Additional validation: Verify all round-robin matches are actually completed
  const { getAllMatchIds, fetchMatches } = await import("../tournamentUpdateService");
  const roundRobinMatchIds = getAllMatchIds(tournament);
  
  if (roundRobinMatchIds.length > 0) {
    const roundRobinMatches = await fetchMatches(roundRobinMatchIds, true);
    const incompleteMatches = roundRobinMatches.filter((m: any) => m && m.status !== "completed");
    
    if (incompleteMatches.length > 0) {
      return {
        success: false,
        phase: "round_robin",
        matchesCreated: 0,
        message: "Cannot transition to knockout phase",
        errors: [
          `${incompleteMatches.length} round-robin match(es) are not yet completed. All matches must be completed before transitioning.`
        ],
      };
    }
  }

  // Validate standings are calculated and up-to-date
  if (!tournament.standings || tournament.standings.length === 0) {
    return {
      success: false,
      phase: "round_robin",
      matchesCreated: 0,
      message: "Cannot transition to knockout phase",
      errors: ["Standings must be calculated before transitioning. Please ensure all match results are recorded."],
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

  // Validate that qualification will result in at least 2 qualified participants
  if (qualificationResult.qualifiedCount < 2) {
    return {
      success: false,
      phase: "round_robin",
      matchesCreated: 0,
      message: "Cannot transition to knockout phase",
      errors: [
        `Only ${qualificationResult.qualifiedCount} participant(s) would qualify, but at least 2 participants are required for knockout phase.`
      ],
    };
  }

  // Apply qualification results
  applyQualificationResults(tournament, qualificationResult);

  // Save tournament with qualification data
  if (options.session) {
    await tournament.save({ session: options.session });
  } else {
    await tournament.save();
  }

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

  // Save tournament with bracket and knockout phase data
  if (options.session) {
    await tournament.save({ session: options.session });
  } else {
    await tournament.save();
  }

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
  tournament: Tournament,
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
export function getHybridTournamentStatus(tournament: Tournament): {
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
