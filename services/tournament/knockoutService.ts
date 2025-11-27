import mongoose from "mongoose";
import {
  IKnockoutBracket,
  IKnockoutRound,
  IBracketMatch,
  IParticipantSlot,
  ISeeding,
  ITournament,
} from "@/models/Tournament";

/**
 * Knockout Tournament Service
 *
 * Implements ITTF-compliant knockout/elimination tournament brackets.
 * Supports:
 * - Single elimination
 * - Proper ITTF seeding (1, 2, 3-4, 5-8, 9-16, 17-32, etc.)
 * - Bye allocation for non-power-of-2 participants
 * - Consolation brackets (3rd place match)
 */

/**
 * Calculate the bracket size and number of byes needed
 * Bracket size must be a power of 2 (4, 8, 16, 32, 64, 128)
 */
export function calculateBracketSize(participantCount: number): {
  bracketSize: number;
  byesNeeded: number;
  firstRoundMatches: number;
} {
  if (participantCount < 2) {
    throw new Error("At least 2 participants required for knockout tournament");
  }

  // Find next power of 2
  let bracketSize = 2;
  while (bracketSize < participantCount) {
    bracketSize *= 2;
  }

  // Cap at reasonable maximum
  if (bracketSize > 128) {
    throw new Error("Maximum 128 participants supported for knockout");
  }

  const byesNeeded = bracketSize - participantCount;
  const firstRoundMatches = participantCount - byesNeeded;

  return {
    bracketSize,
    byesNeeded,
    firstRoundMatches,
  };
}

/**
 * Get round name based on bracket size and round number
 * ITTF standard naming
 */
export function getRoundName(bracketSize: number, roundNumber: number): string {
  const totalRounds = Math.log2(bracketSize);
  const remainingRounds = totalRounds - roundNumber;

  if (remainingRounds === 0) return "Final";
  if (remainingRounds === 1) return "Semi Finals";
  if (remainingRounds === 2) return "Quarter Finals";
  if (remainingRounds === 3) return "Round of 16";
  if (remainingRounds === 4) return "Round of 32";
  if (remainingRounds === 5) return "Round of 64";
  if (remainingRounds === 6) return "Round of 128";

  return `Round ${roundNumber}`;
}

/**
 * Allocate byes to top seeds according to ITTF rules
 * Byes are distributed to avoid concentration in one half
 */
export function allocateByes(
  participants: mongoose.Types.ObjectId[],
  seeding: ISeeding[],
  byesNeeded: number
): IParticipantSlot[] {
  const slots: IParticipantSlot[] = [];

  // Create seed map for quick lookup
  const seedMap = new Map<string, number>();
  seeding.forEach((s) => {
    seedMap.set(s.participant.toString(), s.seedNumber);
  });

  // Sort participants by seed
  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a.toString()) || 9999;
    const seedB = seedMap.get(b.toString()) || 9999;
    return seedA - seedB;
  });

  // Top seeds get byes
  for (let i = 0; i < byesNeeded; i++) {
    slots.push({
      type: "bye",
    });
  }

  // Remaining participants
  for (let i = byesNeeded; i < sortedParticipants.length; i++) {
    slots.push({
      type: "direct",
      participantId: sortedParticipants[i],
    });
  }

  return slots;
}

/**
 * Create bracket positions using sequential seeding
 *
 * Sequential matching based on seeding order:
 * - Seed 1 vs Seed 2 (positions 0, 1)
 * - Seed 3 vs Seed 4 (positions 2, 3)
 * - Seed 5 vs Seed 6 (positions 4, 5)
 * - And so on...
 *
 * This makes it easier to apply custom seeding order.
 */
