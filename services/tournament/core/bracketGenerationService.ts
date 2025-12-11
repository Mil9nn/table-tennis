// services/tournament/core/bracketGenerationService.ts

import {
  KnockoutBracket,
  BracketRound,
  BracketMatch,
  BracketNode,
} from "@/types/tournamentDraw";
import { SeedingInfo } from "../types/tournament.types";
import BracketState, { IBracketState } from "@/models/BracketState";
import mongoose, { ClientSession } from "mongoose";

/**
 * Bracket Generation Service
 * Handles knockout tournament bracket generation and validation
 */

/**
 * Get human-readable round name based on round number and total rounds
 * @param roundNumber - Current round number (1-based)
 * @param totalRounds - Total number of rounds in the tournament
 * @returns Round name (e.g., "Final", "Semi-Finals", "Quarter-Finals")
 */
export function getRoundName(roundNumber: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundNumber;

  if (roundsFromEnd === 0) return "Final";
  if (roundsFromEnd === 1) return "Semi-Finals";
  if (roundsFromEnd === 2) return "Quarter-Finals";
  if (roundsFromEnd === 3) return "Round of 16";
  if (roundsFromEnd === 4) return "Round of 32";
  if (roundsFromEnd === 5) return "Round of 64";

  return `Round ${roundNumber}`;
}

/**
 * Calculate the next power of 2 greater than or equal to n
 * @param n - Input number
 * @returns Next power of 2
 */
export function nextPowerOf2(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calculate the number of byes needed for a tournament
 * @param participantCount - Number of participants
 * @returns Number of byes needed
 */
export function calculateByes(participantCount: number): number {
  const bracketSize = nextPowerOf2(participantCount);
  return bracketSize - participantCount;
}

/**
 * Calculate total number of rounds in the tournament
 * @param participantCount - Number of participants
 * @returns Total number of rounds
 */
export function calculateTotalRounds(participantCount: number): number {
  const bracketSize = nextPowerOf2(participantCount);
  return Math.log2(bracketSize);
}

/**
 * Distribute byes to top-seeded participants
 * @param participants - Array of participant IDs
 * @param seeding - Seeding information
 * @returns Array of BracketNodes with byes distributed to top seeds
 */
export function distributeByes(
  participants: string[],
  seeding: SeedingInfo[]
): BracketNode[] {
  const byeCount = calculateByes(participants.length);
  const bracketSize = nextPowerOf2(participants.length);

  // Create a map of participant ID to seed number
  const seedMap = new Map<string, number>(
    seeding.map((s) => [s.participant.toString(), s.seedNumber])
  );

  // Sort participants by seed (lower seed number = higher priority)
  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a.toString()) || 9999;
    const seedB = seedMap.get(b.toString()) || 9999;
    return seedA - seedB;
  });

  // Create bracket nodes array
  const nodes: BracketNode[] = [];

  // Add top seeds with byes
  for (let i = 0; i < byeCount; i++) {
    nodes.push({
      participantId: sortedParticipants[i],
      seedNumber: seedMap.get(sortedParticipants[i].toString()),
      isBye: true,
    });
  }

  // Add remaining participants without byes
  for (let i = byeCount; i < sortedParticipants.length; i++) {
    nodes.push({
      participantId: sortedParticipants[i],
      seedNumber: seedMap.get(sortedParticipants[i].toString()),
      isBye: false,
    });
  }

  // Fill remaining slots with null (TBD)
  while (nodes.length < bracketSize) {
    nodes.push({
      participantId: null,
      isBye: false,
    });
  }

  return nodes;
}

/**
 * Generate first round matches with proper bye handling
 * @param participants - Array of participant IDs
 * @param seeding - Seeding information
 * @param totalRounds - Total number of rounds
 * @param scheduledDate - Optional scheduled date for the round
 * @returns First round with matches
 */
