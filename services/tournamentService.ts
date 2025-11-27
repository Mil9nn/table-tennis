// services/tournamentService.ts
import mongoose from "mongoose";
import { IStanding } from "@/models/Tournament";

/**
 * ITTF-Compliant Round Robin Tournament Service
 * Implements Berger tables algorithm and ITTF tiebreaker rules
 */

// ============================================================================
// ROUND ROBIN SCHEDULING - Berger Tables Algorithm
// ============================================================================

export interface MatchPairing {
  player1: string;
  player2: string;
  table?: number;
  scheduledTime?: Date;
}

export interface RoundSchedule {
  roundNumber: number;
  matches: MatchPairing[];
  scheduledDate?: Date;
}

/**
 * Generate Round Robin schedule using Berger Tables algorithm
 * This ensures fair scheduling where each player plays every other player once
 * and no player has consecutive matches when possible
 *
 * @param participants - Array of participant IDs
 * @param courtsAvailable - Number of courts/tables available
 * @param startDate - Tournament start date (optional)
 * @param matchDuration - Duration per match in minutes (optional)
 * @returns Array of rounds with match pairings
 */
export function generateRoundRobinSchedule(
  participants: string[],
  courtsAvailable: number = 1,
  startDate?: Date,
  matchDuration: number = 60
): RoundSchedule[] {
  const n = participants.length;
  if (n < 2) {
    throw new Error("At least 2 participants required");
  }

  // Add dummy player if odd number of participants (represents a "bye")
  const hasBye = n % 2 === 1;
  const players = hasBye ? [...participants, "BYE"] : [...participants];
  const totalPlayers = players.length;
  const numRounds = totalPlayers - 1;
  const matchesPerRound = totalPlayers / 2;

  const schedule: RoundSchedule[] = [];

  /**
   * Berger Tables Algorithm:
   * - Fix one player (usually highest seed) in position
   * - Rotate all other players clockwise
   * - Create pairings by matching opposite positions
   */
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: MatchPairing[] = [];
    let currentDate = startDate;

    for (let match = 0; match < matchesPerRound; match++) {
      // Calculate positions using round-robin rotation
      const home = (round + match) % (totalPlayers - 1);
      const away = (totalPlayers - 1 - match + round) % (totalPlayers - 1);

      // First player is fixed, others rotate
      const player1 = match === 0 ? players[totalPlayers - 1] : players[home];
      const player2 = players[away];

      // Skip bye matches
      if (player1 !== "BYE" && player2 !== "BYE") {
        // ❗ NEW: Prevent duplicate matchups (A vs B or B vs A)
        const alreadyPlayed = schedule.some((r) =>
          r.matches.some(
            (m) =>
              (m.player1 === player1 && m.player2 === player2) ||
              (m.player1 === player2 && m.player2 === player1)
          )
        );

        if (!alreadyPlayed) {
          const matchPairing: MatchPairing = {
            player1,
            player2,
            table: (match % courtsAvailable) + 1,
          };

          // Calculate scheduled time if start date provided
          if (currentDate) {
            const courtIndex = match % courtsAvailable;
            const timeSlot = Math.floor(match / courtsAvailable);
            const minutesOffset = timeSlot * matchDuration;

            matchPairing.scheduledTime = new Date(
              currentDate.getTime() + minutesOffset * 60000
            );
          }

          roundMatches.push(matchPairing);
        }
      }
    }

    // Calculate round date if start date provided
    let roundDate: Date | undefined;
    if (startDate) {
      // Calculate total duration for this round
      const slotsNeeded = Math.ceil(roundMatches.length / courtsAvailable);
      const roundDuration = slotsNeeded * matchDuration;

      // Add to base date
      roundDate = new Date(startDate.getTime() + round * roundDuration * 60000);
    }

    schedule.push({
      roundNumber: round + 1,
      matches: roundMatches,
      scheduledDate: roundDate,
    });
  }

  return schedule;
}

/**
 * Generate Round Robin schedule with seeding
 * Top seeds are distributed to avoid early matches
 */
export function generateSeededRoundRobinSchedule(
  participants: string[],
  seeding: { participant: string; seedNumber: number }[],
  courtsAvailable: number = 1,
  startDate?: Date,
  matchDuration: number = 60
): RoundSchedule[] {
  // Sort participants by seed number
  const seedMap = new Map(
    seeding.map((s) => [s.participant.toString(), s.seedNumber])
  );

  const sortedParticipants = [...participants].sort((a, b) => {
    const seedA = seedMap.get(a.toString()) || 999;
    const seedB = seedMap.get(b.toString()) || 999;
    return seedA - seedB;
  });

  return generateRoundRobinSchedule(
    sortedParticipants,
    courtsAvailable,
    startDate,
    matchDuration
  );
}

