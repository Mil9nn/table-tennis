// services/tournament/core/bracketProgressionService.ts

import {
  KnockoutBracket,
  BracketRound,
  BracketMatch,
} from "@/types/tournamentDraw";
import BracketState, { IBracketState } from "@/models/BracketState";
import { ClientSession } from "mongoose";
import { TransactionManager } from "@/services/database/TransactionManager";
import { matchRepository } from "../repositories/MatchRepository";
import { tournamentRepository } from "../repositories/TournamentRepository";
import { isBracketCompleted } from "./bracketGenerationService";

/**
 * Bracket Progression Service
 * Handles match completion and winner advancement in knockout brackets
 * 
 * UPDATED: Now uses BracketState model and transactions for data integrity
 */

/**
 * Validation result interface
 */
export interface BracketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Advance winner to the next round
 * @param bracket - The knockout bracket
 * @param roundNumber - Current round number
 * @param matchNumber - Current match number
 * @param winnerId - ID of the winner
 * @returns Updated bracket
 */
export function advanceWinner(
  bracket: KnockoutBracket,
  roundNumber: number,
  matchNumber: number,
  winnerId: string
): KnockoutBracket {
  const currentRound = bracket.rounds.find((r) => r.roundNumber === roundNumber);

  if (!currentRound) {
    throw new Error(`Round ${roundNumber} not found in bracket`);
  }

  const currentMatch = currentRound.matches.find(
    (m) => m.bracketPosition.matchNumber === matchNumber
  );

  if (!currentMatch) {
    throw new Error(`Match ${matchNumber} not found in round ${roundNumber}`);
  }

  // Verify winner is a participant in this match
  if (
    winnerId !== currentMatch.participant1?.toString() &&
    winnerId !== currentMatch.participant2?.toString()
  ) {
    throw new Error(`Winner ${winnerId} is not a participant in this match`);
  }

  // Mark current match as completed
  currentMatch.winner = winnerId;
  currentMatch.completed = true;

  // If this is the final round, don't advance further
  if (roundNumber === bracket.rounds.length) {
    bracket.completed = true;
    return bracket;
  }

  // Find next round and match
  const nextRoundNumber = roundNumber + 1;
  const nextMatchNumber = currentMatch.bracketPosition.nextMatchNumber;

  if (!nextMatchNumber) {
    throw new Error(`No next match defined for round ${roundNumber} match ${matchNumber}`);
  }

  const nextRound = bracket.rounds.find((r) => r.roundNumber === nextRoundNumber);

  if (!nextRound) {
    throw new Error(`Next round ${nextRoundNumber} not found in bracket`);
  }

  const nextMatch = nextRound.matches.find(
    (m) => m.bracketPosition.matchNumber === nextMatchNumber
  );

  if (!nextMatch) {
    throw new Error(
      `Next match ${nextMatchNumber} not found in round ${nextRoundNumber}`
    );
  }

  // Determine which position in the next match (odd match numbers go to participant1)
  if (matchNumber % 2 === 1) {
    nextMatch.participant1 = winnerId;
  } else {
    nextMatch.participant2 = winnerId;
  }

  // Check if current round is complete
  currentRound.completed = currentRound.matches.every((m) => m.completed);

  // If current round is complete, advance to next round
  if (currentRound.completed) {
    bracket.currentRound = nextRoundNumber;
  }

  return bracket;
}

/**
 * Update bracket after a match completion (using BracketState and transactions)
 * @param tournamentId - Tournament ID
 * @param matchId - ID of the completed match
 * @param winnerId - ID of the winner
 * @returns Updated bracket state
 */
