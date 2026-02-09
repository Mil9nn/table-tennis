/**
 * ITTF-Compliant Leaderboard Sorting Utility
 * 
 * For Leaderboards: Match points → Sets ratio → Points ratio → Sets won → Points scored
 * For Tournaments: Match points → Head-to-head → Sets ratio → Points ratio → Sets won → Points scored
 * 
 * Tie-breaker order:
 * 1. Match points (2 for win, 1 for draw, 0 for loss)
 * 2. Head-to-head result (only for tournaments, skipped for leaderboards)
 * 3. Sets ratio (won/lost)
 * 4. Points ratio (scored/conceded)
 * 5. Total sets won
 * 6. Total points scored (final tiebreaker)
 */

export interface LeaderboardEntry {
  playerId: string;
  wins: number;
  losses: number;
  draws?: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  rank?: number;
  [key: string]: any; // Allow additional properties
}

export type HeadToHeadMap = Map<string, Map<string, number>>; // playerId -> opponentId -> matchPoints

/**
 * Sort leaderboard entries using ITTF tiebreaker rules
 * 
 * @param leaderboard - Array of leaderboard entries
 * @param headToHeadMap - Map of head-to-head records (playerId -> opponentId -> matchPoints)
 * @param skipHeadToHead - If true, skip head-to-head tie-breaker (for global leaderboards)
 * @returns Sorted array with ranks assigned
 */
export function sortLeaderboardWithITTF(
  leaderboard: LeaderboardEntry[],
  headToHeadMap: HeadToHeadMap,
  skipHeadToHead: boolean = false
): LeaderboardEntry[] {
  // Calculate match points for each entry
  leaderboard.forEach((entry) => {
    entry.matchPoints = (entry.wins || 0) * 2 + (entry.draws || 0) * 1;
  });

  // Count how many players are tied at each point level (for head-to-head rule)
  const pointsGroups = new Map<number, number>();
  leaderboard.forEach((entry) => {
    const points = entry.matchPoints || 0;
    pointsGroups.set(points, (pointsGroups.get(points) || 0) + 1);
  });

  // Sort using ITTF tiebreaker rules
  leaderboard.sort((a, b) => {
    const matchPointsA = a.matchPoints || 0;
    const matchPointsB = b.matchPoints || 0;

    // 1. Match points
    if (matchPointsB !== matchPointsA) return matchPointsB - matchPointsA;

    // 2. Head-to-head (skip for leaderboards, only use in tournaments)
    if (!skipHeadToHead) {
      const playersAtThisLevel = pointsGroups.get(matchPointsA) || 0;

      if (playersAtThisLevel === 2) {
        // Two-way tie: direct head-to-head
        const h2hA = headToHeadMap.get(a.playerId)?.get(b.playerId);
        const h2hB = headToHeadMap.get(b.playerId)?.get(a.playerId);
        if (h2hA !== undefined && h2hB !== undefined && h2hB !== h2hA) {
          return h2hB - h2hA;
        }
      } else if (playersAtThisLevel > 2) {
        // Multi-way tie: create mini-league of tied players
        const tiedPlayers = leaderboard.filter((e) => (e.matchPoints || 0) === matchPointsA);
        const tiedIds = new Set(tiedPlayers.map((e) => e.playerId));

        // Calculate mini-league points (only matches between tied players)
        const aMiniPoints = Array.from(headToHeadMap.get(a.playerId)?.entries() || [])
          .filter(([opponentId]) => tiedIds.has(opponentId))
          .reduce((sum, [, points]) => sum + points, 0);
        const bMiniPoints = Array.from(headToHeadMap.get(b.playerId)?.entries() || [])
          .filter(([opponentId]) => tiedIds.has(opponentId))
          .reduce((sum, [, points]) => sum + points, 0);

        if (aMiniPoints !== bMiniPoints) {
          return bMiniPoints - aMiniPoints;
        }
      }
    }

    // 3. Sets ratio (won/lost) - higher is better
    const setsRatioA = calculateRatio(a.setsWon, a.setsLost);
    const setsRatioB = calculateRatio(b.setsWon, b.setsLost);
    if (setsRatioA !== setsRatioB) {
      return compareRatios(setsRatioB, setsRatioA);
    }

    // 4. Points ratio (scored/conceded) - higher is better
    const pointsRatioA = calculateRatio(a.pointsScored, a.pointsConceded);
    const pointsRatioB = calculateRatio(b.pointsScored, b.pointsConceded);
    if (pointsRatioA !== pointsRatioB) {
      return compareRatios(pointsRatioB, pointsRatioA);
    }

    // 5. Total sets won
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;

    // 6. Total points scored (final tiebreaker)
    return b.pointsScored - a.pointsScored;
  });

  // Assign ranks
  assignRanks(leaderboard);

  return leaderboard;
}

/**
 * Calculate ratio safely (handles division by zero)
 */
function calculateRatio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return numerator > 0 ? Infinity : 0;
  }
  return numerator / denominator;
}

/**
 * Compare ratios safely (handles Infinity)
 */
function compareRatios(a: number, b: number): number {
  if (a === Infinity && b !== Infinity) return -1; // A is better
  if (b === Infinity && a !== Infinity) return 1; // B is better
  return a - b;
}

/**
 * Assign ranks to sorted leaderboard (handling ties)
 * Players with identical stats share the same rank
 */
function assignRanks(leaderboard: LeaderboardEntry[]): void {
  let currentRank = 1;
  leaderboard.forEach((entry, index) => {
    if (index > 0) {
      const prev = leaderboard[index - 1];

      // Check if truly tied on ALL criteria
      const isTrulyTied =
        (entry.matchPoints || 0) === (prev.matchPoints || 0) &&
        entry.setsWon === prev.setsWon &&
        entry.setsLost === prev.setsLost &&
        entry.pointsScored === prev.pointsScored &&
        entry.pointsConceded === prev.pointsConceded;

      // If not tied, increment rank
      if (!isTrulyTied) {
        currentRank = index + 1;
      }
    } else {
      currentRank = 1;
    }
    entry.rank = currentRank;
  });
}