// ============================================================================
// GROUP/POOL GENERATION
// ============================================================================

export interface GroupAllocation {
  groupId: string;
  groupName: string;
  participants: string[];
}

/**
 * Allocate participants into groups using snake seeding
 * This ensures balanced groups with fair distribution of seeds
 *
 * Example for 12 players in 3 groups:
 * Group A: Seeds 1, 6, 7, 12
 * Group B: Seeds 2, 5, 8, 11
 * Group C: Seeds 3, 4, 9, 10
 */
export function allocateGroups(
  participants: string[],
  numberOfGroups: number,
  seeding?: { participant: string; seedNumber: number }[]
): GroupAllocation[] {
  if (numberOfGroups < 1) {
    throw new Error("At least 1 group required");
  }

  if (participants.length < numberOfGroups) {
    throw new Error(
      `Not enough participants (${participants.length}) for ${numberOfGroups} groups`
    );
  }

  // Sort by seeding if provided, otherwise use original order
  let sortedParticipants = [...participants];
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

// ============================================================================
// ITTF-COMPLIANT STANDINGS CALCULATION
// ============================================================================

export interface MatchResult {
  _id: string;
  participants: string[];
  winnerSide: "side1" | "side2" | null;
  finalScore: {
    side1Sets: number;
    side2Sets: number;
  };
  games: Array<{
    side1Score: number;
    side2Score: number;
  }>;
  status: string;
}

export interface StandingData {
  participant: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  points: number;
  rank: number;
  form: string[];
  headToHead: Map<string, number>;
}

/**
 * Calculate standings with ITTF-compliant tiebreaker rules
 *
 * ITTF Tiebreaker Order:
 * 1. Match points (2 for win, 1 for draw, 0 for loss)
 * 2. Head-to-head result
 * 3. Sets ratio (won/lost)
 * 4. Points ratio (scored/conceded)
 * 5. Sets won
 */
export function calculateStandings(
  participants: string[],
  matches: MatchResult[],
  rules: {
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    tiebreakRules?: string[];
  }
): StandingData[] {
  // Initialize standings
  const standingsMap = new Map<string, StandingData>();

  participants.forEach((pId) => {
    standingsMap.set(pId, {
      participant: pId,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      pointsScored: 0,
      pointsConceded: 0,
      pointsDiff: 0,
      points: 0,
      rank: 0,
      form: [],
      headToHead: new Map(),
    });
  });

  // Process all completed matches
  const completedMatches = matches.filter((m) => m.status === "completed");

  

  completedMatches.forEach((match) => {
    // Convert ObjectId to string for comparison
    const p1Id = match.participants[0]?.toString();
    const p2Id = match.participants[1]?.toString();

    

    const p1Stats = standingsMap.get(p1Id);
    const p2Stats = standingsMap.get(p2Id);

    if (!p1Stats || !p2Stats) {
      
      return;
    }

    // Update matches played
    p1Stats.played += 1;
    p2Stats.played += 1;

    // Calculate sets and points
    const p1Sets = match.finalScore.side1Sets;
    const p2Sets = match.finalScore.side2Sets;

    p1Stats.setsWon += p1Sets;
    p1Stats.setsLost += p2Sets;
    p2Stats.setsWon += p2Sets;
    p2Stats.setsLost += p1Sets;

    // Calculate points scored/conceded from games
    let p1Points = 0;
    let p2Points = 0;

    match.games.forEach((game) => {
      p1Points += game.side1Score;
      p2Points += game.side2Score;
    });

    p1Stats.pointsScored += p1Points;
    p1Stats.pointsConceded += p2Points;
    p2Stats.pointsScored += p2Points;
    p2Stats.pointsConceded += p1Points;

    // Update match result (win/loss/draw)
    if (match.winnerSide === "side1") {
      p1Stats.won += 1;
      p2Stats.lost += 1;
      p1Stats.points += rules.pointsForWin;
      p2Stats.points += rules.pointsForLoss;
      p1Stats.form.push("W");
      p2Stats.form.push("L");

      // Head-to-head
      p1Stats.headToHead.set(p2Id, rules.pointsForWin);
      p2Stats.headToHead.set(p1Id, rules.pointsForLoss);
    } else if (match.winnerSide === "side2") {
      p2Stats.won += 1;
      p1Stats.lost += 1;
      p2Stats.points += rules.pointsForWin;
      p1Stats.points += rules.pointsForLoss;
      p2Stats.form.push("W");
      p1Stats.form.push("L");

      // Head-to-head
      p2Stats.headToHead.set(p1Id, rules.pointsForWin);
      p1Stats.headToHead.set(p2Id, rules.pointsForLoss);
    } else {
      // Draw (rare in table tennis but possible)
      p1Stats.drawn += 1;
      p2Stats.drawn += 1;
      p1Stats.points += rules.pointsForDraw;
      p2Stats.points += rules.pointsForDraw;
      p1Stats.form.push("D");
      p2Stats.form.push("D");

      // Head-to-head
      p1Stats.headToHead.set(p2Id, rules.pointsForDraw);
      p2Stats.headToHead.set(p1Id, rules.pointsForDraw);
    }

    // Keep only last 5 form results
    if (p1Stats.form.length > 5) p1Stats.form.shift();
    if (p2Stats.form.length > 5) p2Stats.form.shift();
  });

  // Calculate differences
  standingsMap.forEach((stats) => {
    stats.setsDiff = stats.setsWon - stats.setsLost;
    stats.pointsDiff = stats.pointsScored - stats.pointsConceded;
  });

  // Convert to array for sorting
  const standings = Array.from(standingsMap.values());

  // Count how many players are tied at each point level (for head-to-head rule)
  const pointsGroups = new Map<number, number>();
  standings.forEach((s) => {
    pointsGroups.set(s.points, (pointsGroups.get(s.points) || 0) + 1);
  });

  // Sort using ITTF tiebreaker rules
  standings.sort((a, b) => {
    // 1. Match points
    if (b.points !== a.points) return b.points - a.points;

    // 2. Head-to-head (ONLY if exactly 2 players are tied at this point level)
    const playersAtThisLevel = pointsGroups.get(a.points) || 0;

    if (playersAtThisLevel === 2) {
      const h2hA = a.headToHead.get(b.participant);
      const h2hB = b.headToHead.get(a.participant);
      if (h2hA !== undefined && h2hB !== undefined && h2hB !== h2hA) {
        return h2hB - h2hA;
      }
    }

    // 3. Sets ratio (won/lost) - higher is better
    // If no sets lost, treat as Infinity (best possible ratio)
    const setsRatioA =
      a.setsLost > 0 ? a.setsWon / a.setsLost : a.setsWon > 0 ? Infinity : 0;
    const setsRatioB =
      b.setsLost > 0 ? b.setsWon / b.setsLost : b.setsWon > 0 ? Infinity : 0;
    if (setsRatioA !== setsRatioB) {
      // Handle Infinity comparison properly
      if (setsRatioA === Infinity && setsRatioB !== Infinity) return -1; // A is better
      if (setsRatioB === Infinity && setsRatioA !== Infinity) return 1; // B is better
      return setsRatioB - setsRatioA;
    }

    // 4. Points ratio (scored/conceded) - higher is better
    // If no points conceded, treat as Infinity
    const pointsRatioA =
      a.pointsConceded > 0
        ? a.pointsScored / a.pointsConceded
        : a.pointsScored > 0
        ? Infinity
        : 0;
    const pointsRatioB =
      b.pointsConceded > 0
        ? b.pointsScored / b.pointsConceded
        : b.pointsScored > 0
        ? Infinity
        : 0;

    if (pointsRatioA !== pointsRatioB) {
      if (pointsRatioA === Infinity && pointsRatioB !== Infinity) return -1;
      if (pointsRatioB === Infinity && pointsRatioA !== Infinity) return 1;
      return pointsRatioB - pointsRatioA;
    }

    // 5. Total sets won
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;

    // 6. Total points scored (final tiebreaker)
    return b.pointsScored - a.pointsScored;
  });

  // Assign ranks (handling ties - only if ALL tiebreakers are equal)
  let currentRank = 1;
  standings.forEach((standing, index) => {
    if (index > 0) {
      const prev = standings[index - 1];

      // Check if truly tied on ALL criteria
      const isTrulyTied =
        standing.points === prev.points &&
        standing.setsWon === prev.setsWon &&
        standing.setsLost === prev.setsLost &&
        standing.pointsScored === prev.pointsScored &&
        standing.pointsConceded === prev.pointsConceded;

      if (!isTrulyTied) {
        currentRank = index + 1;
      }
    }
    standing.rank = currentRank;
  });

  return standings;
}

// ============================================================================
// SEEDING UTILITIES
// ============================================================================

/**
 * Generate random seeding
 */
export function generateRandomSeeding(
  participants: string[]
): { participant: string; seedNumber: number }[] {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return shuffled.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
  }));
}

/**
 * Generate seeding based on player rankings
 * (Would integrate with ITTF rankings in production)
 */
export function generateRankingBasedSeeding(
  participants: string[],
  rankings: Map<string, number>
): { participant: string; seedNumber: number }[] {
  const sorted = [...participants].sort((a, b) => {
    const rankA = rankings.get(a) || 9999;
    const rankB = rankings.get(b) || 9999;
    return rankA - rankB;
  });

  return sorted.map((p, index) => ({
    participant: p,
    seedNumber: index + 1,
  }));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
 * Estimate tournament duration
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