export async function updateBracketAfterMatchWithState(
  tournamentId: string,
  matchId: string,
  winnerId: string
): Promise<IBracketState> {
  const txManager = new TransactionManager();
  
  return txManager.executeInTransaction(async (session) => {
    // Load bracket state
    const bracketState = await BracketState.findOne({ tournament: tournamentId }).session(session);
    
    if (!bracketState) {
      throw new Error(`Bracket state not found for tournament ${tournamentId}`);
    }

    // Find the match in the bracket
    let foundMatch: BracketMatch | null = null;
    let foundRound: BracketRound | null = null;

    for (const round of bracketState.rounds) {
      const match = round.matches.find((m) => m.matchId === matchId);
      if (match) {
        foundMatch = match;
        foundRound = round;
        break;
      }
    }

    // Check third place match
    if (!foundMatch && bracketState.thirdPlaceMatch?.matchId === matchId) {
      foundMatch = bracketState.thirdPlaceMatch;
      foundMatch.winner = winnerId;
      foundMatch.completed = true;
      await bracketState.save({ session });
      return bracketState;
    }

    if (!foundMatch || !foundRound) {
      throw new Error(`Match ${matchId} not found in bracket`);
    }

    // Use advanceWinner to handle the progression
    advanceWinnerInState(
      bracketState,
      foundRound.roundNumber,
      foundMatch.bracketPosition.matchNumber,
      winnerId
    );

    // Auto-populate third place match if semi-finals just completed
    if (
      bracketState.thirdPlaceMatch &&
      foundRound.roundNumber === bracketState.rounds.length - 1 && // Semi-final round
      foundRound.completed // Round just completed
    ) {
      try {
        // Collect losers from semi-finals
        const semiFinalLosers: string[] = [];
        for (const match of foundRound.matches) {
          if (match.completed && match.winner) {
            const loser = getMatchLoser(match);
            if (loser) {
              semiFinalLosers.push(loser);
            }
          }
        }

        // Only update if we have exactly 2 losers
        if (semiFinalLosers.length === 2) {
          bracketState.thirdPlaceMatch.participant1 = semiFinalLosers[0];
          bracketState.thirdPlaceMatch.participant2 = semiFinalLosers[1];
        }
      } catch (error) {
        console.error("Failed to auto-populate third place match:", error);
      }
    }

    // Save bracket state (Mongoose auto-tracks changes)
    await bracketState.save({ session });
    
    return bracketState;
  });
}

/**
 * Advance winner in BracketState
 */
function advanceWinnerInState(
  bracketState: IBracketState,
  roundNumber: number,
  matchNumber: number,
  winnerId: string
): void {
  const currentRound = bracketState.rounds.find((r) => r.roundNumber === roundNumber);

  if (!currentRound) {
    throw new Error(`Round ${roundNumber} not found in bracket`);
  }

  const currentMatch = currentRound.matches.find(
    (m) => m.bracketPosition.matchNumber === matchNumber
  );

  if (!currentMatch) {
    throw new Error(`Match ${matchNumber} not found in round ${roundNumber}`);
  }

  // Verify winner is a participant in this match
  if (
    winnerId !== currentMatch.participant1?.toString() &&
    winnerId !== currentMatch.participant2?.toString()
  ) {
    throw new Error(`Winner ${winnerId} is not a participant in this match`);
  }

  // Mark current match as completed
  currentMatch.winner = winnerId;
  currentMatch.completed = true;

  // If this is the final round, don't advance further
  if (roundNumber === bracketState.rounds.length) {
    bracketState.completed = true;
    return;
  }

  // Find next round and match
  const nextRoundNumber = roundNumber + 1;
  const nextMatchNumber = currentMatch.bracketPosition.nextMatchNumber;

  if (!nextMatchNumber) {
    throw new Error(`No next match defined for round ${roundNumber} match ${matchNumber}`);
  }

  const nextRound = bracketState.rounds.find((r) => r.roundNumber === nextRoundNumber);

  if (!nextRound) {
    throw new Error(`Next round ${nextRoundNumber} not found in bracket`);
  }

  const nextMatch = nextRound.matches.find(
    (m) => m.bracketPosition.matchNumber === nextMatchNumber
  );

  if (!nextMatch) {
    throw new Error(
      `Next match ${nextMatchNumber} not found in round ${nextRoundNumber}`
    );
  }

  // Determine which position in the next match (odd match numbers go to participant1)
  if (matchNumber % 2 === 1) {
    nextMatch.participant1 = winnerId;
  } else {
    nextMatch.participant2 = winnerId;
  }

  // Check if current round is complete
  currentRound.completed = currentRound.matches.every((m) => m.completed);

  // If current round is complete, advance to next round
  if (currentRound.completed) {
    bracketState.currentRound = nextRoundNumber;
  }
}

/**
 * Update bracket after a match completion (legacy - uses in-memory bracket)
 * @param bracket - The knockout bracket
 * @param matchId - ID of the completed match
 * @param winnerId - ID of the winner
 * @returns Updated bracket
 * @deprecated Use updateBracketAfterMatchWithState instead
 */
