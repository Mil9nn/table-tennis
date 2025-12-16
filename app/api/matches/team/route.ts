import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { teamMatchService } from "@/services/match/teamMatchService";
import { populateTeamMatch } from "@/services/match/populationService";
import { jsonError } from "@/lib/api-errors";

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
 * List team matches with pagination
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    let query = populateTeamMatch(TeamMatch.find()).sort({ createdAt: -1 });

    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    const matches = await query.exec();

    const totalCount = await TeamMatch.countDocuments();
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
