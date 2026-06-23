import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import IndividualMatch from "@/models/IndividualMatch";
import { validateFilters, getDateRange, getPaginationDefaults } from "@/lib/leaderboard/filterUtils";
import { buildLeaderboardPipeline } from "@/lib/leaderboard/aggregationBuilder";
import { sortLeaderboardWithITTF, type HeadToHeadMap, type LeaderboardEntry } from "@/lib/leaderboard/ittfSorting";
import type { PlayerStats } from "@/app/leaderboard/types";

// Streak calculation function (from unified API)
function updateStreak(playerData: any, won: boolean) {
  if (won) {
    if (playerData.stats.currentStreak >= 0) {
      playerData.stats.currentStreak++;
    } else {
      playerData.stats.currentStreak = 1;
    }
    playerData.stats.bestStreak = Math.max(
      playerData.stats.bestStreak,
      playerData.stats.currentStreak
    );
  } else {
    if (playerData.stats.currentStreak <= 0) {
      playerData.stats.currentStreak--;
    } else {
      playerData.stats.currentStreak = -1;
    }
  }
}

// Calculate streaks for all players
async function calculateStreaksForPlayers(playerIds: string[], dateRange: any) {
  const playerStreaks = new Map();
  
  // Initialize streak data for all players
  playerIds.forEach(playerId => {
    playerStreaks.set(playerId, {
      stats: { currentStreak: 0, bestStreak: 0 }
    });
  });

  // Get all matches for these players in date order
  const matches = await IndividualMatch.find({
    status: "completed",
    createdAt: dateRange,
    "participants._id": { $in: playerIds }
  })
  .populate("participants", "username fullName profileImage")
  .sort({ createdAt: 1 }) // Oldest first for proper streak calculation
  .lean();

  // Process matches in chronological order
  matches.forEach((match: any) => {
    if (!match.participants || !match.winnerSide) return;

    const side1Players = match.matchType === "singles" 
      ? [match.participants[0]]
      : [match.participants[0], match.participants[1]];
    
    const side2Players = match.matchType === "singles"
      ? [match.participants[1]]
      : [match.participants[2], match.participants[3]];

    const side1Won = match.winnerSide === "side1";

    // Update streaks for all participants
    [...side1Players, ...side2Players].forEach((player: any, idx: number) => {
      if (!player?._id) return;

      const playerId = player._id.toString();
      const isWinner = idx < side1Players.length ? side1Won : !side1Won;
      
      const playerData = playerStreaks.get(playerId);
      if (playerData) {
        updateStreak(playerData, isWinner);
      }
    });
  });

  return playerStreaks;
}

