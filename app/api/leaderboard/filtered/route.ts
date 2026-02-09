import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import IndividualMatch from "@/models/IndividualMatch";
import { validateFilters, getDateRange, getPaginationDefaults } from "@/lib/leaderboard/filterUtils";
import { buildLeaderboardPipeline } from "@/lib/leaderboard/aggregationBuilder";
import { sortLeaderboardWithITTF, type HeadToHeadMap, type LeaderboardEntry } from "@/lib/leaderboard/ittfSorting";
import type { PlayerStats } from "@/app/leaderboard/types";

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

    // Build aggregation pipeline
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

    // Sort using ITTF-compliant rules (skip head-to-head for leaderboards)
    const sortedEntries = sortLeaderboardWithITTF(leaderboardEntries, headToHeadMap, true);

    // Map sorted entries back to leaderboard format
    const sortedLeaderboard: PlayerStats[] = sortedEntries.map((entry) => {
      const original = entry.originalEntry as any;
      return {
        ...original,
        rank: entry.rank || 0,
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

    // Query matches to build head-to-head records
    const matches = await IndividualMatch.find(matchFilter)
      .select('participants finalScore games')
      .lean();

    // Process each match to build head-to-head records
    for (const match of matches as any[]) {
      if (!match.participants || match.participants.length < 2) continue;

      const participants = match.participants.map((p: any) => 
        typeof p === 'string' ? p : p.toString()
      );

      // Determine winner based on finalScore
      const side1Sets = match.finalScore?.side1Sets || 0;
      const side2Sets = match.finalScore?.side2Sets || 0;
      const side1Won = side1Sets > side2Sets;

      // For singles: 2 participants
      // For doubles: 4 participants (side1: 0,1; side2: 2,3)
      if (match.matchType === 'singles' && participants.length === 2) {
        const p1Id = participants[0];
        const p2Id = participants[1];
        const p1Points = side1Won ? 2 : 0;
        const p2Points = side1Won ? 0 : 2;

        // Initialize maps if needed
        if (!headToHeadMap.has(p1Id)) {
          headToHeadMap.set(p1Id, new Map());
        }
        if (!headToHeadMap.has(p2Id)) {
          headToHeadMap.set(p2Id, new Map());
        }

        // Record head-to-head (use latest result if multiple matches)
        headToHeadMap.get(p1Id)!.set(p2Id, p1Points);
        headToHeadMap.get(p2Id)!.set(p1Id, p2Points);
      } else if (match.matchType === 'doubles' && participants.length === 4) {
        // Doubles: side1 players (0,1) vs side2 players (2,3)
        const side1Players = [participants[0], participants[1]];
        const side2Players = [participants[2], participants[3]];
        const side1Points = side1Won ? 2 : 0;
        const side2Points = side1Won ? 0 : 2;

        // Each player on side1 has head-to-head with each player on side2
        for (const p1 of side1Players) {
          if (!headToHeadMap.has(p1)) {
            headToHeadMap.set(p1, new Map());
          }
          for (const p2 of side2Players) {
            if (!headToHeadMap.has(p2)) {
              headToHeadMap.set(p2, new Map());
            }
            // Use latest result if multiple matches
            headToHeadMap.get(p1)!.set(p2, side1Points);
            headToHeadMap.get(p2)!.set(p1, side2Points);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error building head-to-head map:", error);
    // Return empty map on error - head-to-head tie-breaker will be skipped
  }

  return headToHeadMap;
}

