// services/tournament/core/statisticsService.ts
import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import {
  calculateWinRate,
  calculateSetsWinRate,
  calculateStreak,
  calculateLongestWinStreak,
  calculateDominanceRating,
  calculateAvgPointsScored,
  calculateAvgPointsConceded,
  calculateAvgSetDifferential,
} from "../utils/tournamentCalculations";

/**
 * Statistics Service
 * Handles all tournament leaderboard and player statistics calculations
 */

export interface DetailedPlayerStats {
  participant: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  standing: {
    rank: number;
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
    form: string[];
  };
  advancedStats: {
    winRate: number;
    setsWinRate: number;
    pointsPerMatch: number;
    avgPointsScored: number;
    avgPointsConceded: number;
    avgSetDifferential: number;
    currentStreak: number;
    longestWinStreak: number;
    dominanceRating: number;
  };
  qualificationInfo?: {
    status: "qualified" | "eliminated" | "in_contention" | "pending";
    fromGroup?: string;
    groupRank?: number;
    advancementPosition?: number;
  };
  matchHistory: MatchHistoryEntry[];
  headToHead: HeadToHeadRecord[];
  seedingInfo?: {
    seedNumber: number;
    seedingRank?: number;
    seedingPoints?: number;
  };
}

export interface MatchHistoryEntry {
  matchId: string;
  opponent: {
    _id: string;
    username: string;
    fullName?: string;
  };
  result: "win" | "loss" | "draw";
  score: string;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  date?: Date;
  roundNumber?: number;
  groupId?: string;
}

export interface HeadToHeadRecord {
  opponentId: string;
  opponent: {
    username: string;
    fullName?: string;
  };
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
}

interface StandingData {
  rank: number;
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
  form: string[];
}

/**
 * Extract participant side and opponent side from match
 */
function getMatchSides(match: any, participantId: string) {
  const participantIndex = match.participants.findIndex(
    (p: any) => p._id.toString() === participantId
  );
  const side = participantIndex === 0 ? "side1" : "side2";
  const opponentSide = side === "side1" ? "side2" : "side1";
  const opponentIndex = participantIndex === 0 ? 1 : 0;

  return { side, opponentSide, opponentIndex };
}

/**
 * Calculate sets won/lost for a participant in a match
 */
function calculateMatchSets(match: any, side: string, opponentSide: string) {
  const setsWon =
    side === "side1"
      ? match.finalScore?.side1Sets || 0
      : match.finalScore?.side2Sets || 0;
  const setsLost =
    opponentSide === "side1"
      ? match.finalScore?.side1Sets || 0
      : match.finalScore?.side2Sets || 0;

  return { setsWon, setsLost };
}

/**
 * Calculate points scored/conceded for a participant in a match
 */
function calculateMatchPoints(match: any, side: string) {
  let pointsScored = 0;
  let pointsConceded = 0;

  match.games?.forEach((game: any) => {
    if (side === "side1") {
      pointsScored += game.side1Score || 0;
      pointsConceded += game.side2Score || 0;
    } else {
      pointsScored += game.side2Score || 0;
      pointsConceded += game.side1Score || 0;
    }
  });

  return { pointsScored, pointsConceded };
}

/**
 * Calculate standing data from participant matches
 */
function calculateStandingFromMatches(
  matches: any[],
  participantId: string,
  rank: number,
  tournamentRules: any
): StandingData {
  const standing: StandingData = {
    rank,
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
    form: [],
  };

  // Sort matches chronologically
  const sortedMatches = [...matches].sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  sortedMatches.forEach((match: any) => {
    const { side, opponentSide } = getMatchSides(match, participantId);

    standing.played++;

    const { setsWon, setsLost } = calculateMatchSets(match, side, opponentSide);
    standing.setsWon += setsWon;
    standing.setsLost += setsLost;

    const { pointsScored, pointsConceded } = calculateMatchPoints(match, side);
    standing.pointsScored += pointsScored;
    standing.pointsConceded += pointsConceded;

    // Determine result
    if (match.winnerSide === side) {
      standing.won++;
      standing.points += tournamentRules?.pointsForWin || 1;
      standing.form.push("W");
    } else if (match.winnerSide === opponentSide) {
      standing.lost++;
      standing.points += tournamentRules?.pointsForLoss || 0;
      standing.form.push("L");
    }
  });

  standing.setsDiff = standing.setsWon - standing.setsLost;
  standing.pointsDiff = standing.pointsScored - standing.pointsConceded;

  return standing;
}

