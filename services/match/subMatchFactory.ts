/**
 * SubMatch Factory Service
 *
 * Provides factory functions for creating SubMatch objects with validation.
 * Eliminates duplication of SubMatch creation logic across team match generation.
 *
 * Uses canonical types from @/shared/match/teamMatchTypes
 */

import {
  TeamSubMatchBase,
  TeamSubMatchType,
  SinglesSubMatchConfig,
  DoublesSubMatchConfig,
} from "@/shared/match/teamMatchTypes";

/**
 * Create a singles submatch with validation
 *
 * @param config - Configuration for singles submatch
 * @returns TeamSubMatchBase object for singles match
 * @throws Error if player IDs are missing or invalid
 */
export function createSinglesSubMatch(config: SinglesSubMatchConfig): TeamSubMatchBase {
  const { matchNumber, playerTeam1, playerTeam2, numberOfSets } = config;

  if (!playerTeam1 || typeof playerTeam1 !== "string") {
    throw new Error(`Invalid playerTeam1 for match ${matchNumber}`);
  }
  if (!playerTeam2 || typeof playerTeam2 !== "string") {
    throw new Error(`Invalid playerTeam2 for match ${matchNumber}`);
  }
  if (numberOfSets <= 0) {
    throw new Error(`Invalid numberOfSets for match ${matchNumber}`);
  }

  return {
    matchNumber,
    matchType: "singles" as TeamSubMatchType,
    playerTeam1: [playerTeam1],
    playerTeam2: [playerTeam2],
    numberOfSets,
    games: [],
    finalScore: { team1Sets: 0, team2Sets: 0 },
    winnerSide: null,
    status: "scheduled",
    completed: false,
  };
}

/**
 * Create a doubles submatch with validation
 *
 * @param config - Configuration for doubles submatch
 * @returns TeamSubMatchBase object for doubles match
 * @throws Error if player IDs are missing, invalid, or not exactly 2 per team
 */
export function createDoublesSubMatch(config: DoublesSubMatchConfig): TeamSubMatchBase {
  const { matchNumber, playerTeam1, playerTeam2, numberOfSets } = config;

  if (!Array.isArray(playerTeam1) || playerTeam1.length !== 2) {
    throw new Error(
      `Invalid playerTeam1 for doubles match ${matchNumber}. Expected array of 2 player IDs, got: ${JSON.stringify(playerTeam1)}`
    );
  }
  if (!Array.isArray(playerTeam2) || playerTeam2.length !== 2) {
    throw new Error(
      `Invalid playerTeam2 for doubles match ${matchNumber}. Expected array of 2 player IDs, got: ${JSON.stringify(playerTeam2)}`
    );
  }
  if (playerTeam1.some((id) => !id || typeof id !== "string")) {
    throw new Error(`Invalid player ID in playerTeam1 for match ${matchNumber}`);
  }
  if (playerTeam2.some((id) => !id || typeof id !== "string")) {
    throw new Error(`Invalid player ID in playerTeam2 for match ${matchNumber}`);
  }
  if (numberOfSets <= 0) {
    throw new Error(`Invalid numberOfSets for match ${matchNumber}`);
  }

  return {
    matchNumber,
    matchType: "doubles" as TeamSubMatchType,
    playerTeam1: [...playerTeam1],
    playerTeam2: [...playerTeam2],
    numberOfSets,
    games: [],
    finalScore: { team1Sets: 0, team2Sets: 0 },
    winnerSide: null,
    status: "scheduled",
    completed: false,
  };
}

/**
 * Create a submatch based on match type (convenience function)
 *
 * @param matchType - "singles" or "doubles"
 * @param config - Configuration object (structure depends on matchType)
 * @returns TeamSubMatchBase object
 */
export function createSubMatch(
  matchType: TeamSubMatchType,
  config: SinglesSubMatchConfig | DoublesSubMatchConfig
): TeamSubMatchBase {
  if (matchType === "singles") {
    return createSinglesSubMatch(config as SinglesSubMatchConfig);
  } else {
    return createDoublesSubMatch(config as DoublesSubMatchConfig);
  }
}