/**
 * GET /api/leaderboard/filtered
 * 
 * Production-grade filtered leaderboard endpoint using MongoDB aggregation pipelines.
 * Supports comprehensive filtering by player attributes, time ranges, tournament context,
 * and match types. All filtering is done server-side for optimal performance.
 * 
 * Query Parameters:
 * - type (optional): 'singles' | 'doubles' | 'mixed_doubles' | 'all' (defaults to 'all' if not provided)
 * - gender (optional): 'male' | 'female'
 * - handedness (optional): 'left' | 'right'
 * - timeRange (optional): 'all_time' | 'this_year' | 'this_month'
 * - dateFrom (optional): ISO date string
 * - dateTo (optional): ISO date string
 * - tournamentId (optional): MongoDB ObjectId
 * - tournamentSeason (optional): Year (e.g., 2024)
 * - matchFormat (optional): 'friendly' | 'tournament'
 * - eventCategory (optional): 'singles' | 'doubles' | 'mixed_doubles'
 * - sortBy (optional): 'winRate' | 'wins' | 'pointDifference' | 'winStreak' | 'matchesPlayed'
 * - sortOrder (optional): 'asc' | 'desc' (default: 'desc')
 * - limit (optional): Number (default: 50, max: 1000)
 * - skip (optional): Number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const debugLeaderboard = process.env.NODE_ENV === "development" && searchParams.get("debug") === "1";
    
    // Validate and parse filters
    const { filters, errors } = validateFilters(searchParams);
    
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: errors,
        },
        { status: 400 }
      );
    }

    // If type is not provided, default to 'all' (show all individual match types)
    // This is handled in the aggregation builder

    // Get date range
    const dateRange = getDateRange(filters);

    // Get pagination defaults and validate
    const paginationDefaults = getPaginationDefaults();
    const limit = Math.min(Math.max(1, filters.limit || paginationDefaults.limit), 1000);
    const skip = Math.max(0, filters.skip || paginationDefaults.skip);

    const pipeline = buildLeaderboardPipeline({
      filters: {
        ...filters,
        limit,
        skip,
      },
      dateRange,
    });

    // Execute aggregation with allowDiskUse for large datasets
    const result = await Match.aggregate(pipeline).allowDiskUse(true);

    // Extract data and total from $facet result
    // Safety: Handle null/undefined results gracefully
    const facetResult = result && result.length > 0 ? result[0] : { data: [], total: [] };
    const leaderboardData = Array.isArray(facetResult.data) ? facetResult.data : [];
    const totalCount = facetResult.total?.[0]?.count || 0;

    // Fallback for migrated score model: if aggregation returns empty but matches exist,
    // compute leaderboard directly from match docs using winnerId/setsById/scoresById.
    if (totalCount === 0) {
      const fallback = await buildFallbackLeaderboard(filters, dateRange, limit, skip);
      if (fallback.totalCount > 0) {
        return NextResponse.json({
          leaderboard: fallback.leaderboard,
          pagination: {
            total: fallback.totalCount,
            skip,
            limit,
            hasMore: skip + fallback.leaderboard.length < fallback.totalCount,
          },
          filters: {
            applied: filters,
          },
          generatedAt: new Date(),
        });
      }
    }

    // Build head-to-head records for ITTF sorting
    // We need to query matches to build head-to-head records
    const headToHeadMap = await buildHeadToHeadMap(filters, dateRange);

    // Convert to format expected by ITTF sorting utility
    const leaderboardEntries: LeaderboardEntry[] = leaderboardData.map((entry: any) => ({
      playerId: entry.player._id,
      wins: entry.stats.wins || 0,
      losses: entry.stats.losses || 0,
      setsWon: entry.stats.setsWon || 0,
      setsLost: entry.stats.setsLost || 0,
      // Handle both possible field names (from unified route vs aggregation)
      pointsScored: entry.stats.totalPointsScored || entry.stats.pointsScored || 0,
      pointsConceded: entry.stats.totalPointsConceded || entry.stats.pointsConceded || 0,
      originalEntry: entry, // Keep reference to original entry
    }));

    // Calculate streaks for all players in aggregation path
    const playerIds = leaderboardData.map((entry: any) => entry.player._id);
    const streaksData = await calculateStreaksForPlayers(playerIds, dateRange);

    // Sort using ITTF-compliant rules (skip head-to-head for leaderboards)
    const sortedEntries = sortLeaderboardWithITTF(leaderboardEntries, headToHeadMap, true);

    // Map sorted entries back to leaderboard format with streaks
    const sortedLeaderboard: PlayerStats[] = sortedEntries.map((entry) => {
      const original = entry.originalEntry as any;
      const streakData = streaksData.get(original.player._id);
      return {
        ...original,
        rank: entry.rank || 0,
        stats: {
          ...original.stats,
          currentStreak: streakData?.stats?.currentStreak || 0,
          bestStreak: streakData?.stats?.bestStreak || 0,
        },
      };
    });

    // Apply pagination after sorting
    const paginatedLeaderboard = sortedLeaderboard.slice(skip, skip + limit);

    // Calculate hasMore
    const hasMore = skip + paginatedLeaderboard.length < totalCount;

    return NextResponse.json({
      leaderboard: paginatedLeaderboard,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore,
      },
      filters: {
        applied: filters,
      },
      generatedAt: new Date(),
    });
  } catch (error: any) {
    // Structured error logging for production debugging
    console.error("Error fetching filtered leaderboard:", {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      url: request.url,
      timestamp: new Date().toISOString(),
    });
    
    // Return appropriate error response
    if (error.name === "CastError" || error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // MongoDB aggregation errors
    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return NextResponse.json(
        {
          error: "Database query error",
          details: process.env.NODE_ENV === "development" ? error.message : "An error occurred while processing the leaderboard query",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
        details: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

type FallbackStats = {
  player: {
    _id: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  };
  totalMatches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  totalPointsScored: number;
  totalPointsConceded: number;
};

async function buildFallbackLeaderboard(
  filters: any,
  dateRange: ReturnType<typeof getDateRange>,
  limit: number,
  skip: number,
): Promise<{ leaderboard: PlayerStats[]; totalCount: number }> {
  const matchFilter: any = {
    matchCategory: "individual",
    status: "completed",
  };

  if (filters.type && filters.type !== "all") {
    matchFilter.matchType = filters.type;
  } else {
    matchFilter.matchType = { $in: ["singles", "doubles"] };
  }

  if (dateRange) {
    matchFilter.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
  }
  if (filters.tournamentId) {
    matchFilter.tournament = filters.tournamentId;
  } else if (filters.matchFormat === "friendly") {
    matchFilter.tournament = null;
  } else if (filters.matchFormat === "tournament") {
    matchFilter.tournament = { $ne: null };
  }

  const matches = await IndividualMatch.find(matchFilter)
    .select("participants teams matchType finalScore games winnerId winnerTeamIndex winnerPlayerId winner winnerSide")
    .populate("participants", "_id username fullName profileImage")
    .populate("teams.players", "_id username fullName profileImage")
    .lean();

  const statsMap = new Map<string, FallbackStats>();

  for (const match of matches as any[]) {
    const participants = Array.isArray(match.participants) ? match.participants : [];
    if (participants.length < 2) continue;

    const hasTeams = match.teams && Array.isArray(match.teams) && match.teams.length === 2;
    const isDoubles = match.matchType === "doubles";

    // Build team arrays from teams or positional fallback
    let team0Players: any[];
    let team1Players: any[];
    if (hasTeams) {
      team0Players = (match.teams[0].players || []).filter(Boolean);
      team1Players = (match.teams[1].players || []).filter(Boolean);
    } else {
      team0Players = isDoubles ? [participants[0], participants[1]].filter(Boolean) : [participants[0]].filter(Boolean);
      team1Players = isDoubles ? [participants[2], participants[3]].filter(Boolean) : [participants[1]].filter(Boolean);
    }

    const team0Ids = new Set(team0Players.map((p: any) => String(p?._id || "")));
    const team1Ids = new Set(team1Players.map((p: any) => String(p?._id || "")));

    // Determine which team won
    let winnerTeamIdx: number | null = null;
    if (match.winnerTeamIndex != null) {
      winnerTeamIdx = match.winnerTeamIndex;
    } else {
      const winnerId = String(match.winnerId || match.winnerPlayerId || match.winner || "");
      if (winnerId && team0Ids.has(winnerId)) winnerTeamIdx = 0;
      else if (winnerId && team1Ids.has(winnerId)) winnerTeamIdx = 1;
      else if (match.winnerSide === "side1") winnerTeamIdx = 0;
      else if (match.winnerSide === "side2") winnerTeamIdx = 1;
    }

    // Get set scores
    let team0Sets = 0, team1Sets = 0;
    if (match.finalScore?.setsByTeam && match.finalScore.setsByTeam.length === 2) {
      team0Sets = Number(match.finalScore.setsByTeam[0] ?? 0);
      team1Sets = Number(match.finalScore.setsByTeam[1] ?? 0);
    } else {
      const setsById = match.finalScore?.setsById || {};
      const t0Main = team0Players[0]?._id ? String(team0Players[0]._id) : "";
      const t1Main = team1Players[0]?._id ? String(team1Players[0]._id) : "";
      team0Sets = Number(setsById[t0Main] ?? match.finalScore?.side1Sets ?? 0);
      team1Sets = Number(setsById[t1Main] ?? match.finalScore?.side2Sets ?? 0);
    }

    for (const player of [...team0Players, ...team1Players]) {
      if (!player?._id) continue;
      const playerId = String(player._id);
      const teamIdx = team0Ids.has(playerId) ? 0 : 1;
      const oppIdx = teamIdx === 0 ? 1 : 0;

      const isWinner = winnerTeamIdx === teamIdx;

      const setsWon = teamIdx === 0 ? team0Sets : team1Sets;
      const setsLost = oppIdx === 0 ? team0Sets : team1Sets;

      let pointsScored = 0;
      let pointsConceded = 0;
      for (const game of match.games || []) {
        if (game.scoresByTeam && game.scoresByTeam.length === 2) {
          pointsScored += Number(game.scoresByTeam[teamIdx] ?? 0);
          pointsConceded += Number(game.scoresByTeam[oppIdx] ?? 0);
        } else {
          const gameScores = game.scoresById || game.scoresByPlayerId || game.scores || {};
          const t0Main = team0Players[0]?._id ? String(team0Players[0]._id) : "";
          const t1Main = team1Players[0]?._id ? String(team1Players[0]._id) : "";
          pointsScored += Number(gameScores[teamIdx === 0 ? t0Main : t1Main] ?? (teamIdx === 0 ? game.side1Score ?? 0 : game.side2Score ?? 0));
          pointsConceded += Number(gameScores[oppIdx === 0 ? t0Main : t1Main] ?? (oppIdx === 0 ? game.side1Score ?? 0 : game.side2Score ?? 0));
        }
      }

      const existing = statsMap.get(playerId) || {
        player: {
          _id: playerId,
          username: player.username,
          fullName: player.fullName,
          profileImage: player.profileImage,
        },
        totalMatches: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        totalPointsScored: 0,
        totalPointsConceded: 0,
      };

      existing.totalMatches += 1;
      existing.wins += isWinner ? 1 : 0;
      existing.losses += isWinner ? 0 : 1;
      existing.setsWon += setsWon;
      existing.setsLost += setsLost;
      existing.totalPointsScored += pointsScored;
      existing.totalPointsConceded += pointsConceded;
      statsMap.set(playerId, existing);
    }
  }

  // Calculate streaks for all players
  const playerIds = Array.from(statsMap.keys());
  const streaksData = await calculateStreaksForPlayers(playerIds, dateRange);

  const entries = Array.from(statsMap.values())
    .map((entry) => {
      const winRate = entry.totalMatches > 0 ? (entry.wins / entry.totalMatches) * 100 : 0;
      const streakData = streaksData.get(entry.player._id);
      return {
        rank: 0,
        player: {
          _id: entry.player._id,
          username: entry.player.username || "",
          fullName: entry.player.fullName,
          profileImage: entry.player.profileImage,
        },
        stats: {
          totalMatches: entry.totalMatches,
          wins: entry.wins,
          losses: entry.losses,
          winRate: Number(winRate.toFixed(1)),
          setsWon: entry.setsWon,
          setsLost: entry.setsLost,
          totalPointsScored: entry.totalPointsScored,
          totalPointsConceded: entry.totalPointsConceded,
          currentStreak: streakData?.stats?.currentStreak || 0,
          bestStreak: streakData?.stats?.bestStreak || 0,
        },
      } satisfies PlayerStats;
    })
    .sort((a, b) => {
      const diffA = (a.stats.wins || 0) - (a.stats.losses || 0);
      const diffB = (b.stats.wins || 0) - (b.stats.losses || 0);
      if (diffB !== diffA) return diffB - diffA;
      if ((b.stats.winRate || 0) !== (a.stats.winRate || 0)) return (b.stats.winRate || 0) - (a.stats.winRate || 0);
      const pointsDiffA = (a.stats.totalPointsScored || 0) - (a.stats.totalPointsConceded || 0);
      const pointsDiffB = (b.stats.totalPointsScored || 0) - (b.stats.totalPointsConceded || 0);
      return pointsDiffB - pointsDiffA;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    leaderboard: entries.slice(skip, skip + limit),
    totalCount: entries.length,
  };
}

/**
 * Build head-to-head map from matches
 * This queries matches to build head-to-head records for ITTF sorting
 */
