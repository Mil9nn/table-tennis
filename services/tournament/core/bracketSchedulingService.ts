// services/tournament/core/bracketSchedulingService.ts

import {
  KnockoutBracket,
  BracketRound,
  BracketMatch,
} from "@/types/tournamentDraw";

/**
 * Bracket Scheduling Service
 * Handles scheduling of knockout bracket matches across courts and time slots
 */

interface SchedulingOptions {
  courtsAvailable: number;
  matchDuration: number; // in minutes
  breakBetweenRounds?: number; // in minutes, default 30
  breakBetweenMatches?: number; // in minutes, default 0
}

/**
 * Schedule all bracket matches
 * @param bracket - The knockout bracket
 * @param startDate - Tournament start date
 * @param courtsAvailable - Number of courts available
 * @param matchDuration - Match duration in minutes
 * @returns Updated bracket with scheduled dates
 */
export function scheduleBracketMatches(
  bracket: KnockoutBracket,
  startDate: Date,
  courtsAvailable: number,
  matchDuration: number
): KnockoutBracket {
  let currentDate = new Date(startDate);

  // Schedule each round
  for (const round of bracket.rounds) {
    const scheduledRound = scheduleRound(
      round,
      currentDate,
      courtsAvailable,
      matchDuration
    );

    // Update round scheduled date
    round.scheduledDate = scheduledRound.scheduledDate;

    // Update each match with its scheduled time
    for (let i = 0; i < round.matches.length; i++) {
      round.matches[i].scheduledDate = scheduledRound.matches[i].scheduledDate;
      round.matches[i].courtNumber = scheduledRound.matches[i].courtNumber;
    }

    // Calculate next round start date
    currentDate = calculateRoundDate(
      bracket,
      round.roundNumber + 1,
      startDate,
      matchDuration
    );
  }

  // Schedule third place match if it exists (same time as final)
  if (bracket.thirdPlaceMatch && bracket.rounds.length > 0) {
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    bracket.thirdPlaceMatch.scheduledDate = finalRound.scheduledDate;
  }

  return bracket;
}

/**
 * Schedule a specific round
 * @param round - The bracket round to schedule
 * @param startDate - Start date for this round
 * @param courtsAvailable - Number of courts available
 * @param matchDuration - Match duration in minutes
 * @returns Round with scheduled matches
 */
export function scheduleRound(
  round: BracketRound,
  startDate: Date,
  courtsAvailable: number,
  matchDuration: number
): BracketRound {
  const scheduledMatches: BracketMatch[] = [...round.matches];
  const breakBetweenMatches = 0; // No break between matches on different courts

  let currentTime = new Date(startDate);
  let courtAssignments: Date[] = new Array(courtsAvailable).fill(currentTime);

  // Only schedule matches that have both participants (or are bye matches)
  const matchesToSchedule = scheduledMatches.filter(
    (m) => m.participant1 !== null || m.participant2 !== null || m.completed
  );

  for (let i = 0; i < matchesToSchedule.length; i++) {
    const match = matchesToSchedule[i];

    // Find the earliest available court
    let earliestCourtIndex = 0;
    let earliestTime = courtAssignments[0];

    for (let courtIndex = 1; courtIndex < courtsAvailable; courtIndex++) {
      if (courtAssignments[courtIndex] < earliestTime) {
        earliestTime = courtAssignments[courtIndex];
        earliestCourtIndex = courtIndex;
      }
    }

    // Schedule match on this court
    match.scheduledDate = new Date(earliestTime);
    match.courtNumber = earliestCourtIndex + 1;

    // Update court availability (add match duration)
    const matchEndTime = new Date(earliestTime);
    matchEndTime.setMinutes(matchEndTime.getMinutes() + matchDuration + breakBetweenMatches);
    courtAssignments[earliestCourtIndex] = matchEndTime;
  }

  // Set round scheduled date to the start time of the first match
  round.scheduledDate = new Date(startDate);

  return round;
}

