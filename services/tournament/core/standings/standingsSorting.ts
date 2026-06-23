// services/tournament/core/standings/standingsSorting.ts

import { StandingData } from "../../types/tournament.types";

/**
 * Sort standings using ITTF tiebreaker rules
 * 
 * ITTF Tiebreaker Order:
 * 1. Match points (2 for win, 1 for draw, 0 for loss)
 * 2. Head-to-head result (mini-league for 3+ way ties)
 * 3. Sets ratio (won/lost)
 * 4. Points ratio (scored/conceded)
 * 5. Sets won
 * 6. Points scored (final tiebreaker)
 */
export function sortStandingsWithTiebreakers(standings: StandingData[]): StandingData[] {
  // Count how many players are tied at each point level (for head-to-head rule)
  const pointsGroups = new Map<number, number>();
  standings.forEach((s) => {
    pointsGroups.set(s.points, (pointsGroups.get(s.points) || 0) + 1);
  });

  // Sort using ITTF tiebreaker rules
  standings.sort((a, b) => {
    // 1. Match points
    if (b.points !== a.points) return b.points - a.points;

    // 2. Head-to-head (for 2-way ties: direct comparison, for 3+ way ties: mini-league)
    const playersAtThisLevel = pointsGroups.get(a.points) || 0;

    if (playersAtThisLevel === 2) {
      // Two-way tie: direct head-to-head
      const h2hA = a.headToHead.get(b.participant);
      const h2hB = b.headToHead.get(a.participant);
      if (h2hA !== undefined && h2hB !== undefined && h2hB !== h2hA) {
        return h2hB - h2hA;
      }
    } else if (playersAtThisLevel > 2) {
      // Multi-way tie: create mini-league of tied players
      const tiedPlayers = standings.filter((s) => s.points === a.points);
      const tiedIds = new Set(tiedPlayers.map((s) => s.participant));

      // Calculate mini-league points (only matches between tied players)
      const aMiniPoints = Array.from(a.headToHead.entries())
        .filter(([opponentId]) => tiedIds.has(opponentId))
        .reduce((sum, [, points]) => sum + points, 0);
      const bMiniPoints = Array.from(b.headToHead.entries())
        .filter(([opponentId]) => tiedIds.has(opponentId))
        .reduce((sum, [, points]) => sum + points, 0);

      if (aMiniPoints !== bMiniPoints) {
        return bMiniPoints - aMiniPoints;
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
  assignRanks(standings);

  return standings;
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
 * Assign ranks to sorted standings (handling ties)
 * 
 * CRITICAL: This function assumes no duplicate participants.
 * Duplicates should be filtered out before calling this function.
 */
function assignRanks(standings: StandingData[]): void {
  
  
  // First, ensure no duplicate participants (safety check)
  const seenParticipants = new Set<string>();
  const uniqueStandings: StandingData[] = [];
  
  for (const standing of standings) {
    const participantId = standing.participant.toString();
    if (!seenParticipants.has(participantId)) {
      seenParticipants.add(participantId);
      uniqueStandings.push(standing);
    } else {
      // Log warning if duplicate found (shouldn't happen with new architecture)
      console.warn(
        `🟡 [RANKING] ⚠️ DUPLICATE PARTICIPANT FOUND: ${participantId}. This should not happen.`
      );
      console.warn(`🟡 [RANKING] Duplicate standing:`, {
        participant: standing.participant,
        points: standing.points,
        played: standing.played
      });
    }
  }
  
  

  // Assign ranks to unique standings only
  let currentRank = 1;
  uniqueStandings.forEach((standing, index) => {
    if (index > 0) {
      const prev = uniqueStandings[index - 1];

      // Check if truly tied on ALL criteria
      const isTrulyTied =
        standing.points === prev.points &&
        standing.setsWon === prev.setsWon &&
        standing.setsLost === prev.setsLost &&
        standing.pointsScored === prev.pointsScored &&
        standing.pointsConceded === prev.pointsConceded;

      // CRITICAL FIX: If not tied, increment rank by 1 (don't set to index + 1)
      // This ensures sequential ranks: 1, 2, 3, 4... instead of 1, 2, 2, 4...
      if (!isTrulyTied) {
        currentRank = currentRank + 1; // Increment, don't set to index + 1
      }
      
     
    } else {
     
    }
    standing.rank = currentRank;
  });
  
  

  // Replace original array with unique standings
  standings.length = 0;
  standings.push(...uniqueStandings);
}

