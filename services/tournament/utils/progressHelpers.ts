// services/tournament/utils/progressHelpers.ts

import {
  MatchResult,
  TournamentProgress,
  RoundCompletionStatus,
} from "../types/tournament.types";

/**
 * Progress and Status Helper Utilities
 * Handles tournament progress tracking and status calculations
 */

/**
 * Check if all rounds are completed
 */
export function areAllRoundsCompleted(
  rounds: Array<{ matches: string[] }>,
  matches: MatchResult[]
): boolean {
  const matchMap = new Map(matches.map((m) => [m._id.toString(), m]));

  return rounds.every((round) => {
    return round.matches.every((matchId) => {
      const match = matchMap.get(matchId.toString());
      return match && match.status === "completed";
    });
  });
}

/**
 * Get tournament progress percentage
 */
export function getTournamentProgress(
  totalMatches: number,
  completedMatches: number
): number {
  if (totalMatches === 0) return 0;
  return Math.round((completedMatches / totalMatches) * 100);
}

/**
 * Calculate detailed tournament progress
 */
export function calculateTournamentProgress(
  matches: MatchResult[]
): TournamentProgress {
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.status === "completed").length;
  const inProgressMatches = matches.filter((m) => m.status === "in_progress").length;
  const scheduledMatches = matches.filter((m) => m.status === "scheduled").length;

  return {
    totalMatches,
    completedMatches,
    inProgressMatches,
    scheduledMatches,
    percentComplete: getTournamentProgress(totalMatches, completedMatches),
  };
}

/**
 * Get round completion status
 */
export function getRoundCompletionStatus(
  rounds: Array<{ roundNumber: number; matches: string[] }>,
  matches: MatchResult[]
): RoundCompletionStatus[] {
  const matchMap = new Map(matches.map((m) => [m._id.toString(), m]));

  return rounds.map((round) => {
    const roundMatches = round.matches.map((matchId) =>
      matchMap.get(matchId.toString())
    );
    const completedCount = roundMatches.filter(
      (m) => m && m.status === "completed"
    ).length;

    return {
      roundNumber: round.roundNumber,
      totalMatches: round.matches.length,
      completedMatches: completedCount,
      isCompleted: completedCount === round.matches.length,
    };
  });
}

/**
 * Estimate tournament duration in minutes
 */
export function estimateTournamentDuration(
  totalMatches: number,
  matchDuration: number,
  courtsAvailable: number,
  breakBetweenMatches: number = 15
): number {
  const matchesPerSlot = courtsAvailable;
  const totalSlots = Math.ceil(totalMatches / matchesPerSlot);
  const totalMatchTime = totalSlots * matchDuration;
  const totalBreakTime = (totalSlots - 1) * breakBetweenMatches;
  return totalMatchTime + totalBreakTime;
}

/**
 * Estimate tournament end date
 */
export function estimateTournamentEndDate(
  startDate: Date,
  totalMatches: number,
  matchDuration: number,
  courtsAvailable: number,
  breakBetweenMatches: number = 15
): Date {
  const durationMinutes = estimateTournamentDuration(
    totalMatches,
    matchDuration,
    courtsAvailable,
    breakBetweenMatches
  );
  return new Date(startDate.getTime() + durationMinutes * 60000);
}

/**
 * Calculate matches per round for round-robin tournament
 */
export function calculateMatchesPerRound(participantCount: number): number {
  return Math.floor(participantCount / 2);
}

/**
 * Calculate total rounds for round-robin tournament
 */
export function calculateTotalRounds(participantCount: number): number {
  // If odd number, add 1 for bye
  const adjustedCount =
    participantCount % 2 === 0 ? participantCount : participantCount + 1;
  return adjustedCount - 1;
}

/**
 * Calculate total matches for round-robin tournament
 */
export function calculateTotalMatches(participantCount: number): number {
  return (participantCount * (participantCount - 1)) / 2;
}

/**
 * Check if tournament is completed
 */
export function isTournamentCompleted(matches: MatchResult[]): boolean {
  if (matches.length === 0) return false;
  return matches.every((m) => m.status === "completed");
}

/**
 * Check if tournament has started
 */
export function isTournamentStarted(matches: MatchResult[]): boolean {
  return matches.some(
    (m) => m.status === "in_progress" || m.status === "completed"
  );
}

/**
 * Get next match to be played
 */
export function getNextMatch(
  matches: MatchResult[]
): MatchResult | undefined {
  return matches.find((m) => m.status === "scheduled");
}

/**
 * Get currently playing matches
 */
export function getInProgressMatches(matches: MatchResult[]): MatchResult[] {
  return matches.filter((m) => m.status === "in_progress");
}

/**
 * Get completed matches count
 */
export function getCompletedMatchesCount(matches: MatchResult[]): number {
  return matches.filter((m) => m.status === "completed").length;
}

/**
 * Calculate tournament status based on matches
 */
export function calculateTournamentStatus(
  matches: MatchResult[]
): "not_started" | "upcoming" | "in_progress" | "completed" {
  if (matches.length === 0) return "not_started";

  const hasCompleted = matches.some((m) => m.status === "completed");
  const hasInProgress = matches.some((m) => m.status === "in_progress");
  const allCompleted = matches.every((m) => m.status === "completed");

  if (allCompleted) return "completed";
  if (hasCompleted || hasInProgress) return "in_progress";
  return "upcoming";
}
