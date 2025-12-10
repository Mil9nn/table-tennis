/**
 * Qualification Service
 *
 * Determines which participants qualify from round-robin phase to knockout phase
 * in hybrid tournaments. Supports multiple qualification methods:
 * - Top N overall (based on overall standings)
 * - Top N per group (takes top performers from each group)
 * - Percentage-based (top X% of all participants)
 */

import mongoose from "mongoose";
import { ITournament, IStanding } from "@/models/Tournament";
import { Tournament } from "@/services/tournament/repositories/TournamentRepository";

export interface QualificationResult {
  qualified: mongoose.Types.ObjectId[];
  qualificationRankings: Array<{
    participant: mongoose.Types.ObjectId;
    rank: number;
    points: number;
    group?: string;
  }>;
  method: string;
  totalParticipants: number;
  qualifiedCount: number;
}

/**
 * Qualify participants based on overall standings (all groups combined)
 */
function qualifyTopNOverall(
  tournament: Tournament,
  count: number
): QualificationResult {
  if (!tournament.standings || tournament.standings.length === 0) {
    throw new Error("No standings available for qualification");
  }

  // Sort standings by rank (already sorted, but ensure)
  const sortedStandings = [...tournament.standings].sort(
    (a, b) => a.rank - b.rank
  );

  // Take top N
  const qualified = sortedStandings
    .slice(0, count)
    .map((standing) => standing.participant);

  const qualificationRankings = sortedStandings.slice(0, count).map((s) => ({
    participant: s.participant,
    rank: s.rank,
    points: s.points,
  }));

  return {
    qualified,
    qualificationRankings,
    method: "top_n_overall",
    totalParticipants: tournament.standings.length,
    qualifiedCount: qualified.length,
  };
}

/**
 * Qualify top N participants from each group
 */
function qualifyTopNPerGroup(
  tournament: Tournament,
  countPerGroup: number
): QualificationResult {
  if (!tournament.useGroups || !tournament.groups || tournament.groups.length === 0) {
    throw new Error("Tournament does not have groups configured");
  }

  const qualified: mongoose.Types.ObjectId[] = [];
  const qualificationRankings: Array<{
    participant: mongoose.Types.ObjectId;
    rank: number;
    points: number;
    group?: string;
  }> = [];

  let totalParticipants = 0;

  // Process each group
  for (const group of tournament.groups) {
    if (!group.standings || group.standings.length === 0) {
      continue;
    }

    totalParticipants += group.standings.length;

    // Sort group standings by rank
    const sortedGroupStandings = [...group.standings].sort(
      (a, b) => a.rank - b.rank
    );

    // Take top N from this group
    const groupQualified = sortedGroupStandings.slice(0, countPerGroup);

    for (const standing of groupQualified) {
      qualified.push(standing.participant);
      qualificationRankings.push({
        participant: standing.participant,
        rank: standing.rank,
        points: standing.points,
        group: group.groupId,
      });
    }
  }

  return {
    qualified,
    qualificationRankings,
    method: "top_n_per_group",
    totalParticipants,
    qualifiedCount: qualified.length,
  };
}

/**
 * Qualify top percentage of participants
 */
function qualifyByPercentage(
  tournament: Tournament,
  percentage: number
): QualificationResult {
  if (!tournament.standings || tournament.standings.length === 0) {
    throw new Error("No standings available for qualification");
  }

  // Calculate how many qualify based on percentage
  const totalParticipants = tournament.standings.length;
  const qualifyingCount = Math.ceil((percentage / 100) * totalParticipants);

  // Ensure at least 2 qualify and it's a reasonable number
  const finalCount = Math.max(2, Math.min(qualifyingCount, totalParticipants - 1));

  // Use top N overall logic
  return {
    ...qualifyTopNOverall(tournament, finalCount),
    method: "percentage",
  };
}

/**
 * Main function to determine qualified participants
 */
