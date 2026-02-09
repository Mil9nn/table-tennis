import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { teamMatchService } from "@/services/match/teamMatchService";
import { populateTeamMatch } from "@/services/match/populationService";
import { jsonError } from "@/lib/api-errors";
import { validateQueryParams, getTeamMatchesQuerySchema } from "@/lib/validations";

/**
 * POST /api/matches/team
 * Create a new team match
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const body = await request.json();

    const result = await teamMatchService.createTeamMatch(
      {
        matchFormat: body.matchFormat,
        setsPerTie: Number(body.setsPerTie),
        team1Id: body.team1Id,
        team2Id: body.team2Id,
        city: body.city,
        venue: body.venue,
        serverConfig: body.serverConfig,
        customConfig: body.customConfig,
        team1Assignments: body.team1Assignments,
        team2Assignments: body.team2Assignments,
      },
      auth.userId
    );

    if (!result.success) {
      return jsonError(result.error || "Failed to create team match", result.status || 400);
    }

    return NextResponse.json(
      { message: "Team match created successfully", match: result.match },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating team match:", err);
    return jsonError("Failed to create team match", 500, { details: err.message });
  }
}

/**
 * GET /api/matches/team
 * List team matches with pagination and filters
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const validation = validateQueryParams(getTeamMatchesQuerySchema, searchParams);
    if (!validation.success) {
      return validation.error;
    }

    const { format, status, search, dateFrom, dateTo, sortBy, sortOrder, limit, skip } = validation.data;

    // Build filter object
    const filter: any = {};

    // Match format filter
    if (format && format !== "all") {
      filter.matchFormat = format;
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lte = endDate;
      }
    }

    // Search filter - search by team names
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      
      // Find matching team IDs
      const matchingTeams = await Team.find({
        name: searchRegex
      }).select("_id");
      
      const teamIds = matchingTeams.map(t => t._id);
      
      if (teamIds.length > 0) {
        filter.$or = [
          { team1: { $in: teamIds } },
          { team2: { $in: teamIds } }
        ];
      } else {
        // No matching teams, return empty
        return NextResponse.json(
          {
            matches: [],
            pagination: {
              total: 0,
              skip,
              limit,
              hasMore: false,
            },
          },
          { status: 200 }
        );
      }
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    let query = populateTeamMatch(TeamMatch.find(filter), { includeTournament: true }).sort(sortObject);

    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    const matches = await query.exec();

    const totalCount = await TeamMatch.countDocuments(filter);
    const hasMore = skip + matches.length < totalCount;

    return NextResponse.json(
      {
        matches,
        pagination: {
          total: totalCount,
          skip,
          limit: limit > 0 ? limit : totalCount,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching team matches:", err);
    return jsonError("Failed to fetch team matches", 500, { details: err.message });
  }
}