export function updateBracketAfterMatch(
  bracket: KnockoutBracket,
  matchId: string,
  winnerId: string
): KnockoutBracket {
  // Find the match in the bracket
  let foundMatch: BracketMatch | null = null;
  let foundRound: BracketRound | null = null;

  for (const round of bracket.rounds) {
    const match = round.matches.find((m) => m.matchId === matchId);
    if (match) {
      foundMatch = match;
      foundRound = round;
      break;
    }
  }

  // Check third place match
  if (!foundMatch && bracket.thirdPlaceMatch?.matchId === matchId) {
    foundMatch = bracket.thirdPlaceMatch;
    foundMatch.winner = winnerId;
    foundMatch.completed = true;

    // Check if the entire bracket is now completed
    if (isBracketCompleted(bracket)) {
      bracket.completed = true;
    }

    return bracket;
  }

  if (!foundMatch || !foundRound) {
    throw new Error(`Match ${matchId} not found in bracket`);
  }

  // Use advanceWinner to handle the progression
  const updatedBracket = advanceWinner(
    bracket,
    foundRound.roundNumber,
    foundMatch.bracketPosition.matchNumber,
    winnerId
  );

  // Auto-populate third place match if semi-finals just completed
  if (
    updatedBracket.thirdPlaceMatch &&
    foundRound.roundNumber === updatedBracket.rounds.length - 1 && // Semi-final round
    foundRound.completed // Round just completed
  ) {
    try {
      // Collect losers from semi-finals
      const semiFinalLosers: string[] = [];
      for (const match of foundRound.matches) {
        if (match.completed && match.winner) {
          const loser = getMatchLoser(match);
          if (loser) {
            semiFinalLosers.push(loser);
          }
        }
      }

      // Only update if we have exactly 2 losers
      if (semiFinalLosers.length === 2) {
        updatedBracket.thirdPlaceMatch.participant1 = semiFinalLosers[0];
        updatedBracket.thirdPlaceMatch.participant2 = semiFinalLosers[1];
      }
    } catch (error) {
      // If third place match update fails, log but don't throw
      // This prevents the main bracket update from failing
      console.error("Failed to auto-populate third place match:", error);
    }
  }

  return updatedBracket;
}

/**
 * Get the next match for a winner
 * @param bracket - The knockout bracket
 * @param winnerId - ID of the winner
 * @returns Next match or undefined if winner is in final
 */