export function determineQualifiedParticipants(
  tournament: Tournament
): QualificationResult {
  if (tournament.format !== "hybrid") {
    throw new Error("Tournament must be hybrid format");
  }

  if (!tournament.hybridConfig) {
    throw new Error("Hybrid configuration is required");
  }

  const config = tournament.hybridConfig;

  // Determine qualification based on method
  switch (config.qualificationMethod) {
    case "top_n_overall":
      if (!config.qualifyingCount) {
        throw new Error("Qualifying count is required for top_n_overall method");
      }
      return qualifyTopNOverall(tournament, config.qualifyingCount);

    case "top_n_per_group":
      if (!config.qualifyingPerGroup) {
        throw new Error(
          "Qualifying per group is required for top_n_per_group method"
        );
      }
      return qualifyTopNPerGroup(tournament, config.qualifyingPerGroup);

    case "percentage":
      if (!config.qualifyingPercentage) {
        throw new Error("Qualifying percentage is required for percentage method");
      }
      return qualifyByPercentage(tournament, config.qualifyingPercentage);

    default:
      throw new Error(
        `Unknown qualification method: ${config.qualificationMethod}`
      );
  }
}

/**
 * Apply qualification results to tournament
 */
export function applyQualificationResults(
  tournament: Tournament,
  result: QualificationResult
): void {
  tournament.qualifiedParticipants = result.qualified;
}

/**
 * Check if a participant qualified for knockout phase
 */
export function isParticipantQualified(
  tournament: Tournament,
  participantId: mongoose.Types.ObjectId | string
): boolean {
  if (!tournament.qualifiedParticipants) {
    return false;
  }

  const participantIdStr = participantId.toString();
  return tournament.qualifiedParticipants.some(
    (p) => p.toString() === participantIdStr
  );
}

/**
 * Get qualification summary for display
 */
export function getQualificationSummary(
  tournament: Tournament
): {
  method: string;
  totalParticipants: number;
  qualifiedCount: number;
  eliminatedCount: number;
  qualificationRate: number;
} | null {
  if (
    tournament.format !== "hybrid" ||
    !tournament.qualifiedParticipants ||
    tournament.qualifiedParticipants.length === 0
  ) {
    return null;
  }

  const totalParticipants = tournament.participants.length;
  const qualifiedCount = tournament.qualifiedParticipants.length;
  const eliminatedCount = totalParticipants - qualifiedCount;
  const qualificationRate = (qualifiedCount / totalParticipants) * 100;

  return {
    method: tournament.hybridConfig?.qualificationMethod || "unknown",
    totalParticipants,
    qualifiedCount,
    eliminatedCount,
    qualificationRate,
  };
}

/**
 * Validate qualification configuration before applying
 */
export function validateQualificationConfig(tournament: Tournament): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (tournament.format !== "hybrid") {
    errors.push("Tournament must be hybrid format");
    return { isValid: false, errors, warnings };
  }

  if (!tournament.hybridConfig) {
    errors.push("Hybrid configuration is required");
    return { isValid: false, errors, warnings };
  }

  const config = tournament.hybridConfig;
  const totalParticipants = tournament.participants.length;

  // Calculate expected qualified count
  let expectedQualifiedCount = 0;

  switch (config.qualificationMethod) {
    case "top_n_overall":
      expectedQualifiedCount = config.qualifyingCount || 0;
      if (expectedQualifiedCount < 2) {
        errors.push("Must qualify at least 2 participants");
      }
      if (expectedQualifiedCount >= totalParticipants) {
        errors.push("Cannot qualify all participants (must eliminate at least one)");
      }
      break;

    case "top_n_per_group":
      if (!config.qualifyingPerGroup) {
        errors.push("Qualifying per group is required");
        break;
      }
      if (!tournament.groups || tournament.groups.length === 0) {
        errors.push("No groups configured");
        break;
      }
      expectedQualifiedCount = config.qualifyingPerGroup * tournament.groups.length;
      if (expectedQualifiedCount >= totalParticipants) {
        errors.push("Too many qualifiers per group (would qualify almost everyone)");
      }
      break;

    case "percentage":
      if (!config.qualifyingPercentage) {
        errors.push("Qualifying percentage is required");
        break;
      }
      expectedQualifiedCount = Math.ceil(
        (config.qualifyingPercentage / 100) * totalParticipants
      );
      if (expectedQualifiedCount < 2) {
        errors.push("Percentage too low (must qualify at least 2 participants)");
      }
      break;
  }

  // Check if qualified count is a power of 2 for clean bracket
  if (expectedQualifiedCount > 0 && !isPowerOfTwo(expectedQualifiedCount)) {
    warnings.push(
      `Qualified count (${expectedQualifiedCount}) is not a power of 2. ` +
        `Byes will be added to reach ${nextPowerOfTwo(expectedQualifiedCount)}.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper: Check if number is power of 2
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Helper: Get next power of 2
 */
function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}