export function generateFirstRound(
  participants: string[],
  seeding: SeedingInfo[],
  totalRounds: number,
  scheduledDate?: Date,
  skipParticipantAssignment?: boolean // For custom matching: create empty bracket
): BracketRound {
  const bracketSize = nextPowerOf2(participants.length);
  const firstRoundMatches = bracketSize / 2;
  const matches: BracketMatch[] = [];

  // If custom matching, create empty bracket structure (no participants assigned)
  if (skipParticipantAssignment) {
    // Calculate actual matches needed for Round 1
    // Only create matches for participants who will actually play (not byes)
    const byesNeeded = bracketSize - participants.length;
    const participantsPlaying = participants.length - byesNeeded;
    const actualFirstRoundMatches = Math.max(1, participantsPlaying / 2);

    

    for (let i = 0; i < actualFirstRoundMatches; i++) {
      matches.push({
        participant1: null,
        participant2: null,
        winner: null,
        completed: false,
        bracketPosition: {
          round: 1,
          matchNumber: i + 1,
          nextMatchNumber: Math.floor(i / 2) + 1,
        },
        scheduledDate,
        roundName: getRoundName(1, totalRounds), // FIX: Correct parameter order
      });
    }

    return {
      roundNumber: 1,
      roundName: getRoundName(1, totalRounds), // FIX: Correct parameter order
      matches,
      completed: false,
      scheduledDate,
    };
  }

  // Normal mode: auto-assign participants based on seeding
  const nodes = distributeByes(participants, seeding);

  // Standard bracket pairing: 1 vs last, 2 vs second-last, etc.
  for (let i = 0; i < firstRoundMatches; i++) {
    const node1 = nodes[i];
    const node2 = nodes[nodes.length - 1 - i];

    // Handle bye matches
    let participant1 = node1.participantId;
    let participant2 = node2.participantId;
    let completed = false;
    let winner: string | null = null;

    // If one participant has a bye, they automatically advance
    if (node1.isBye && !node2.isBye) {
      winner = node1.participantId;
      completed = true;
    } else if (!node1.isBye && node2.isBye) {
      winner = node2.participantId;
      completed = true;
    } else if (node1.isBye && node2.isBye) {
      // Both byes - this shouldn't happen with proper distribution
      // But if it does, first participant wins
      winner = node1.participantId;
      completed = true;
    }

    matches.push({
      participant1,
      participant2,
      winner,
      completed,
      bracketPosition: {
        round: 1,
        matchNumber: i + 1,
        nextMatchNumber: Math.floor(i / 2) + 1,
      },
      scheduledDate,
      roundName: getRoundName(1, totalRounds),
    });
  }

  return {
    roundNumber: 1,
    roundName: getRoundName(1, totalRounds),
    matches,
    completed: matches.every((m) => m.completed),
    scheduledDate,
  };
}

/**
 * Generate empty subsequent rounds (to be filled as tournament progresses)
 * @param firstRound - The first round with matches
 * @param totalRounds - Total number of rounds
 * @param scheduledDate - Optional base scheduled date
 * @param bracketSize - Optional bracket size (required for custom matching with byes)
 * @returns Array of empty rounds
 */
export function generateSubsequentRounds(
  firstRound: BracketRound,
  totalRounds: number,
  scheduledDate?: Date,
  bracketSize?: number
): BracketRound[] {
  const rounds: BracketRound[] = [];
  let previousRoundMatchCount = firstRound.matches.length;

  for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
    // If bracketSize is provided (custom matching mode), calculate based on bracket size
    // Otherwise, use previous round match count (auto mode)
    const matchCount = bracketSize
      ? bracketSize / Math.pow(2, roundNum)
      : Math.floor(previousRoundMatchCount / 2);
    const matches: BracketMatch[] = [];

    for (let matchNum = 1; matchNum <= matchCount; matchNum++) {
      const sourceMatch1Number = (matchNum - 1) * 2 + 1;
      const sourceMatch2Number = (matchNum - 1) * 2 + 2;

      matches.push({
        participant1: null,
        participant2: null,
        completed: false,
        bracketPosition: {
          round: roundNum,
          matchNumber: matchNum,
          nextMatchNumber: roundNum < totalRounds ? Math.floor((matchNum - 1) / 2) + 1 : undefined,
        },
        sourceMatches: {
          match1: `R${roundNum - 1}M${sourceMatch1Number}`,
          match2: `R${roundNum - 1}M${sourceMatch2Number}`,
        },
        scheduledDate,
        roundName: getRoundName(roundNum, totalRounds),
      });
    }

    rounds.push({
      roundNumber: roundNum,
      roundName: getRoundName(roundNum, totalRounds),
      matches,
      completed: false,
      scheduledDate,
    });

    previousRoundMatchCount = matchCount;
  }

  return rounds;
}