export function getNextMatch(
  bracket: KnockoutBracket,
  winnerId: string
): BracketMatch | undefined {
  // Find the match where this participant won
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.winner === winnerId && match.completed) {
        // This is their winning match, find next match
        if (match.bracketPosition.nextMatchNumber && round.roundNumber < bracket.rounds.length) {
          const nextRound = bracket.rounds.find(
            (r) => r.roundNumber === round.roundNumber + 1
          );

          if (nextRound) {
            return nextRound.matches.find(
              (m) => m.bracketPosition.matchNumber === match.bracketPosition.nextMatchNumber
            );
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Update third place match participants (called after semi-finals)
 * @param bracket - The knockout bracket
 * @param semiFinalLosers - Array of loser IDs from semi-finals
 * @returns Updated bracket
 */
export function updateThirdPlaceMatch(
  bracket: KnockoutBracket,
  semiFinalLosers: string[]
): KnockoutBracket {
  if (!bracket.thirdPlaceMatch) {
    throw new Error("Bracket does not have a third place match configured");
  }

  if (semiFinalLosers.length !== 2) {
    throw new Error("Expected exactly 2 semi-final losers");
  }

  // Find semi-final round
  const semiFinalRound = bracket.rounds.find(
    (r) => r.roundNumber === bracket.rounds.length - 1
  );

  if (!semiFinalRound) {
    throw new Error("Semi-final round not found");
  }

  // Verify semi-finals are complete
  if (!semiFinalRound.completed) {
    throw new Error("Semi-finals must be completed before setting up third place match");
  }

  // Collect losers from semi-finals
  const losers: string[] = [];
  for (const match of semiFinalRound.matches) {
    if (match.completed && match.winner) {
      // Loser is the participant who didn't win
      const loser =
        match.participant1 === match.winner ? match.participant2 : match.participant1;
      if (loser) {
        losers.push(loser);
      }
    }
  }

  if (losers.length !== 2) {
    throw new Error(
      `Expected 2 losers from semi-finals, found ${losers.length}`
    );
  }

  // Verify the provided losers match the actual losers
  const providedSet = new Set(semiFinalLosers.map((id) => id.toString()));
  const actualSet = new Set(losers.map((id) => id.toString()));

  if (providedSet.size !== actualSet.size || ![...providedSet].every((id) => actualSet.has(id))) {
    throw new Error("Provided semi-final losers do not match actual losers");
  }

  // Update third place match
  bracket.thirdPlaceMatch.participant1 = losers[0];
  bracket.thirdPlaceMatch.participant2 = losers[1];

  return bracket;
}

/**
 * Check if a round is complete and can advance to next round
 * @param bracket - The knockout bracket
 * @param roundNumber - Round number to check
 * @returns True if round is complete and ready to advance
 */
export function canAdvanceToNextRound(
  bracket: KnockoutBracket,
  roundNumber: number
): boolean {
  const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);

  if (!round) {
    return false;
  }

  // Check if all matches in the round are completed
  return round.matches.every((m) => m.completed);
}

/**
 * Get all matches in a specific round
 * @param bracket - The knockout bracket
 * @param roundNumber - Round number
 * @returns Array of matches in the round
 */
export function getRoundMatches(
  bracket: KnockoutBracket,
  roundNumber: number
): BracketMatch[] {
  const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);
  return round?.matches || [];
}

/**
 * Get loser of a match
 * @param match - The bracket match
 * @returns ID of the loser or null if match not completed
 */
export function getMatchLoser(match: BracketMatch): string | null {
  if (!match.completed || !match.winner) {
    return null;
  }

  if (match.participant1 === match.winner) {
    return match.participant2;
  } else if (match.participant2 === match.winner) {
    return match.participant1;
  }

  return null;
}

/**
 * Get all completed matches in the bracket
 * @param bracket - The knockout bracket
 * @returns Array of completed matches
 */
export function getCompletedMatches(bracket: KnockoutBracket): BracketMatch[] {
  const completedMatches: BracketMatch[] = [];

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.completed) {
        completedMatches.push(match);
      }
    }
  }

  if (bracket.thirdPlaceMatch?.completed) {
    completedMatches.push(bracket.thirdPlaceMatch);
  }

  return completedMatches;
}

/**
 * Get all pending matches (matches that can be played)
 * @param bracket - The knockout bracket
 * @returns Array of pending matches with both participants set
 */
export function getPendingMatches(bracket: KnockoutBracket): BracketMatch[] {
  const pendingMatches: BracketMatch[] = [];

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (
        !match.completed &&
        match.participant1 !== null &&
        match.participant2 !== null
      ) {
        pendingMatches.push(match);
      }
    }
  }

  if (
    bracket.thirdPlaceMatch &&
    !bracket.thirdPlaceMatch.completed &&
    bracket.thirdPlaceMatch.participant1 !== null &&
    bracket.thirdPlaceMatch.participant2 !== null
  ) {
    pendingMatches.push(bracket.thirdPlaceMatch);
  }

  return pendingMatches;
}

/**
 * Get bracket winner (winner of the final)
 * @param bracket - The knockout bracket
 * @returns Winner ID or null if bracket not completed
 */
export function getBracketWinner(bracket: KnockoutBracket): string | null {
  if (!bracket.completed) {
    return null;
  }

  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (finalRound.matches.length > 0) {
    const finalMatch = finalRound.matches[0];
    return finalMatch.winner || null;
  }

  return null;
}

/**
 * Get bracket runner-up (loser of the final)
 * @param bracket - The knockout bracket
 * @returns Runner-up ID or null if bracket not completed
 */
export function getBracketRunnerUp(bracket: KnockoutBracket): string | null {
  if (!bracket.completed) {
    return null;
  }

  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (finalRound.matches.length > 0) {
    const finalMatch = finalRound.matches[0];
    return getMatchLoser(finalMatch);
  }

  return null;
}

/**
 * Get third place finisher
 * @param bracket - The knockout bracket
 * @returns Third place ID or null if no third place match or not completed
 */
