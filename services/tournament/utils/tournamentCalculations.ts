// services/tournament/utils/tournamentCalculations.ts

/**
 * Centralized calculation utilities for tournament statistics
 * These functions are pure and have no side effects
 */

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(won: number, played: number): number {
  if (played === 0) return 0;
  return (won / played) * 100;
}

/**
 * Calculate points per match average
 */
export function calculatePointsPerMatch(points: number, played: number): number {
  if (played === 0) return 0;
  return points / played;
}

/**
 * Calculate sets win rate percentage
 */
export function calculateSetsWinRate(setsWon: number, setsLost: number): number {
  const totalSets = setsWon + setsLost;
  if (totalSets === 0) return 0;
  return (setsWon / totalSets) * 100;
}

/**
 * Calculate current streak from form array
 * Returns positive number for win streak, negative for loss streak
 */
export function calculateStreak(form: string[]): number {
  if (form.length === 0) return 0;

  const lastResult = form[form.length - 1];
  let streak = 0;

  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === lastResult) {
      streak += lastResult === "W" ? 1 : lastResult === "L" ? -1 : 0;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest win streak from match history
 */
export function calculateLongestWinStreak(
  matchHistory: Array<{ result: "win" | "loss" | "draw" }>
): number {
  let longestStreak = 0;
  let currentStreak = 0;

  matchHistory.forEach((match) => {
    if (match.result === "win") {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return longestStreak;
}

/**
 * Calculate dominance rating (composite score)
 * Higher score = more dominant performance
 */
export function calculateDominanceRating(stats: {
  won: number;
  played: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsDiff: number;
}): number {
  const { won, played, setsWon, setsLost, setsDiff, pointsDiff } = stats;

  if (played === 0) return 0;

  const winRate = (won / played) * 100;
  const totalSets = setsWon + setsLost;
  const setsWinRate = totalSets > 0 ? (setsWon / totalSets) * 100 : 0;

  // Weighted formula:
  // - 40% win rate
  // - 30% sets win rate
  // - 20% set differential per match
  // - 10% point differential per match
  const dominanceRating =
    winRate * 0.4 +
    setsWinRate * 0.3 +
    (setsDiff / Math.max(played, 1)) * 5 +
    (pointsDiff / Math.max(played, 1)) * 0.5;

  return Math.round(dominanceRating * 100) / 100;
}

/**
 * Calculate average points scored per match
 */
export function calculateAvgPointsScored(
  pointsScored: number,
  played: number
): number {
  if (played === 0) return 0;
  return Math.round((pointsScored / played) * 100) / 100;
}

/**
 * Calculate average points conceded per match
 */
export function calculateAvgPointsConceded(
  pointsConceded: number,
  played: number
): number {
  if (played === 0) return 0;
  return Math.round((pointsConceded / played) * 100) / 100;
}

/**
 * Calculate average set differential per match
 */
export function calculateAvgSetDifferential(
  setsDiff: number,
  played: number
): number {
  if (played === 0) return 0;
  return Math.round((setsDiff / played) * 100) / 100;
}

/**
 * Calculate sets ratio (for tiebreaker logic)
 * Returns Infinity if no sets lost (perfect ratio)
 */
export function calculateSetsRatio(setsWon: number, setsLost: number): number {
  if (setsLost === 0) {
    return setsWon > 0 ? Infinity : 0;
  }
  return setsWon / setsLost;
}

/**
 * Calculate points ratio (for tiebreaker logic)
 * Returns Infinity if no points conceded (perfect ratio)
 */
export function calculatePointsRatio(
  pointsScored: number,
  pointsConceded: number
): number {
  if (pointsConceded === 0) {
    return pointsScored > 0 ? Infinity : 0;
  }
  return pointsScored / pointsConceded;
}

/**
 * Format win rate for display
 */
export function formatWinRate(won: number, played: number): string {
  return `${calculateWinRate(won, played).toFixed(1)}%`;
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return "-";
  const absStreak = Math.abs(streak);
  const type = streak > 0 ? "W" : "L";
  return `${absStreak}${type}`;
}

/**
 * Get streak display data for UI
 */
export function getStreakDisplayData(streak: number): {
  value: number;
  isWinStreak: boolean;
  displayText: string;
  color: "green" | "red" | "gray";
} {
  if (streak === 0) {
    return {
      value: 0,
      isWinStreak: false,
      displayText: "-",
      color: "gray",
    };
  }

  const isWinStreak = streak > 0;
  return {
    value: Math.abs(streak),
    isWinStreak,
    displayText: formatStreak(streak),
    color: isWinStreak ? "green" : "red",
  };
}

/**
 * Calculate tournament completion percentage
 */
export function calculateTournamentProgress(
  completedMatches: number,
  totalMatches: number
): number {
  if (totalMatches === 0) return 0;
  return Math.round((completedMatches / totalMatches) * 100);
}