/**
 * Build match history from participant matches
 */
function buildMatchHistory(
  matches: any[],
  participantId: string
): MatchHistoryEntry[] {
  return matches.map((match: any) => {
    const { side, opponentSide, opponentIndex } = getMatchSides(
      match,
      participantId
    );
    const opponent = match.participants[opponentIndex];

    const { setsWon, setsLost } = calculateMatchSets(match, side, opponentSide);
    const { pointsScored, pointsConceded } = calculateMatchPoints(match, side);

    let result: "win" | "loss" | "draw";
    if (setsWon > setsLost) result = "win";
    else if (setsWon < setsLost) result = "loss";
    else result = "draw";

    return {
      matchId: match._id.toString(),
      opponent: {
        _id: opponent._id.toString(),
        username: opponent.username,
        fullName: opponent.fullName,
      },
      result,
      score: `${setsWon}-${setsLost}`,
      setsWon,
      setsLost,
      pointsScored,
      pointsConceded,
      date: match.scheduledTime,
      roundNumber: match.roundNumber,
      groupId: match.groupId,
    };
  });
}

/**
 * Build head-to-head records from match history
 */
function buildHeadToHeadRecords(
  matchHistory: MatchHistoryEntry[]
): HeadToHeadRecord[] {
  const h2hMap = new Map<string, HeadToHeadRecord>();

  matchHistory.forEach((match) => {
    const opponentId = match.opponent._id;
    if (!h2hMap.has(opponentId)) {
      h2hMap.set(opponentId, {
        opponentId,
        opponent: match.opponent,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        setsWon: 0,
        setsLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
      });
    }

    const h2h = h2hMap.get(opponentId)!;
    h2h.matches++;
    h2h.setsWon += match.setsWon;
    h2h.setsLost += match.setsLost;
    h2h.pointsScored += match.pointsScored;
    h2h.pointsConceded += match.pointsConceded;

    if (match.result === "win") h2h.wins++;
    else if (match.result === "loss") h2h.losses++;
    else h2h.draws++;
  });

  return Array.from(h2hMap.values());
}

/**
 * Calculate advanced statistics
 */
function calculateAdvancedStats(
  standing: StandingData,
  matchHistory: MatchHistoryEntry[]
) {
  const played = standing.played || 0;
  const winRate = calculateWinRate(standing.won, played);
  const setsWinRate = calculateSetsWinRate(standing.setsWon, standing.setsLost);
  const pointsPerMatch = played > 0 ? standing.points / played : 0;
  const avgPointsScored = calculateAvgPointsScored(standing.pointsScored, played);
  const avgPointsConceded = calculateAvgPointsConceded(
    standing.pointsConceded,
    played
  );
  const avgSetDifferential = calculateAvgSetDifferential(standing.setsDiff, played);
  const currentStreak = calculateStreak(standing.form);
  const longestWinStreak = calculateLongestWinStreak(matchHistory);
  const dominanceRating = calculateDominanceRating({
    won: standing.won,
    played: standing.played,
    setsWon: standing.setsWon,
    setsLost: standing.setsLost,
    setsDiff: standing.setsDiff,
    pointsDiff: standing.pointsDiff,
  });

  return {
    winRate: Math.round(winRate * 100) / 100,
    setsWinRate: Math.round(setsWinRate * 100) / 100,
    pointsPerMatch: Math.round(pointsPerMatch * 100) / 100,
    avgPointsScored,
    avgPointsConceded,
    avgSetDifferential,
    currentStreak,
    longestWinStreak,
    dominanceRating,
  };
}

/**
 * Determine qualification status
 */
function determineQualificationStatus(
  tournament: any,
  rank: number
): "qualified" | "eliminated" | "in_contention" | "pending" {
  if (tournament.status === "completed") {
    // Tournament finished
    if (rank === 1) return "qualified"; // Champion
    return "eliminated"; // All others finished
  }

  // Tournament ongoing
  return "in_contention";
}

/**
 * Get qualification info for participant
 */