export function createBracketPositions(
  participants: mongoose.Types.ObjectId[],
  seeding: ISeeding[],
  bracketSize: number,
  byesNeeded: number
): IParticipantSlot[] {
  const positions: IParticipantSlot[] = new Array(bracketSize);

  // Create seed map
  const seedMap = new Map<string, number>();
  seeding.forEach((s) => {
    seedMap.set(s.participant.toString(), s.seedNumber);
  });

  // Sort participants by seed
  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a.toString()) || 9999;
    const seedB = seedMap.get(b.toString()) || 9999;
    return seedA - seedB;
  });

  // Place participants sequentially
  let participantIndex = 0;

  // Fill positions in order
  for (let i = 0; i < bracketSize && participantIndex < sortedParticipants.length; i++) {
    positions[i] = {
      type: "direct",
      participantId: sortedParticipants[participantIndex++],
    };
  }

  // Fill remaining positions with byes
  for (let i = participantIndex; i < bracketSize; i++) {
    positions[i] = { type: "bye" };
  }

  return positions;
}

/**
 * Calculate ITTF-compliant seeding positions for bracket
 */
function calculateSeedingPositions(bracketSize: number): number[] {
  const positions: number[] = [];

  // Seed 1 always at position 0 (top)
  // Seed 2 always at position N-1 (bottom)
  positions[0] = 0;
  positions[1] = bracketSize - 1;

  if (bracketSize >= 4) {
    // Seeds 3-4 go in middle positions
    positions[2] = Math.floor(bracketSize / 2) - 1;
    positions[3] = Math.floor(bracketSize / 2);
  }

  if (bracketSize >= 8) {
    // Seeds 5-8 go in quarter positions
    const quarter = Math.floor(bracketSize / 4);
    positions[4] = quarter - 1;
    positions[5] = quarter;
    positions[6] = bracketSize - quarter - 1;
    positions[7] = bracketSize - quarter;
  }

  if (bracketSize >= 16) {
    // Seeds 9-16 go in eighth positions
    const eighth = Math.floor(bracketSize / 8);
    for (let i = 8; i < 16; i++) {
      positions[i] = eighth * (i - 7) - 1;
    }
  }

  // For larger brackets, continue pattern
  if (bracketSize >= 32) {
    const sixteenth = Math.floor(bracketSize / 16);
    for (let i = 16; i < 32; i++) {
      positions[i] = sixteenth * (i - 15) - 1;
    }
  }

  return positions;
}

/**
 * Create bracket match structure from positions
 */
function createBracketMatches(
  positions: IParticipantSlot[],
  bracketSize: number
): IKnockoutRound[] {
  const totalRounds = Math.log2(bracketSize);
  const rounds: IKnockoutRound[] = [];

  let currentMatchPosition = 0;

  // Round 1: Pair up initial positions
  const round1Matches: IBracketMatch[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const participant1 = positions[i];
    const participant2 = positions[i + 1];

    // Skip if both are byes (no match needed)
    if (participant1.type === "bye" && participant2.type === "bye") {
      currentMatchPosition++;
      continue;
    }

    round1Matches.push({
      bracketPosition: currentMatchPosition,
      roundNumber: 1,
      participant1,
      participant2,
      nextMatchPosition: Math.floor(currentMatchPosition / 2),
      completed: false,
    });

    currentMatchPosition++;
  }

  rounds.push({
    roundNumber: 1,
    name: getRoundName(bracketSize, 1),
    matches: round1Matches,
    completed: false,
  });

  // Subsequent rounds: Winners advance
  let previousRoundMatches = round1Matches.length;
  for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
    const roundMatches: IBracketMatch[] = [];
    const matchesInRound = previousRoundMatches / 2;

    // Save starting position for this round before incrementing
    const roundStartPosition = currentMatchPosition;

    for (let i = 0; i < matchesInRound; i++) {
      const match: IBracketMatch = {
        bracketPosition: currentMatchPosition,
        roundNumber: roundNum,
        participant1: {
          type: "from_match",
          fromMatchPosition: roundStartPosition - previousRoundMatches + i * 2,
          isWinnerOf: true,
        },
        participant2: {
          type: "from_match",
          fromMatchPosition: roundStartPosition - previousRoundMatches + i * 2 + 1,
          isWinnerOf: true,
        },
        completed: false,
      };

      // Set next match position (except for final)
      if (roundNum < totalRounds) {
        match.nextMatchPosition = roundStartPosition + matchesInRound + Math.floor(i / 2);
      }

      roundMatches.push(match);
      currentMatchPosition++;
    }

    rounds.push({
      roundNumber: roundNum,
      name: getRoundName(bracketSize, roundNum),
      matches: roundMatches,
      completed: false,
    });

    previousRoundMatches = matchesInRound;
  }

  return rounds;
}