/**
 * Advance bye winners to the next round after bracket generation
 * @param bracket - The knockout bracket to process
 */
function advanceByeWinners(bracket: KnockoutBracket): void {
  // Process each round
  for (let roundIndex = 0; roundIndex < bracket.rounds.length - 1; roundIndex++) {
    const currentRound = bracket.rounds[roundIndex];
    const nextRound = bracket.rounds[roundIndex + 1];

    // For each match in the current round
    currentRound.matches.forEach((match) => {
      // If this is a completed bye match with a winner
      if (match.completed && match.winner && match.bracketPosition.nextMatchNumber) {
        const nextMatch = nextRound.matches.find(
          (m) => m.bracketPosition.matchNumber === match.bracketPosition.nextMatchNumber
        );

        if (nextMatch) {
          // Determine which slot the winner goes into (odd match numbers go to participant1)
          if (match.bracketPosition.matchNumber % 2 === 1) {
            nextMatch.participant1 = match.winner;
          } else {
            nextMatch.participant2 = match.winner;
          }
        }
      }
    });
  }
}

/**
 * Main function to generate complete knockout bracket
 * @param participants - Array of participant IDs
 * @param seeding - Seeding information
 * @param options - Optional configuration (thirdPlaceMatch, scheduledDate)
 * @returns Complete knockout bracket
 */
export function generateKnockoutBracket(
  participants: string[],
  seeding: SeedingInfo[],
  options?: {
    thirdPlaceMatch?: boolean;
    scheduledDate?: Date;
    skipByeAdvancement?: boolean; // When true, don't auto-advance bye winners (for custom matching)
  }
): KnockoutBracket {
  if (participants.length < 2) {
    throw new Error("At least 2 participants are required for a knockout tournament");
  }

  const totalRounds = calculateTotalRounds(participants.length);
  const bracketSize = nextPowerOf2(participants.length);

  // Generate first round
  // If skipByeAdvancement is true (custom matching mode), create empty bracket structure
  const firstRound = generateFirstRound(
    participants,
    seeding,
    totalRounds,
    options?.scheduledDate,
    options?.skipByeAdvancement // Pass through to skip participant assignment
  );

  // Generate subsequent rounds
  // For custom matching mode, pass bracket size to ensure correct match counts
  const subsequentRounds = generateSubsequentRounds(
    firstRound,
    totalRounds,
    options?.scheduledDate,
    options?.skipByeAdvancement ? bracketSize : undefined
  );

  // Create third place match if requested
  // Only create third place match if there are at least 4 participants (creates semi-finals)
  let thirdPlaceMatch: BracketMatch | undefined;
  if (options?.thirdPlaceMatch && participants.length >= 4 && totalRounds >= 2) {
    thirdPlaceMatch = {
      participant1: null,
      participant2: null,
      completed: false,
      bracketPosition: {
        round: totalRounds,
        matchNumber: 999, // Special number for third place match
      },
      scheduledDate: options?.scheduledDate,
      roundName: "3rd Place Match",
      isThirdPlaceMatch: true,
    };
  }

  const bracket: KnockoutBracket = {
    size: bracketSize,
    rounds: [firstRound, ...subsequentRounds],
    currentRound: 1,
    completed: false,
    thirdPlaceMatch,
  };

  // Advance bye winners to next round (unless custom matching is enabled)
  // When skipByeAdvancement is true, byes are still marked as completed but winners
  // don't auto-advance. Organizer must use custom matcher to configure all matchups.
  if (!options?.skipByeAdvancement) {
    advanceByeWinners(bracket);
  }

  return bracket;
}