export function getThirdPlace(bracket: KnockoutBracket): string | null {
  if (!bracket.thirdPlaceMatch || !bracket.thirdPlaceMatch.completed) {
    return null;
  }

  return bracket.thirdPlaceMatch.winner || null;
}

/**
 * Get all matches that need IndividualMatch documents created
 * These are matches with both participants set but no matchId yet
 * @param bracket - The knockout bracket
 * @returns Array of matches that need match documents created
 */
export function getMatchesNeedingDocuments(bracket: KnockoutBracket): BracketMatch[] {
  const matchesNeeding: BracketMatch[] = [];

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      // Skip bye matches (one participant is null)
      const isByeMatch =
        (match.participant1 !== null && match.participant2 === null) ||
        (match.participant1 === null && match.participant2 !== null);

      // Match needs a document if it has both participants but no matchId
      if (
        !isByeMatch &&
        match.participant1 !== null &&
        match.participant2 !== null &&
        !match.matchId &&
        !match.completed
      ) {
        matchesNeeding.push(match);
      }
    }
  }

  // Check third place match
  if (
    bracket.thirdPlaceMatch &&
    bracket.thirdPlaceMatch.participant1 !== null &&
    bracket.thirdPlaceMatch.participant2 !== null &&
    !bracket.thirdPlaceMatch.matchId &&
    !bracket.thirdPlaceMatch.completed
  ) {
    matchesNeeding.push(bracket.thirdPlaceMatch);
  }

  return matchesNeeding;
}

/**
 * Validate bracket integrity
 * Checks for structural issues, missing data, and logical inconsistencies
 * @param bracket - The knockout bracket to validate
 * @returns Validation result with errors and warnings
 */