async function buildHeadToHeadMap(
  filters: any,
  dateRange: ReturnType<typeof getDateRange>
): Promise<HeadToHeadMap> {
  const headToHeadMap: HeadToHeadMap = new Map();

  try {
    // Build match filter similar to aggregation pipeline
    const matchFilter: any = {
      matchCategory: 'individual',
      status: 'completed',
    };

    // Match type filter
    if (filters.type && filters.type !== 'all') {
      if (['singles', 'doubles'].includes(filters.type)) {
        matchFilter.matchType = filters.type;
      }
    } else {
      matchFilter.matchType = { $in: ['singles', 'doubles'] };
    }

    // Date range filter
    if (dateRange) {
      matchFilter.createdAt = {
        $gte: dateRange.from,
        $lte: dateRange.to,
      };
    }

    // Tournament filter
    if (filters.tournamentId) {
      matchFilter.tournament = filters.tournamentId;
    } else if (filters.matchFormat === 'friendly') {
      matchFilter.tournament = null;
    }

    const matches = await IndividualMatch.find(matchFilter)
      .select('participants teams matchType finalScore winnerTeamIndex winnerId winnerSide')
      .lean();

    for (const match of matches as any[]) {
      if (!match.participants || match.participants.length < 2) continue;

      const hasTeams = match.teams && Array.isArray(match.teams) && match.teams.length === 2;
      const isDoubles = match.matchType === "doubles";

      let team0Ids: string[];
      let team1Ids: string[];
      if (hasTeams) {
        team0Ids = (match.teams[0].players || []).map((p: any) => String(p?._id ?? p));
        team1Ids = (match.teams[1].players || []).map((p: any) => String(p?._id ?? p));
      } else {
        const pIds = match.participants.map((p: any) => String(p?._id ?? p));
        team0Ids = isDoubles ? [pIds[0], pIds[1]] : [pIds[0]];
        team1Ids = isDoubles ? [pIds[2], pIds[3]] : [pIds[1]];
      }

      let team0Won = false;
      if (match.winnerTeamIndex != null) {
        team0Won = match.winnerTeamIndex === 0;
      } else if (match.finalScore?.setsByTeam && match.finalScore.setsByTeam.length === 2) {
        team0Won = match.finalScore.setsByTeam[0] > match.finalScore.setsByTeam[1];
      } else {
        const winnerId = String(match.winnerId || "");
        if (winnerId) {
          team0Won = team0Ids.includes(winnerId);
        } else {
          team0Won = match.winnerSide === "side1" ||
            (match.finalScore?.side1Sets ?? 0) > (match.finalScore?.side2Sets ?? 0);
        }
      }

      const t0Points = team0Won ? 2 : 0;
      const t1Points = team0Won ? 0 : 2;

      for (const p1 of team0Ids.filter(Boolean)) {
        if (!headToHeadMap.has(p1)) headToHeadMap.set(p1, new Map());
        for (const p2 of team1Ids.filter(Boolean)) {
          if (!headToHeadMap.has(p2)) headToHeadMap.set(p2, new Map());
          headToHeadMap.get(p1)!.set(p2, t0Points);
          headToHeadMap.get(p2)!.set(p1, t1Points);
        }
      }
    }
  } catch (error) {
    console.error("Error building head-to-head map:", error);
    // Return empty map on error - head-to-head tie-breaker will be skipped
  }

  return headToHeadMap;
}

