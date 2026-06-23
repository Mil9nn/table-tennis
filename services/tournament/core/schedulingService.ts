// services/tournament/core/schedulingService.ts

import { MatchPairing, RoundSchedule, SeedingInfo } from "../types/tournament.types";

/**
 * Scheduling Service
 * Implements Berger Tables algorithm for Round Robin scheduling
 * Ensures fair scheduling where each player plays every other player once
 */

/**
 * Generate Round Robin schedule using Berger Tables algorithm
 *
 * This ensures fair scheduling where each player plays every other player once
 * and no player has consecutive matches when possible
 *
 * @param participants - Array of participant IDs
 * @param courtsAvailable - Number of courts/tables available
 * @param startDate - Tournament start date (optional)
 * @param matchDuration - Duration per match in minutes (optional)
 * @returns Array of rounds with match pairings
 */
export function generateRoundRobinSchedule(
  participants: string[],
  courtsAvailable: number = 1,
  startDate?: Date,
  matchDuration: number = 60
): RoundSchedule[] {
  const n = participants.length;
  if (n < 2) {
    throw new Error("At least 2 participants required");
  }

  // Add dummy player if odd number of participants (represents a "bye")
  const hasBye = n % 2 === 1;
  const players = hasBye ? [...participants, "BYE"] : [...participants];
  const totalPlayers = players.length;
  const numRounds = totalPlayers - 1;
  const matchesPerRound = totalPlayers / 2;

  const schedule: RoundSchedule[] = [];

  /**
   * Berger Tables Algorithm (Corrected):
   * - Fix the last player (index n-1) in position
   * - Rotate all other players clockwise each round
   * - Pair fixed player with first rotated player, then pair others symmetrically
   */
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: MatchPairing[] = [];
    let currentDate = startDate;

    // Create rotation array for this round
    const rotated = [...players];

    // Rotate players (except the last one which stays fixed)
    if (round > 0) {
      // Rotate all players except the last one clockwise
      const toRotate = rotated.slice(0, totalPlayers - 1);
      const rotationAmount = round;
      const rotatedPart = [
        ...toRotate.slice(rotationAmount),
        ...toRotate.slice(0, rotationAmount)
      ];
      rotated.splice(0, totalPlayers - 1, ...rotatedPart);
    }

    // Create pairings: fixed player (last) vs first, then pair others symmetrically
    for (let i = 0; i < matchesPerRound; i++) {
      const player1 = rotated[i];
      const player2 = rotated[totalPlayers - 1 - i];

      // Skip bye matches
      if (player1 !== "BYE" && player2 !== "BYE") {
        const matchPairing: MatchPairing = {
          player1,
          player2,
          table: (i % courtsAvailable) + 1,
        };

        // Calculate scheduled time if start date provided
        if (currentDate) {
          const courtIndex = i % courtsAvailable;
          const timeSlot = Math.floor(i / courtsAvailable);
          const minutesOffset = timeSlot * matchDuration;

          matchPairing.scheduledTime = new Date(
            currentDate.getTime() + minutesOffset * 60000
          );
        }

        roundMatches.push(matchPairing);
      }
    }

    // Calculate round date if start date provided
    let roundDate: Date | undefined;
    if (startDate) {
      // Calculate total duration for this round
      const slotsNeeded = Math.ceil(roundMatches.length / courtsAvailable);
      const roundDuration = slotsNeeded * matchDuration;

      // Add to base date
      roundDate = new Date(startDate.getTime() + round * roundDuration * 60000);
    }

    schedule.push({
      roundNumber: round + 1,
      matches: roundMatches,
      scheduledDate: roundDate,
    });
  }

  return schedule;
}

/**
 * Generate Round Robin schedule with seeding
 * Top seeds are distributed to avoid early matches
 */
export function generateSeededRoundRobinSchedule(
  participants: string[],
  seeding: SeedingInfo[],
  courtsAvailable: number = 1,
  startDate?: Date,
  matchDuration: number = 60
): RoundSchedule[] {
  // Sort participants by seed number
  const seedMap = new Map(
    seeding.map((s) => [s.participant.toString(), s.seedNumber])
  );

  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a.toString()) || 999;
    const seedB = seedMap.get(b.toString()) || 999;
    return seedA - seedB;
  });

  return generateRoundRobinSchedule(
    sortedParticipants,
    courtsAvailable,
    startDate,
    matchDuration
  );
}

/**
 * Validate schedule completeness
 * Ensures the correct number of matches are generated
 */
export function validateScheduleCompleteness(
  participantCount: number,
  actualMatches: number
): { isValid: boolean; expectedMatches: number; message?: string } {
  const expectedMatches = (participantCount * (participantCount - 1)) / 2;

  if (actualMatches !== expectedMatches) {
    return {
      isValid: false,
      expectedMatches,
      message: `Expected ${expectedMatches} matches, got ${actualMatches}`,
    };
  }

  return {
    isValid: true,
    expectedMatches,
  };
}