export function validateBracketIntegrity(bracket: KnockoutBracket): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check bracket structure
  if (!bracket.rounds || bracket.rounds.length === 0) {
    errors.push("Bracket has no rounds");
    return { isValid: false, errors, warnings };
  }

  // Validate rounds
  let expectedMatchesInRound = bracket.size;
  for (let i = 0; i < bracket.rounds.length; i++) {
    const round = bracket.rounds[i];
    
    if (round.roundNumber !== i + 1) {
      errors.push(`Round ${round.roundNumber} has incorrect round number (expected ${i + 1})`);
    }

    if (!round.matches || round.matches.length === 0) {
      errors.push(`Round ${round.roundNumber} has no matches`);
      continue;
    }

    // Check expected number of matches in each round
    const actualMatches = round.matches.length;
    if (actualMatches !== expectedMatchesInRound) {
      errors.push(
        `Round ${round.roundNumber} has ${actualMatches} matches but expected ${expectedMatchesInRound}`
      );
    }

    // Validate matches in round
    round.matches.forEach((match, matchIdx) => {
      if (!match.bracketPosition) {
        errors.push(`Round ${round.roundNumber} match ${matchIdx + 1} has no bracket position`);
      } else {
        if (match.bracketPosition.round !== round.roundNumber) {
          errors.push(
            `Round ${round.roundNumber} match ${matchIdx + 1} has incorrect round number in bracket position`
          );
        }
      }

      // Check match state consistency
      if (match.completed && !match.winner) {
        errors.push(`Round ${round.roundNumber} match ${matchIdx + 1} is marked complete but has no winner`);
      }

      if (match.winner && !match.completed) {
        warnings.push(`Round ${round.roundNumber} match ${matchIdx + 1} has winner but is not marked complete`);
      }

      // Validate participants
      if (match.participant1 === null && match.participant2 === null && !match.completed) {
        errors.push(`Round ${round.roundNumber} match ${matchIdx + 1} has no participants`);
      }

      if (match.completed && match.participant1 && match.participant2) {
        if (match.winner !== match.participant1 && match.winner !== match.participant2) {
          errors.push(
            `Round ${round.roundNumber} match ${matchIdx + 1} winner is not one of the participants`
          );
        }
      }
    });

    // Check round completion
    if (round.completed) {
      const incompleteMatches = round.matches.filter((m) => !m.completed);
      if (incompleteMatches.length > 0) {
        errors.push(
          `Round ${round.roundNumber} is marked complete but has ${incompleteMatches.length} incomplete matches`
        );
      }
    } else {
      const allCompleted = round.matches.every((m) => m.completed);
      if (allCompleted && round.matches.length > 0) {
        warnings.push(`Round ${round.roundNumber} is not marked complete but all matches are completed`);
      }
    }

    expectedMatchesInRound = Math.floor(expectedMatchesInRound / 2);
  }

  // Validate bracket completion
  if (bracket.completed) {
    const incompleteRounds = bracket.rounds.filter((r) => !r.completed);
    if (incompleteRounds.length > 0) {
      errors.push(`Bracket is marked complete but has ${incompleteRounds.length} incomplete rounds`);
    }
  }

  // Validate third place match if configured
  if (bracket.thirdPlaceMatch) {
    if (bracket.rounds.length < 2) {
      warnings.push("Third place match configured but bracket has fewer than 2 rounds");
    } else {
      const semiFinalRound = bracket.rounds[bracket.rounds.length - 2];
      if (semiFinalRound && semiFinalRound.completed) {
        if (!bracket.thirdPlaceMatch.participant1 || !bracket.thirdPlaceMatch.participant2) {
          warnings.push("Semi-finals completed but third place match participants not set");
        }
      }

      if (bracket.thirdPlaceMatch.completed && !bracket.thirdPlaceMatch.winner) {
        errors.push("Third place match is marked complete but has no winner");
      }
    }
  }

  // Validate current round
  if (bracket.currentRound < 1 || bracket.currentRound > bracket.rounds.length) {
    errors.push(`Current round ${bracket.currentRound} is out of bounds (1-${bracket.rounds.length})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempt to repair bracket structure
 * Fixes common issues found during validation
 * @param bracket - The bracket to repair
 * @returns Repaired bracket and list of fixes applied
 */
export function repairBracket(bracket: KnockoutBracket): {
  bracket: KnockoutBracket;
  fixes: string[];
} {
  const fixes: string[] = [];

  // Fix round numbers
  bracket.rounds.forEach((round, index) => {
    if (round.roundNumber !== index + 1) {
      round.roundNumber = index + 1;
      fixes.push(`Fixed round number from ${round.roundNumber} to ${index + 1}`);
    }
  });

  // Fix match bracket positions
  bracket.rounds.forEach((round) => {
    round.matches.forEach((match, matchIdx) => {
      if (!match.bracketPosition) {
        match.bracketPosition = {
          round: round.roundNumber,
          matchNumber: matchIdx + 1,
          nextMatchNumber: matchIdx + 1 === round.matches.length ? undefined : Math.floor((matchIdx + 1) / 2) + 1,
        };
        fixes.push(`Added bracket position to round ${round.roundNumber} match ${matchIdx + 1}`);
      } else if (match.bracketPosition.round !== round.roundNumber) {
        match.bracketPosition.round = round.roundNumber;
        fixes.push(`Fixed bracket position round number for round ${round.roundNumber} match ${matchIdx + 1}`);
      }
    });
  });

  // Fix match completion flags
  bracket.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.winner && !match.completed) {
        match.completed = true;
        fixes.push(`Set match completion flag for round ${round.roundNumber} match ${match.bracketPosition?.matchNumber || 'unknown'}`);
      }
    });

    // Fix round completion
    const allMatchesCompleted = round.matches.length > 0 && round.matches.every((m) => m.completed);
    if (allMatchesCompleted && !round.completed) {
      round.completed = true;
      fixes.push(`Set round ${round.roundNumber} completion flag`);
    }
  });

  // Fix bracket completion
  const allRoundsCompleted = bracket.rounds.length > 0 && bracket.rounds.every((r) => r.completed);
  if (allRoundsCompleted && !bracket.completed) {
    bracket.completed = true;
    fixes.push("Set bracket completion flag");
  }

  // Fix current round
  const lastCompletedRound = bracket.rounds
    .slice()
    .reverse()
    .find((r) => r.completed);
  if (lastCompletedRound) {
    const nextRoundNumber = lastCompletedRound.roundNumber + 1;
    if (nextRoundNumber <= bracket.rounds.length) {
      bracket.currentRound = nextRoundNumber;
      fixes.push(`Updated current round to ${nextRoundNumber}`);
    } else if (bracket.completed) {
      bracket.currentRound = bracket.rounds.length;
      fixes.push(`Set current round to final round ${bracket.rounds.length}`);
    }
  }

  return { bracket, fixes };
}
