import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import { validateFilters, getDateRange, getPaginationDefaults } from "@/lib/leaderboard/filterUtils";
import { buildLeaderboardPipeline } from "@/lib/leaderboard/aggregationBuilder";
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
 * - gender (optional): 'male' | 'female' | 'mixed'
 * - ageCategory (optional): 'U13' | 'U15' | 'U18' | 'Open' | '40+'
 * - playerType (optional): 'singles_only' | 'doubles_only' | 'both'
 * - handedness (optional): 'left' | 'right'
 * - timeRange (optional): 'all_time' | 'this_year' | 'this_month' | 'last_30_days'
 * - dateFrom (optional): ISO date string
 * - dateTo (optional): ISO date string
 * - tournamentId (optional): MongoDB ObjectId
 * - tournamentSeason (optional): Year (e.g., 2024)
 * - matchFormat (optional): 'league' | 'knockout' | 'friendly'
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

    // Assign ranks (1-based)
    const leaderboard: PlayerStats[] = leaderboardData.map((entry: any, index: number) => ({
      ...entry,
      rank: skip + index + 1,
    }));

    // Calculate hasMore
    const hasMore = skip + leaderboard.length < totalCount;

    return NextResponse.json({
      leaderboard,
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

