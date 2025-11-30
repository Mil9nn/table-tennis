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
   * Berger Tables Algorithm (Corrected):
   * - Fix the last player (index n-1) in position
   * - Rotate all other players clockwise each round
   * - Pair fixed player with first rotated player, then pair others symmetrically
   */
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: MatchPairing[] = [];
    let currentDate = startDate;

    // Create rotation array for this round
    const rotated = [...players];
    
    // Rotate players (except the last one which stays fixed)
    if (round > 0) {
      // Rotate all players except the last one clockwise
      const toRotate = rotated.slice(0, totalPlayers - 1);
      const rotationAmount = round;
      const rotatedPart = [
        ...toRotate.slice(rotationAmount),
        ...toRotate.slice(0, rotationAmount)
      ];
      rotated.splice(0, totalPlayers - 1, ...rotatedPart);
    }

    // Create pairings: fixed player (last) vs first, then pair others symmetrically
    for (let i = 0; i < matchesPerRound; i++) {
      const player1 = rotated[i];
      const player2 = rotated[totalPlayers - 1 - i];

      // Skip bye matches
      if (player1 !== "BYE" && player2 !== "BYE") {
        const matchPairing: MatchPairing = {
          player1,
          player2,
          table: (i % courtsAvailable) + 1,
        };

        // Calculate scheduled time if start date provided
        if (currentDate) {
          const courtIndex = i % courtsAvailable;
          const timeSlot = Math.floor(i / courtsAvailable);
          const minutesOffset = timeSlot * matchDuration;

          matchPairing.scheduledTime = new Date(
            currentDate.getTime() + minutesOffset * 60000
          );
        }

        roundMatches.push(matchPairing);
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
    // For doubles: participants[0] and participants[1] are team 1, participants[2] and participants[3] are team 2
    // For singles: participants[0] is player 1, participants[1] is player 2
    const isDoubles = match.participants && match.participants.length === 4;
    
    // Get team/player IDs for standings
    let p1Id: string;
    let p2Id: string;
    
    if (isDoubles) {
      // For doubles, use the first player of each team as the team identifier
      // Both players in a team share the same stats
      p1Id = match.participants[0]?.toString();
      p2Id = match.participants[2]?.toString();
    } else {
      p1Id = match.participants[0]?.toString();
      p2Id = match.participants[1]?.toString();
    }

    if (!p1Id || !p2Id) {
      return;
    }

    const p1Stats = standingsMap.get(p1Id);
    const p2Stats = standingsMap.get(p2Id);

    if (!p1Stats || !p2Stats) {
      return;
    }
    
    // For doubles, get partner IDs for syncing stats later
    let p1PartnerId: string | null = null;
    let p2PartnerId: string | null = null;
    if (isDoubles) {
      p1PartnerId = match.participants[1]?.toString() || null;
      p2PartnerId = match.participants[3]?.toString() || null;
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
    
    // For doubles, sync partner stats (they share the same team record)
    if (isDoubles && p1PartnerId && p2PartnerId) {
      // Sync team 1 partner stats
      if (standingsMap.has(p1PartnerId)) {
        const p1PartnerStats = standingsMap.get(p1PartnerId)!;
        // Sync all stats with team leader
        p1PartnerStats.played = p1Stats.played;
        p1PartnerStats.won = p1Stats.won;
        p1PartnerStats.lost = p1Stats.lost;
        p1PartnerStats.drawn = p1Stats.drawn;
        p1PartnerStats.setsWon = p1Stats.setsWon;
        p1PartnerStats.setsLost = p1Stats.setsLost;
        p1PartnerStats.setsDiff = p1Stats.setsDiff;
        p1PartnerStats.pointsScored = p1Stats.pointsScored;
        p1PartnerStats.pointsConceded = p1Stats.pointsConceded;
        p1PartnerStats.pointsDiff = p1Stats.pointsDiff;
        p1PartnerStats.points = p1Stats.points;
        p1PartnerStats.form = [...p1Stats.form];
        p1PartnerStats.headToHead = new Map(p1Stats.headToHead);
      }
      
      // Sync team 2 partner stats
      if (standingsMap.has(p2PartnerId)) {
        const p2PartnerStats = standingsMap.get(p2PartnerId)!;
        // Sync all stats with team leader
        p2PartnerStats.played = p2Stats.played;
        p2PartnerStats.won = p2Stats.won;
        p2PartnerStats.lost = p2Stats.lost;
        p2PartnerStats.drawn = p2Stats.drawn;
        p2PartnerStats.setsWon = p2Stats.setsWon;
        p2PartnerStats.setsLost = p2Stats.setsLost;
        p2PartnerStats.setsDiff = p2Stats.setsDiff;
        p2PartnerStats.pointsScored = p2Stats.pointsScored;
        p2PartnerStats.pointsConceded = p2Stats.pointsConceded;
        p2PartnerStats.pointsDiff = p2Stats.pointsDiff;
        p2PartnerStats.points = p2Stats.points;
        p2PartnerStats.form = [...p2Stats.form];
        p2PartnerStats.headToHead = new Map(p2Stats.headToHead);
      }
    }
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
      // Multi-way tie: create mini-league of tied players (only matches between tied players count)
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
