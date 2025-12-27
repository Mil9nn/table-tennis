/**
 * GET /api/scorer/tournaments
 * 
 * List tournaments where the authenticated user is a scorer
 * (either organizer or in the scorers array)
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { withAuth } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { logError } from "@/lib/error-logger";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const rateLimitResponse = await rateLimit(req, "GET", "/api/scorer/tournaments");
    if (rateLimitResponse) return rateLimitResponse;

    // Authenticate user
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const userId = auth.userId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const search = searchParams.get("search");

    // Build query: user is organizer OR in scorers array
    const query: any = {
      $or: [
        { organizer: userId },
        { scorers: userId }
      ]
    };

    // Apply filters
    if (status && status !== "all") {
      query.status = status;
    }
    if (format && format !== "all") {
      query.format = format;
    }
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        ...query.$or,
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } }
      ];
    }

    // Fetch tournaments
    let baseQuery = Tournament.find(query)
      .sort({ startDate: -1 })
      .skip(skip);

    if (limit > 0) {
      baseQuery = baseQuery.limit(limit);
    }

    const tournamentsRaw = await baseQuery.lean();

    // Populate tournaments with necessary data
    const populatedTournaments = await Promise.all(
      tournamentsRaw.map(async (t: any) => {
        const isTeamTournament = t.category === "team";

        // Populate organizer
        if (t.organizer) {
          const organizer = await User.findById(t.organizer)
            .select("username fullName profileImage")
            .lean();
          t.organizer = organizer;
        }

        // Populate scorers
        if (t.scorers && t.scorers.length > 0) {
          const scorers = await User.find({ _id: { $in: t.scorers } })
            .select("username fullName profileImage")
            .lean();
          const scorerMap = new Map();
          scorers.forEach((scorer: any) => scorerMap.set(scorer._id.toString(), scorer));
          t.scorers = t.scorers.map((sId: any) => scorerMap.get(sId.toString()) || sId);
        }

        // Populate participants (basic info only for list view)
        if (t.participants && t.participants.length > 0) {
          if (isTeamTournament) {
            const teams = await Team.find({ _id: { $in: t.participants } })
              .select("name logo")
              .lean();
            const teamMap = new Map();
            teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
            t.participants = t.participants.map((pId: any) => 
              teamMap.get(pId.toString()) || pId
            );
          } else {
            const users = await User.find({ _id: { $in: t.participants } })
              .select("username fullName profileImage")
              .lean();
            const userMap = new Map();
            users.forEach((user: any) => userMap.set(user._id.toString(), user));
            t.participants = t.participants.map((pId: any) => 
              userMap.get(pId.toString()) || pId
            );
          }
        }

        return t;
      })
    );

    // Get total count for pagination
    const totalCount = await Tournament.countDocuments(query);

    return NextResponse.json({
      tournaments: populatedTournaments,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + populatedTournaments.length < totalCount
      }
    }, { status: 200 });
  } catch (err: any) {
    logError(err, {
      tags: { feature: "scorer", action: "fetch_tournaments", endpoint: "GET /api/scorer/tournaments" },
    });

    return NextResponse.json(
      {
        error: "Failed to fetch tournaments",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}