/**
 * Calculate when a specific round should start
 * @param bracket - The knockout bracket
 * @param roundNumber - Round number to calculate date for
 * @param startDate - Tournament start date
 * @param matchDuration - Match duration in minutes
 * @returns Date when the round should start
 */
export function calculateRoundDate(
  bracket: KnockoutBracket,
  roundNumber: number,
  startDate: Date,
  matchDuration: number
): Date {
  const breakBetweenRounds = 30; // Default 30 minutes between rounds

  if (roundNumber === 1) {
    return new Date(startDate);
  }

  // Find the previous round
  const previousRound = bracket.rounds.find((r) => r.roundNumber === roundNumber - 1);

  if (!previousRound || !previousRound.scheduledDate) {
    // If previous round not found or not scheduled, estimate based on start date
    const estimatedDuration = matchDuration * (roundNumber - 1) + breakBetweenRounds * (roundNumber - 1);
    const date = new Date(startDate);
    date.setMinutes(date.getMinutes() + estimatedDuration);
    return date;
  }

  // Calculate based on previous round's latest match
  let latestMatchEnd = new Date(previousRound.scheduledDate);

  for (const match of previousRound.matches) {
    if (match.scheduledDate) {
      const matchEnd = new Date(match.scheduledDate);
      matchEnd.setMinutes(matchEnd.getMinutes() + matchDuration);

      if (matchEnd > latestMatchEnd) {
        latestMatchEnd = matchEnd;
      }
    }
  }

  // Add break between rounds
  latestMatchEnd.setMinutes(latestMatchEnd.getMinutes() + breakBetweenRounds);

  return latestMatchEnd;
}

/**
 * Update a specific match's schedule
 * @param bracket - The knockout bracket
 * @param matchId - ID of the match to update
 * @param newDate - New scheduled date
 * @returns Updated bracket
 */
export function updateMatchSchedule(
  bracket: KnockoutBracket,
  matchId: string,
  newDate: Date
): KnockoutBracket {
  // Find and update the match
  let matchFound = false;

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.matchId === matchId) {
        match.scheduledDate = newDate;
        matchFound = true;
        break;
      }
    }
    if (matchFound) break;
  }

  // Check third place match
  if (!matchFound && bracket.thirdPlaceMatch?.matchId === matchId) {
    bracket.thirdPlaceMatch.scheduledDate = newDate;
    matchFound = true;
  }

  if (!matchFound) {
    throw new Error(`Match ${matchId} not found in bracket`);
  }

  return bracket;
}

/**
 * Get all scheduled matches sorted by date
 * @param bracket - The knockout bracket
 * @returns Array of matches sorted by scheduled date
 */
export function getScheduledMatchesByDate(
  bracket: KnockoutBracket
): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Collect all matches
  for (const round of bracket.rounds) {
    matches.push(...round.matches);
  }

  if (bracket.thirdPlaceMatch) {
    matches.push(bracket.thirdPlaceMatch);
  }

  // Filter only matches with scheduled dates and sort
  return matches
    .filter((m) => m.scheduledDate !== undefined)
    .sort((a, b) => {
      const dateA = a.scheduledDate!.getTime();
      const dateB = b.scheduledDate!.getTime();
      return dateA - dateB;
    });
}

/**
 * Get matches scheduled for a specific court
 * @param bracket - The knockout bracket
 * @param courtNumber - Court number
 * @returns Array of matches on that court
 */
export function getMatchesByCourt(
  bracket: KnockoutBracket,
  courtNumber: number
): BracketMatch[] {
  const matches: BracketMatch[] = [];

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.courtNumber === courtNumber) {
        matches.push(match);
      }
    }
  }

  if (bracket.thirdPlaceMatch?.courtNumber === courtNumber) {
    matches.push(bracket.thirdPlaceMatch);
  }

  return matches;
}