/**
 * Validate bracket structure
 * @param bracket - The bracket to validate
 * @returns Validation result with error message if invalid
 */
export function validateBracket(bracket: KnockoutBracket): {
  isValid: boolean;
  error?: string;
} {
  // Check if bracket has rounds
  if (!bracket.rounds || bracket.rounds.length === 0) {
    return { isValid: false, error: "Bracket must have at least one round" };
  }

  // Check if bracket size is power of 2
  if (bracket.size <= 0 || (bracket.size & (bracket.size - 1)) !== 0) {
    return { isValid: false, error: "Bracket size must be a power of 2" };
  }

  // Validate round structure
  for (let i = 0; i < bracket.rounds.length; i++) {
    const round = bracket.rounds[i];
    const expectedMatchCount = bracket.size / Math.pow(2, i + 1);

    if (round.matches.length !== expectedMatchCount) {
      return {
        isValid: false,
        error: `Round ${i + 1} should have ${expectedMatchCount} matches, but has ${round.matches.length}`,
      };
    }

    // Validate round number
    if (round.roundNumber !== i + 1) {
      return {
        isValid: false,
        error: `Round ${i + 1} has incorrect roundNumber: ${round.roundNumber}`,
      };
    }
  }

  // Validate current round
  if (bracket.currentRound < 1 || bracket.currentRound > bracket.rounds.length) {
    return {
      isValid: false,
      error: `Current round ${bracket.currentRound} is out of bounds (1-${bracket.rounds.length})`,
    };
  }

  return { isValid: true };
}

/**
 * Get the current active round
 * @param bracket - The knockout bracket
 * @returns The current active round or undefined if bracket is complete
 */
export function getCurrentActiveRound(
  bracket: KnockoutBracket
): BracketRound | undefined {
  if (bracket.completed) {
    return undefined;
  }

  return bracket.rounds.find((r) => r.roundNumber === bracket.currentRound);
}

/**
 * Check if the entire bracket is completed
 * @param bracket - The knockout bracket
 * @returns True if all rounds are completed
 */
export function isBracketCompleted(bracket: KnockoutBracket): boolean {
  // Check if all rounds are completed
  const allRoundsComplete = bracket.rounds.every((r) => r.completed);

  // If third place match exists, check if it's completed too
  if (bracket.thirdPlaceMatch) {
    return allRoundsComplete && bracket.thirdPlaceMatch.completed;
  }

  return allRoundsComplete;
}

/**
 * Create or update BracketState document from a KnockoutBracket
 * @param tournamentId - Tournament ID
 * @param bracket - The knockout bracket to save
 * @param session - Optional MongoDB session for transactions
 * @returns Created or updated BracketState document
 */
export async function createOrUpdateBracketState(
  tournamentId: string,
  bracket: KnockoutBracket,
  session?: ClientSession
): Promise<IBracketState> {
  // Check if bracket state already exists
  const existingState = session
    ? await BracketState.findOne({ tournament: tournamentId }).session(session)
    : await BracketState.findOne({ tournament: tournamentId });

  if (existingState) {
    // Update existing state
    existingState.size = bracket.size;
    existingState.rounds = bracket.rounds;
    existingState.currentRound = bracket.currentRound;
    existingState.completed = bracket.completed;
    existingState.thirdPlaceMatch = bracket.thirdPlaceMatch;

    if (session) {
      await existingState.save({ session });
    } else {
      await existingState.save();
    }

    return existingState;
  }

  // Create new bracket state
  const bracketStateData = {
    tournament: new mongoose.Types.ObjectId(tournamentId),
    size: bracket.size,
    rounds: bracket.rounds,
    currentRound: bracket.currentRound,
    completed: bracket.completed,
    thirdPlaceMatch: bracket.thirdPlaceMatch,
  };

  if (session) {
    const [bracketState] = await BracketState.create([bracketStateData], { session });
    return bracketState;
  } else {
    const [bracketState] = await BracketState.create([bracketStateData]);
    return bracketState;
  }
}
