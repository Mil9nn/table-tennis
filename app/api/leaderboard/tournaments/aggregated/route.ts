import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import {
  buildTournamentLeaderboardPipeline,
  type TournamentLeaderboardFilters,
} from "@/lib/leaderboard/tournamentAggregationBuilder";

/**
 * GET /api/leaderboard/tournaments/aggregated
 * 
 * Production-grade tournament leaderboard endpoint using MongoDB aggregation pipelines.
 * Queries IndividualMatch documents directly (not standings) for accurate match counts.
 * 
 * Query Parameters:
 * - matchType (optional): 'singles' | 'doubles' | 'all' (default: 'all')
 * - format (optional): 'round_robin' | 'knockout' | 'hybrid' | 'all' (default: 'all')
 * - status (optional): 'completed' | 'in_progress' | 'all' (default: 'completed')
 * - dateFrom (optional): ISO date string
 * - dateTo (optional): ISO date string
 * - season (optional): Year (e.g., 2024)
 * - limit (optional): Number (default: 50, max: 1000)
 * - skip (optional): Number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Parse and validate filters
    const filters: TournamentLeaderboardFilters = {
      matchType: (searchParams.get("matchType") as any) || "all",
      format: (searchParams.get("format") as any) || "all",
      status: (searchParams.get("status") as any) || "completed",
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      season: searchParams.get("season")
        ? parseInt(searchParams.get("season")!)
        : undefined,
      limit: Math.min(
        Math.max(1, parseInt(searchParams.get("limit") || "50")),
        1000
      ),
      skip: Math.max(0, parseInt(searchParams.get("skip") || "0")),
    };

    // Validate matchType
    if (
      filters.matchType &&
      !["singles", "doubles", "all"].includes(filters.matchType)
    ) {
      return NextResponse.json(
        { error: "Invalid matchType. Must be 'singles', 'doubles', or 'all'" },
        { status: 400 }
      );
    }

    // Validate format
    if (
      filters.format &&
      !["round_robin", "knockout", "hybrid", "all"].includes(filters.format)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid format. Must be 'round_robin', 'knockout', 'hybrid', or 'all'",
        },
        { status: 400 }
      );
    }

    // Validate status
    if (
      filters.status &&
      !["completed", "in_progress", "all"].includes(filters.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be 'completed', 'in_progress', or 'all'",
        },
        { status: 400 }
      );
    }

    // Build aggregation pipeline
    const pipeline = buildTournamentLeaderboardPipeline({ filters });

    // Execute aggregation with allowDiskUse for large datasets
    const result = await Match.aggregate(pipeline).allowDiskUse(true);

    // Extract data and total from $facet result
    const facetResult =
      result && result.length > 0 ? result[0] : { data: [], total: [] };
    const leaderboardData = Array.isArray(facetResult.data)
      ? facetResult.data
      : [];
    const totalCount = facetResult.total?.[0]?.count || 0;

    // Assign ranks (1-based)
    const leaderboard = leaderboardData.map((entry: any, index: number) => ({
      ...entry,
      rank: (filters.skip ?? 0) + index + 1,
    }));

    // Calculate hasMore
    const hasMore = (filters.skip ?? 0) + leaderboard.length < totalCount;

    return NextResponse.json({
      leaderboard,
        pagination: {
        total: totalCount,
        skip: filters.skip ?? 0,
        limit: filters.limit,
        hasMore,
      },
      filters: {
        applied: filters,
      },
      generatedAt: new Date(),
    });
  } catch (error: any) {
    console.error("Error fetching tournament leaderboard:", {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      url: request.url,
      timestamp: new Date().toISOString(),
    });

    if (error.name === "CastError" || error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return NextResponse.json(
        {
          error: "Database query error",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An error occurred while processing the leaderboard query",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch tournament leaderboard",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

