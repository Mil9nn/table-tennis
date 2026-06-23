/**
 * Scoring Rules
 *
 * Shared scoring logic used by both client (Zustand) and server (API routes).
 * Single source of truth for game/match win conditions.
 */

/**
 * Check if a game is won based on current scores
 *
 * @param score1 - First side's score
 * @param score2 - Second side's score
 * @param pointsToWin - Points needed to win (default: 11 for table tennis)
 * @returns true if the game is won
 */
export function isGameWon(
  score1: number,
  score2: number,
  pointsToWin: number = 11
): boolean {
  const maxScore = Math.max(score1, score2);
  const minScore = Math.min(score1, score2);

  return maxScore >= pointsToWin && maxScore - minScore >= 2;
}

/**
 * Get the winner of a game
 *
 * @param score1 - First side's score
 * @param score2 - Second side's score
 * @param pointsToWin - Points needed to win (default: 11)
 * @returns "side1" | "side2" | null
 */
export function getGameWinner<T extends string>(
  score1: number,
  score2: number,
  side1Label: T,
  side2Label: T,
  pointsToWin: number = 11
): T | null {
  if (!isGameWon(score1, score2, pointsToWin)) {
    return null;
  }
  return score1 > score2 ? side1Label : side2Label;
}

/**
 * Check if a match (best of N sets) is won
 *
 * @param sets1 - First side's sets won
 * @param sets2 - Second side's sets won
 * @param bestOf - Total number of sets (e.g., 3, 5, 7)
 * @returns true if the match is won
 */
export function isMatchWon(
  sets1: number,
  sets2: number,
  bestOf: number
): boolean {
  const setsToWin = Math.ceil(bestOf / 2);
  return sets1 >= setsToWin || sets2 >= setsToWin;
}

/**
 * Get the winner of a match
 *
 * @param sets1 - First side's sets won
 * @param sets2 - Second side's sets won
 * @param bestOf - Total number of sets
 * @returns winner label or null
 */
export function getMatchWinner<T extends string>(
  sets1: number,
  sets2: number,
  side1Label: T,
  side2Label: T,
  bestOf: number
): T | null {
  const setsToWin = Math.ceil(bestOf / 2);

  if (sets1 >= setsToWin) return side1Label;
  if (sets2 >= setsToWin) return side2Label;
  return null;
}

/**
 * Check if a team match is won (based on submatches won)
 *
 * @param matches1 - Team 1's submatches won
 * @param matches2 - Team 2's submatches won
 * @param totalSubMatches - Total number of submatches
 * @returns true if the team match is won
 */
export function isTeamMatchWon(
  matches1: number,
  matches2: number,
  totalSubMatches: number
): boolean {
  const matchesToWin = Math.ceil(totalSubMatches / 2);
  return matches1 >= matchesToWin || matches2 >= matchesToWin;
}

/**
 * Get team match winner
 */
export function getTeamMatchWinner(
  matches1: number,
  matches2: number,
  totalSubMatches: number
): "team1" | "team2" | null {
  const matchesToWin = Math.ceil(totalSubMatches / 2);

  if (matches1 >= matchesToWin) return "team1";
  if (matches2 >= matchesToWin) return "team2";
  return null;
}

/**
 * Calculate if it's deuce (both players at 10 or more)
 */
export function isDeuce(score1: number, score2: number): boolean {
  return score1 >= 10 && score2 >= 10;
}

/**
 * Get number of sets needed to win
 */
export function getSetsToWin(bestOf: number): number {
  return Math.ceil(bestOf / 2);
}