/**
 * Generate complete knockout bracket
 */
export function generateKnockoutBracket(
  participants: mongoose.Types.ObjectId[],
  seeding: ISeeding[],
  options: {
    consolationBracket?: boolean;
  } = {}
): IKnockoutBracket {
  if (participants.length < 2) {
    throw new Error("At least 2 participants required");
  }

  const { bracketSize, byesNeeded } = calculateBracketSize(participants.length);

  // Create positions with ITTF seeding
  const positions = createBracketPositions(
    participants,
    seeding,
    bracketSize,
    byesNeeded
  );

  // Create bracket structure
  const rounds = createBracketMatches(positions, bracketSize);

  const bracket: IKnockoutBracket = {
    size: bracketSize,
    rounds,
    consolationBracket: options.consolationBracket || false,
  };

  // Add 3rd place match if requested
  if (options.consolationBracket && bracketSize >= 4) {
    const semiFinalRound = rounds.find((r) => r.name === "Semi Finals");
    if (semiFinalRound) {
      // 3rd place match between semi-final losers
      const thirdPlaceMatch: IBracketMatch = {
        bracketPosition: rounds[rounds.length - 1].matches[0].bracketPosition + 1,
        roundNumber: rounds.length,
        participant1: {
          type: "from_match",
          fromMatchPosition: semiFinalRound.matches[0].bracketPosition,
          isWinnerOf: false, // Loser
        },
        participant2: {
          type: "from_match",
          fromMatchPosition: semiFinalRound.matches[1].bracketPosition,
          isWinnerOf: false, // Loser
        },
        completed: false,
      };

      // Add as separate round or append to final round
      rounds[rounds.length - 1].matches.push(thirdPlaceMatch);
      bracket.thirdPlaceMatchPosition = thirdPlaceMatch.bracketPosition;
    }
  }

  return bracket;
}

/**
 * Validate and fix bracket matches after tournament draw
 * Handles byes automatically by advancing to next round
 * Only processes first round matches with direct participants
 */
export function processByes(bracket: IKnockoutBracket): IKnockoutBracket {
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      // Only process matches with direct participant slots (not from_match placeholders)
      // This prevents future rounds from being incorrectly marked as completed
      const isFirstRoundMatch =
        (match.participant1.type === "direct" || match.participant1.type === "bye") &&
        (match.participant2.type === "direct" || match.participant2.type === "bye");

      if (!isFirstRoundMatch) {
        // Skip future round matches with "from_match" participants
        continue;
      }

      const p1IsBye = match.participant1.type === "bye";
      const p2IsBye = match.participant2.type === "bye";

      if (p1IsBye && p2IsBye) {
        // Both byes - mark as completed with no winner
        match.completed = true;
      } else if (p1IsBye && !p2IsBye) {
        // P2 gets automatic win
        if (match.participant2.participantId) {
          match.winner = match.participant2.participantId;
          match.completed = true;
        }
      } else if (p2IsBye && !p1IsBye) {
        // P1 gets automatic win
        if (match.participant1.participantId) {
          match.winner = match.participant1.participantId;
          match.completed = true;
        }
      }
    }
  }

  return bracket;
}

/**
 * Get participant for a match slot
 * Resolves "from_match" references
 */