/**
 * Get matches scheduled for a specific date (day)
 * @param bracket - The knockout bracket
 * @param date - Date to check
 * @returns Array of matches on that date
 */
export function getMatchesByDate(
  bracket: KnockoutBracket,
  date: Date
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.scheduledDate) {
        const matchDate = new Date(match.scheduledDate);
        matchDate.setHours(0, 0, 0, 0);

        if (matchDate.getTime() === targetDate.getTime()) {
          matches.push(match);
        }
      }
    }
  }

  if (bracket.thirdPlaceMatch?.scheduledDate) {
    const matchDate = new Date(bracket.thirdPlaceMatch.scheduledDate);
    matchDate.setHours(0, 0, 0, 0);

    if (matchDate.getTime() === targetDate.getTime()) {
      matches.push(bracket.thirdPlaceMatch);
    }
  }

  return matches;
}

/**
 * Reschedule all matches from a specific round onwards
 * @param bracket - The knockout bracket
 * @param fromRound - Round number to start rescheduling from
 * @param startDate - New start date for the round
 * @param options - Scheduling options
 * @returns Updated bracket
 */
export function rescheduleFromRound(
  bracket: KnockoutBracket,
  fromRound: number,
  startDate: Date,
  options: SchedulingOptions
): KnockoutBracket {
  let currentDate = new Date(startDate);

  // Reschedule from the specified round onwards
  for (let i = fromRound - 1; i < bracket.rounds.length; i++) {
    const round = bracket.rounds[i];

    const scheduledRound = scheduleRound(
      round,
      currentDate,
      options.courtsAvailable,
      options.matchDuration
    );

    // Update round scheduled date
    round.scheduledDate = scheduledRound.scheduledDate;

    // Update each match with its scheduled time
    for (let j = 0; j < round.matches.length; j++) {
      round.matches[j].scheduledDate = scheduledRound.matches[j].scheduledDate;
      round.matches[j].courtNumber = scheduledRound.matches[j].courtNumber;
    }

    // Calculate next round start date
    currentDate = calculateRoundDate(
      bracket,
      round.roundNumber + 1,
      startDate,
      options.matchDuration
    );
  }

  // Reschedule third place match if it exists
  if (bracket.thirdPlaceMatch && bracket.rounds.length > 0) {
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    bracket.thirdPlaceMatch.scheduledDate = finalRound.scheduledDate;
  }

  return bracket;
}

/**
 * Get estimated tournament completion date
 * @param bracket - The knockout bracket
 * @param startDate - Tournament start date
 * @param matchDuration - Match duration in minutes
 * @returns Estimated completion date
 */
export function getEstimatedCompletionDate(
  bracket: KnockoutBracket,
  startDate: Date,
  matchDuration: number
): Date {
  const breakBetweenRounds = 30;
  const totalRounds = bracket.rounds.length;

  // Simple estimation: each round takes matchDuration + break
  const totalDuration = totalRounds * (matchDuration + breakBetweenRounds);

  const completionDate = new Date(startDate);
  completionDate.setMinutes(completionDate.getMinutes() + totalDuration);

  return completionDate;
}

/**
 * Check if a court is available at a specific time
 * @param bracket - The knockout bracket
 * @param courtNumber - Court number to check
 * @param startTime - Start time to check
 * @param duration - Duration in minutes
 * @returns True if court is available
 */
export function isCourtAvailable(
  bracket: KnockoutBracket,
  courtNumber: number,
  startTime: Date,
  duration: number
): boolean {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);

  // Check all matches on this court
  const courtMatches = getMatchesByCourt(bracket, courtNumber);

  for (const match of courtMatches) {
    if (match.scheduledDate) {
      const matchStart = match.scheduledDate;
      const matchEnd = new Date(matchStart);
      matchEnd.setMinutes(matchEnd.getMinutes() + duration);

      // Check for overlap
      if (startTime < matchEnd && endTime > matchStart) {
        return false;
      }
    }
  }

  return true;
}
