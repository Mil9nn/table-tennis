/**
 * SubMatch Factory Service
 *
 * Provides factory functions for creating SubMatch objects with validation.
 * Eliminates duplication of SubMatch creation logic across team match generation.
 */

// Types
export interface SinglesSubMatchConfig {
  matchNumber: number;
  playerTeam1: string;
  playerTeam2: string;
  numberOfSets: number;
}

export interface DoublesSubMatchConfig {
  matchNumber: number;
  playerTeam1: [string, string];
  playerTeam2: [string, string];
  numberOfSets: number;
}

export interface SubMatch {
  matchNumber: number;
  matchType: "singles" | "doubles";
  playerTeam1: string | string[];
  playerTeam2: string | string[];
  numberOfSets: number;
  games: any[];
  finalScore: {
    team1Sets: number;
    team2Sets: number;
  };
  winnerSide: null;
  status: "scheduled";
  completed: false;
}

/**
 * Create a singles submatch with validation
 *
 * @param config - Configuration for singles submatch
 * @returns SubMatch object for singles match
 * @throws Error if player IDs are missing or invalid
 */
export function createSinglesSubMatch(config: SinglesSubMatchConfig): SubMatch {
  const { matchNumber, playerTeam1, playerTeam2, numberOfSets } = config;

  // Validation
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
    matchType: "singles",
    playerTeam1,
    playerTeam2,
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
 * @returns SubMatch object for doubles match
 * @throws Error if player IDs are missing, invalid, or not exactly 2 per team
 */
export function createDoublesSubMatch(config: DoublesSubMatchConfig): SubMatch {
  const { matchNumber, playerTeam1, playerTeam2, numberOfSets } = config;

  // Validation
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
    matchType: "doubles",
    playerTeam1,
    playerTeam2,
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
 * @returns SubMatch object
 */
export function createSubMatch(
  matchType: "singles" | "doubles",
  config: SinglesSubMatchConfig | DoublesSubMatchConfig
): SubMatch {
  if (matchType === "singles") {
    return createSinglesSubMatch(config as SinglesSubMatchConfig);
  } else {
    return createDoublesSubMatch(config as DoublesSubMatchConfig);
  }
}