export function resolveParticipantSlot(
  slot: IParticipantSlot,
  bracket: IKnockoutBracket
): mongoose.Types.ObjectId | null {
  if (slot.type === "direct" && slot.participantId) {
    return slot.participantId;
  }

  if (slot.type === "from_match" && slot.fromMatchPosition !== undefined) {
    // Find the source match
    for (const round of bracket.rounds) {
      const sourceMatch = round.matches.find(
        (m) => m.bracketPosition === slot.fromMatchPosition
      );
      if (sourceMatch) {
        return slot.isWinnerOf ? sourceMatch.winner || null : sourceMatch.loser || null;
      }
    }
  }

  if (slot.type === "bye") {
    return null;
  }

  return null;
}

/**
 * Update bracket after match completion
 * Advances winner to next round
 */
export function advanceWinnerInBracket(
  bracket: IKnockoutBracket,
  matchPosition: number,
  winnerId: mongoose.Types.ObjectId,
  loserId: mongoose.Types.ObjectId
): IKnockoutBracket {
  // Find the match
  for (const round of bracket.rounds) {
    const match = round.matches.find((m) => m.bracketPosition === matchPosition);
    if (match) {
      match.winner = winnerId;
      match.loser = loserId;
      match.completed = true;

      // Check if round is completed
      // Only consider matches that have actual participants or byes in the first round
      // Exclude placeholder matches that reference future winners
      const matchesToCheck = round.matches.filter((m) => {
        // Include matches with direct participants or byes
        const hasDirectParticipants =
          (m.participant1.type === "direct" || m.participant1.type === "bye") &&
          (m.participant2.type === "direct" || m.participant2.type === "bye");

        // Include matches that have a matchId (actual match created)
        const hasMatchId = Boolean(m.matchId);

        return hasDirectParticipants || hasMatchId;
      });

      // Round is completed only if all actual matches are completed
      round.completed = matchesToCheck.length > 0 && matchesToCheck.every((m) => m.completed);

      break;
    }
  }

  return bracket;
}

/**
 * Get next match for a participant
 */
export function getNextMatchForParticipant(
  bracket: IKnockoutBracket,
  participantId: mongoose.Types.ObjectId
): IBracketMatch | null {
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.completed) continue;

      const p1Id = resolveParticipantSlot(match.participant1, bracket);
      const p2Id = resolveParticipantSlot(match.participant2, bracket);

      if (
        p1Id?.toString() === participantId.toString() ||
        p2Id?.toString() === participantId.toString()
      ) {
        return match;
      }
    }
  }

  return null;
}

/**
 * Check if tournament is complete
 */
export function isTournamentComplete(bracket: IKnockoutBracket): boolean {
  // Final round should be complete
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  return finalRound?.completed || false;
}

/**
 * Get tournament winner
 */
export function getTournamentWinner(
  bracket: IKnockoutBracket
): mongoose.Types.ObjectId | null {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound) return null;

  const finalMatch = finalRound.matches.find((m) => !m.bracketPosition ||
    m.bracketPosition !== bracket.thirdPlaceMatchPosition
  );

  return finalMatch?.winner || null;
}

/**
 * Get tournament runner-up (finalist who lost)
 */
export function getTournamentRunnerUp(
  bracket: IKnockoutBracket
): mongoose.Types.ObjectId | null {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound) return null;

  const finalMatch = finalRound.matches.find((m) => !m.bracketPosition ||
    m.bracketPosition !== bracket.thirdPlaceMatchPosition
  );

  return finalMatch?.loser || null;
}

/**
 * Get 3rd place finisher (if consolation bracket exists)
 */
export function getThirdPlace(
  bracket: IKnockoutBracket
): mongoose.Types.ObjectId | null {
  if (!bracket.consolationBracket || !bracket.thirdPlaceMatchPosition) {
    return null;
  }

  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const thirdPlaceMatch = finalRound?.matches.find(
    (m) => m.bracketPosition === bracket.thirdPlaceMatchPosition
  );

  return thirdPlaceMatch?.winner || null;
}
