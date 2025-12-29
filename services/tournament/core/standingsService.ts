// services/tournament/core/standingsService.ts

import {
  MatchResult,
  StandingData,
  TournamentRules,
} from "../types/tournament.types";

/**
 * Standings Service
 * Implements ITTF-compliant standings calculation with tiebreaker rules
 *
 * ITTF Tiebreaker Order:
 * 1. Match points (2 for win, 1 for draw, 0 for loss)
 * 2. Head-to-head result (mini-league for 3+ way ties)
 * 3. Sets ratio (won/lost)
 * 4. Points ratio (scored/conceded)
 * 5. Sets won
 * 6. Points scored (final tiebreaker)
 */

/**
 * Calculate standings with ITTF-compliant tiebreaker rules
 *
 * @param participants - Array of participant IDs
 * @param matches - Array of completed matches
 * @param rules - Tournament rules for point allocation
 * @returns Sorted array of standings with ranks
 */
export function calculateStandings(
  participants: string[],
  matches: MatchResult[],
  rules: TournamentRules
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
    // CRITICAL: If match has 2 participants, they are already pair IDs (for doubles with pairs)
    // or individual player IDs (for singles). If it has 4 participants, it's doubles without pairs.
    const isDoublesWith4Players = match.participants && match.participants.length === 4;
    const isDoublesWithPairIds = match.participants && match.participants.length === 2;

    // Get team/player IDs for standings
    let p1Id: string;
    let p2Id: string;

    if (isDoublesWith4Players) {
      // Legacy format: doubles without pair IDs - use first player of each team
      // Both players in a team share the same stats (handled via syncPartnerStats)
      p1Id = match.participants[0]?.toString();
      p2Id = match.participants[2]?.toString();
    } else {
      // Either singles (2 player IDs) or doubles with pair IDs (2 pair IDs)
      // In both cases, treat as single entities - no partner syncing needed
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

    // For legacy doubles format (4 players), get partner IDs for syncing stats
    // For doubles with pair IDs (2 participants), no syncing needed - each pair is already unique
    let p1PartnerId: string | null = null;
    let p2PartnerId: string | null = null;
    if (isDoublesWith4Players) {
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

    // For legacy doubles format (4 players), sync partner stats (they share the same team record)
    // For doubles with pair IDs (2 participants), NO syncing needed - pairs are already unique entities
    if (isDoublesWith4Players && p1PartnerId && p2PartnerId) {
      syncPartnerStats(standingsMap, p1Id, p1PartnerId);
      syncPartnerStats(standingsMap, p2Id, p2PartnerId);
    }
  });

  // Calculate differences
  standingsMap.forEach((stats) => {
    stats.setsDiff = stats.setsWon - stats.setsLost;
    stats.pointsDiff = stats.pointsScored - stats.pointsConceded;
  });

  // Convert to array and sort
  const standings = Array.from(standingsMap.values());
  return sortStandingsWithTiebreakers(standings);
}

/**
 * Sync partner stats in doubles tournaments
 */
function syncPartnerStats(
  standingsMap: Map<string, StandingData>,
  leaderId: string,
  partnerId: string
): void {
  const leaderStats = standingsMap.get(leaderId);
  const partnerStats = standingsMap.get(partnerId);

  if (!leaderStats || !partnerStats) return;

  // Sync all stats with team leader
  partnerStats.played = leaderStats.played;
  partnerStats.won = leaderStats.won;
  partnerStats.lost = leaderStats.lost;
  partnerStats.drawn = leaderStats.drawn;
  partnerStats.setsWon = leaderStats.setsWon;
  partnerStats.setsLost = leaderStats.setsLost;
  partnerStats.setsDiff = leaderStats.setsDiff;
  partnerStats.pointsScored = leaderStats.pointsScored;
  partnerStats.pointsConceded = leaderStats.pointsConceded;
  partnerStats.pointsDiff = leaderStats.pointsDiff;
  partnerStats.points = leaderStats.points;
  partnerStats.form = [...leaderStats.form];
  partnerStats.headToHead = new Map(leaderStats.headToHead);
}

/**
 * Sort standings using ITTF tiebreaker rules
 */
function sortStandingsWithTiebreakers(standings: StandingData[]): StandingData[] {
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
 */
function assignRanks(standings: StandingData[]): void {
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
}

/**
 * Get standings for a specific group of participants
 * Useful for group stage calculations
 */
export function calculateGroupStandings(
  participants: string[],
  allMatches: MatchResult[],
  rules: TournamentRules,
  groupId?: string
): StandingData[] {
  // Filter matches for this group if groupId provided
  const groupMatches = groupId
    ? allMatches.filter((m) => (m as any).groupId === groupId)
    : allMatches;

  return calculateStandings(participants, groupMatches, rules);
}

/**
 * Extract head-to-head record between two participants
 */
export function getHeadToHeadRecord(
  participant1Id: string,
  participant2Id: string,
  matches: MatchResult[]
): {
  played: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
} {
  const h2hMatches = matches.filter(
    (m) =>
      m.status === "completed" &&
      m.participants.includes(participant1Id) &&
      m.participants.includes(participant2Id)
  );

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;

  h2hMatches.forEach((match) => {
    const p1Index = match.participants.indexOf(participant1Id);
    const p1Side = p1Index === 0 ? "side1" : "side2";

    if (match.winnerSide === p1Side) {
      p1Wins++;
    } else if (match.winnerSide === null) {
      draws++;
    } else {
      p2Wins++;
    }
  });

  return {
    played: h2hMatches.length,
    p1Wins,
    p2Wins,
    draws,
  };
}
