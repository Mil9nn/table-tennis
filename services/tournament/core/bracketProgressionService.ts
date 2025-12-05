// services/tournament/core/bracketProgressionService.ts

import {
  KnockoutBracket,
  BracketRound,
  BracketMatch,
} from "@/types/tournamentDraw";

/**
 * Bracket Progression Service
 * Handles match completion and winner advancement in knockout brackets
 */

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
 * Update bracket after a match completion
 * @param bracket - The knockout bracket
 * @param matchId - ID of the completed match
 * @param winnerId - ID of the winner
 * @returns Updated bracket
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