function getQualificationInfo(
  tournament: any,
  participantId: string,
  rank: number
) {
  const status = determineQualificationStatus(tournament, rank);
  const qualificationInfo: DetailedPlayerStats["qualificationInfo"] = {
    status,
  };

  // Add group info if from group stage
  if (tournament.useGroups && tournament.groups) {
    const group = tournament.groups.find((g: any) =>
      g.participants.some((p: any) => p.toString() === participantId)
    );

    if (group) {
      const groupStanding = group.standings?.find(
        (s: any) => s.participant.toString() === participantId
      );
      qualificationInfo.fromGroup = group.groupName;
      qualificationInfo.groupRank = groupStanding?.rank || 0;
    }
  }

  return qualificationInfo;
}

/**
 * Main function: Generate detailed tournament leaderboard
 */
export async function generateDetailedLeaderboard(tournamentId: string): Promise<{
  tournament: any;
  leaderboard: DetailedPlayerStats[];
}> {
  // Fetch tournament with participants
  const tournament = await Tournament.findById(tournamentId)
    .populate("participants", "username fullName profileImage")
    .lean();

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  // Fetch all completed matches
  const matches = await IndividualMatch.find({
    tournament: tournamentId,
    status: "completed",
  })
    .populate("participants", "username fullName profileImage")
    .lean();

  // Build standings rank map
  const standingsMap = new Map<string, number>();
  if ((tournament as any).standings && (tournament as any).standings.length > 0) {
    (tournament as any).standings.forEach((standing: any) => {
      standingsMap.set(standing.participant.toString(), standing.rank);
    });
  }

  // Build detailed stats for each participant
  const detailedStats: DetailedPlayerStats[] = [];

  for (const participant of (tournament as any).participants || []) {
    const participantId = participant._id.toString();

    // Get standing rank
    const rank = standingsMap.get(participantId);
    if (!rank) continue; // Skip participants without standings

    // Get participant's matches
    const participantMatches = (matches as any[]).filter((match: any) =>
      match.participants.some((p: any) => p._id.toString() === participantId)
    );

    // Calculate standing data
    const standing = calculateStandingFromMatches(
      participantMatches,
      participantId,
      rank,
      (tournament as any).rules
    );

    if (standing.played === 0) continue; // Skip if no matches played

    // Build match history
    const matchHistory = buildMatchHistory(participantMatches, participantId);

    // Build head-to-head records
    const headToHead = buildHeadToHeadRecords(matchHistory);

    // Calculate advanced stats
    const advancedStats = calculateAdvancedStats(standing, matchHistory);

    // Get qualification info
    const qualificationInfo = getQualificationInfo(
      tournament,
      participantId,
      rank
    );

    // Get seeding info
    const seedingInfo = (tournament as any).seeding?.find(
      (s: any) => s.participant.toString() === participantId
    );

    // Sort match history by date (most recent first)
    matchHistory.sort(
      (a, b) =>
        (b.date?.getTime() || 0) - (a.date?.getTime() || 0) ||
        (b.roundNumber || 0) - (a.roundNumber || 0)
    );

    detailedStats.push({
      participant: {
        _id: participant._id.toString(),
        username: participant.username,
        fullName: participant.fullName,
        profileImage: participant.profileImage,
      },
      standing: {
        rank: standing.rank,
        played: standing.played,
        won: standing.won,
        lost: standing.lost,
        drawn: standing.drawn,
        setsWon: standing.setsWon,
        setsLost: standing.setsLost,
        setsDiff: standing.setsDiff,
        pointsScored: standing.pointsScored,
        pointsConceded: standing.pointsConceded,
        pointsDiff: standing.pointsDiff,
        points: standing.points,
        form: standing.form || [],
      },
      advancedStats,
      qualificationInfo,
      matchHistory,
      headToHead,
      seedingInfo: seedingInfo
        ? {
            seedNumber: seedingInfo.seedNumber,
            seedingRank: seedingInfo.seedingRank,
            seedingPoints: seedingInfo.seedingPoints,
          }
        : undefined,
    });
  }

  // Sort by rank
  detailedStats.sort((a, b) => a.standing.rank - b.standing.rank);

  return {
    tournament: {
      id: (tournament as any)._id.toString(),
      name: (tournament as any).name,
      format: (tournament as any).format,
      status: (tournament as any).status,
      matchType: (tournament as any).matchType,
      useGroups: (tournament as any).useGroups,
      numberOfGroups: (tournament as any).numberOfGroups,
      advancePerGroup: (tournament as any).advancePerGroup,
    },
    leaderboard: detailedStats,
  };
}
