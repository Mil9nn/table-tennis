import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";
import { validateRequest, validateQueryParams, createIndividualMatchSchema, getMatchesQuerySchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    body = await request.json();

    const scorer = await User.findById(auth.userId);
    if (!scorer) return NextResponse.json({ error: "invalid scorer, user not found" }, { status: 401 });

    // ✅ Validate request body with Zod
    const validation = validateRequest(createIndividualMatchSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { matchType, numberOfSets, city, venue, participants, tournament } = validation.data;

    // 🔎 Lookup participants
    const users = await User.find({ _id: { $in: participants } }).select(
      "_id username fullName profileImage"
    );

    if (users.length !== participants.length) {
      return NextResponse.json({ error: "Invalid player IDs" }, { status: 400 });
    }

    // 📝 Create match using repository
    const match = await matchRepository.createIndividualMatch({
      matchType,
      numberOfSets,
      city,
      venue,
      participants, // just IDs
      scorer: scorer._id.toString(),
      tournament,
    });

    // 👇 Populate with profileImage
    const populatedMatch = await matchRepository.findByIdWithParticipants(String(match._id));
    const matchObj = populatedMatch?.toObject() || match.toObject();

    return NextResponse.json(
      { message: "Individual match created", match: matchObj },
      { status: 201 }
    );
  } catch (err: any) {
    logError(err, {
      tags: { feature: "match", action: "create", endpoint: "POST /api/matches/individual" },
      extra: { matchData: body },
    });

    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    
    // Validate query parameters
    const validation = validateQueryParams(getMatchesQuerySchema, searchParams);
    if (!validation.success) {
      return validation.error;
    }

    const { context, type, status, search, dateFrom, dateTo, sortBy, sortOrder, limit, skip } = validation.data;

    const IndividualMatch = (await import("@/models/IndividualMatch")).default;

    // Build filter object
    const filter: any = {};

    // Context filter (casual/tournament)
    if (context === "casual") {
      filter.tournament = null;
    } else if (context === "tournament") {
      filter.tournament = { $ne: null };
    }

    // Match type filter
    if (type && type !== "all") {
      filter.matchType = type;
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
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lte = endDate;
      }
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    // If searching, we need to use aggregation to search in populated fields
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      
      // First, find matching user IDs
      const matchingUsers = await User.find({
        $or: [
          { fullName: searchRegex },
          { username: searchRegex }
        ]
      }).select("_id");
      
      const userIds = matchingUsers.map(u => u._id);
      
      if (userIds.length > 0) {
        filter.participants = { $in: userIds };
      } else {
        // No matching users, return empty
        return NextResponse.json({
          matches: [],
          pagination: {
            total: 0,
            skip,
            limit,
            hasMore: false
          }
        });
      }
    }

    // Execute query
    let query = IndividualMatch.find(filter)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName")
      .populate("tournament", "name format status")
      .sort(sortObject)
      .skip(skip);

    if (limit > 0) {
      query = query.limit(limit);
    }

    const matches = await query;

    // Get total count for pagination
    const totalCount = await IndividualMatch.countDocuments(filter);

    return NextResponse.json({
      matches,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + matches.length < totalCount
      }
    });
  } catch (err: any) {
    logError(err, {
      tags: { feature: "match", action: "fetch", endpoint: "GET /api/matches/individual" },
    });

    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
