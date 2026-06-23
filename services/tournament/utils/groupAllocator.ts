// services/tournament/utils/groupAllocator.ts

import { GroupAllocation, SeedingInfo } from "../types/tournament.types";

/**
 * Group Allocation Utilities
 * Handles distribution of participants into groups/pools
 */

/**
 * Allocate participants into groups using snake seeding
 * This ensures balanced groups with fair distribution of seeds
 *
 * Example for 12 players in 3 groups:
 * Group A: Seeds 1, 6, 7, 12
 * Group B: Seeds 2, 5, 8, 11
 * Group C: Seeds 3, 4, 9, 10
 *
 * @param participants - Array of participant IDs
 * @param numberOfGroups - Number of groups to create
 * @param seeding - Optional seeding information for fair distribution
 * @returns Array of group allocations with balanced participant distribution
 */
export function allocateGroups(
  participants: string[],
  numberOfGroups: number,
  seeding?: SeedingInfo[]
): GroupAllocation[] {
  if (numberOfGroups < 1) {
    throw new Error("At least 1 group required");
  }

  // CRITICAL: Deduplicate participants to prevent duplicate entries in groups
  // Normalize all participant IDs to strings and remove duplicates
  const uniqueParticipants = Array.from(new Set(
    participants.map((p: any) => typeof p === 'string' ? p : String(p))
  ));

  if (uniqueParticipants.length < numberOfGroups) {
    throw new Error(
      `Not enough unique participants (${uniqueParticipants.length}) for ${numberOfGroups} groups`
    );
  }

  // Sort by seeding if provided, otherwise use original order
  let sortedParticipants = [...uniqueParticipants];
  if (seeding && seeding.length > 0) {
    const seedMap = new Map(
      seeding.map((s) => [s.participant.toString(), s.seedNumber])
    );
    sortedParticipants.sort((a, b) => {
      const seedA = seedMap.get(a.toString()) || 999;
      const seedB = seedMap.get(b.toString()) || 999;
      return seedA - seedB;
    });
  }

  // Initialize groups
  const groups: GroupAllocation[] = [];
  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < numberOfGroups; i++) {
    groups.push({
      groupId: groupLabels[i],
      groupName: `Group ${groupLabels[i]}`,
      participants: [],
    });
  }

  // Snake seeding: 1,2,3,4,4,3,2,1,1,2,3,4...
  let currentGroup = 0;
  let direction = 1; // 1 for forward, -1 for backward

  for (const participant of sortedParticipants) {
    groups[currentGroup].participants.push(participant);

    // Move to next group
    currentGroup += direction;

    // Reverse direction at boundaries
    if (currentGroup >= numberOfGroups) {
      currentGroup = numberOfGroups - 1;
      direction = -1;
    } else if (currentGroup < 0) {
      currentGroup = 0;
      direction = 1;
    }
  }

  return groups;
}

/**
 * Calculate optimal number of groups based on participant count
 * Ensures each group has a reasonable size (minimum 3, maximum 8)
 */
export function calculateOptimalGroupCount(
  participantCount: number,
  minGroupSize: number = 3,
  maxGroupSize: number = 8
): number {
  if (participantCount < minGroupSize) {
    return 1;
  }

  // Try to create groups with size between min and max
  for (let groupCount = 2; groupCount <= participantCount; groupCount++) {
    const avgGroupSize = participantCount / groupCount;
    if (avgGroupSize >= minGroupSize && avgGroupSize <= maxGroupSize) {
      return groupCount;
    }
  }

  // Fallback: create groups with minimum size
  return Math.ceil(participantCount / maxGroupSize);
}

/**
 * Validate group configuration
 * Ensures groups are balanced and meet requirements
 */
export function validateGroupConfiguration(
  participants: string[],
  numberOfGroups: number,
  minParticipantsPerGroup: number = 2
): { isValid: boolean; error?: string } {
  if (numberOfGroups < 1) {
    return {
      isValid: false,
      error: "At least 1 group required",
    };
  }

  if (participants.length < numberOfGroups * minParticipantsPerGroup) {
    return {
      isValid: false,
      error: `Need at least ${numberOfGroups * minParticipantsPerGroup} participants for ${numberOfGroups} groups (minimum ${minParticipantsPerGroup} per group)`,
    };
  }

  const avgParticipantsPerGroup = participants.length / numberOfGroups;
  const maxImbalance = 2; // Allow max 2 participants difference between groups

  if (
    Math.ceil(avgParticipantsPerGroup) - Math.floor(avgParticipantsPerGroup) >
    maxImbalance
  ) {
    return {
      isValid: false,
      error: "Groups would be too unbalanced. Consider different group count.",
    };
  }

  return { isValid: true };
}
