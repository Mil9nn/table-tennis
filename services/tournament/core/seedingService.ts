// services/tournament/core/seedingService.ts

import mongoose from "mongoose";
import { SeedingInfo } from "../types/tournament.types";

/**
 * Seeding Service
 * Handles tournament seeding algorithms and seed generation
 */

/**
 * Generate random seeding
 * Useful for casual tournaments or when no ranking data is available
 */
export function generateRandomSeeding(
  participants: string[]
): SeedingInfo[] {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
  }));
}

/**
 * Generate seeding based on player rankings
 * Higher ranked players (lower rank number) get better seeds
 *
 * @param participants - Array of participant IDs
 * @param rankings - Map of participant ID to ranking (1 = best)
 * @returns Seeding information sorted by ranking
 */
export function generateRankingBasedSeeding(
  participants: string[],
  rankings: Map<string, number>
): SeedingInfo[] {
  const sorted = [...participants].sort((a, b) => {
    const rankA = rankings.get(a.toString()) || 9999;
    const rankB = rankings.get(b.toString()) || 9999;
    return rankA - rankB;
  });

  return sorted.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
    seedingRank: rankings.get(p.toString()),
  }));
}

/**
 * Generate seeding based on points/rating system
 * Higher points get better seeds
 *
 * @param participants - Array of participant IDs
 * @param points - Map of participant ID to points/rating
 * @returns Seeding information sorted by points (descending)
 */
export function generatePointsBasedSeeding(
  participants: string[],
  points: Map<string, number>
): SeedingInfo[] {
  const sorted = [...participants].sort((a, b) => {
    const pointsA = points.get(a.toString()) || 0;
    const pointsB = points.get(b.toString()) || 0;
    return pointsB - pointsA; // Higher points = better seed
  });

  return sorted.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
    seedingPoints: points.get(p.toString()) || 0,
  }));
}

/**
 * Generate seeding based on registration order
 * First registered gets seed 1
 */
export function generateRegistrationOrderSeeding(
  participants: string[]
): SeedingInfo[] {
  return participants.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
  }));
}

/**
 * Validate seeding configuration
 * Ensures all participants are seeded exactly once
 */
export function validateSeeding(
  participants: string[],
  seeding: SeedingInfo[]
): { isValid: boolean; error?: string } {
  // Check all participants are seeded
  const seededParticipants = new Set(
    seeding.map((s) => s.participant.toString())
  );
  const participantSet = new Set(participants.map((p) => p.toString()));

  if (seededParticipants.size !== participantSet.size) {
    return {
      isValid: false,
      error: "Seeding count mismatch with participants",
    };
  }

  for (const p of participants) {
    if (!seededParticipants.has(p.toString())) {
      return {
        isValid: false,
        error: `Participant ${p} is not seeded`,
      };
    }
  }

  // Check seed numbers are unique and sequential
  const seedNumbers = seeding.map((s) => s.seedNumber).sort((a, b) => a - b);
  const expectedSeeds = Array.from({ length: participants.length }, (_, i) => i + 1);

  if (JSON.stringify(seedNumbers) !== JSON.stringify(expectedSeeds)) {
    return {
      isValid: false,
      error: "Seed numbers must be unique and sequential from 1 to N",
    };
  }

  return { isValid: true };
}

/**
 * Convert seeding to map for quick lookups
 */
export function seedingToMap(seeding: SeedingInfo[]): Map<string, number> {
  return new Map(
    seeding.map((s) => [s.participant.toString(), s.seedNumber])
  );
}

/**
 * Get participant by seed number
 */
export function getParticipantBySeed(
  seeding: SeedingInfo[],
  seedNumber: number
): string | undefined {
  return seeding.find((s) => s.seedNumber === seedNumber)?.participant;
}

/**
 * Get seed number by participant
 */
export function getSeedByParticipant(
  seeding: SeedingInfo[],
  participantId: string
): number | undefined {
  return seeding.find((s) => s.participant.toString() === participantId.toString())
    ?.seedNumber;
}
