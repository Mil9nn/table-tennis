import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";
import { validateRequest, createIndividualMatchSchema } from "@/lib/validations";
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
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const context = searchParams.get("context"); // "casual", "tournament", or null (all)

    // Use repository for casual matches
    if (context === "casual") {
      const matches = await matchRepository.findCasualMatches({
        limit: limit > 0 ? limit : undefined,
        skip,
      });

      // Populate participants
      const IndividualMatch = (await import("@/models/IndividualMatch")).default;
      const populatedMatches = await Promise.all(
        matches.map(async (m) => {
          if (m.matchCategory === "individual") {
            return IndividualMatch.findById(m._id)
              .populate("participants", "username fullName profileImage")
              .populate("scorer", "username fullName")
              .populate("games.shots.player", "username fullName")
              .populate("tournament", "name format status");
          }
          return m;
        })
      );

      const totalCount = await matchRepository.findCasualMatches().then(m => m.length);

      return NextResponse.json({
        matches: populatedMatches,
        pagination: {
          total: totalCount,
          skip,
          limit,
          hasMore: skip + matches.length < totalCount
        }
      });
    }

    // For tournament matches or all matches, use direct query for now
    // TODO: Add repository method for tournament matches
    const IndividualMatch = (await import("@/models/IndividualMatch")).default;
    const Tournament = (await import("@/models/Tournament")).default;

    // Build filter based on context
    let filter: any = {};
    if (context === "tournament") {
      filter = { tournament: { $ne: null } };
    }

    let query = IndividualMatch.find(filter)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName")
      .populate("games.shots.player", "username fullName")
      .populate("tournament", "name format status")
      .sort({ createdAt: -1 })
      .skip(skip);

    // apply limit if provided
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
