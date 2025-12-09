import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const body = await request.json();

    const scorer = await User.findById(auth.userId);
    if (!scorer) return NextResponse.json({ error: "invalid scorer, user not found" }, { status: 401 });

    // ✅ Validate
    if (
      !body.matchType ||
      !body.numberOfSets ||
      !body.city ||
      !Array.isArray(body.participants)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔎 Lookup participants
    const users = await User.find({ _id: { $in: body.participants } }).select(
      "_id username fullName profileImage"
    );

    if (users.length !== body.participants.length) {
      return NextResponse.json({ error: "Invalid player IDs" }, { status: 400 });
    }

    // 📝 Create match using repository
    const match = await matchRepository.createIndividualMatch({
      matchType: body.matchType,
      numberOfSets: Number(body.numberOfSets),
      city: body.city,
      venue: body.venue,
      participants: body.participants, // just IDs
      scorer: scorer._id.toString(),
    });

    // 👇 Populate with profileImage
    const populatedMatch = await matchRepository.findByIdWithParticipants(match._id.toString());
    const matchObj = populatedMatch?.toObject() || match.toObject();

    return NextResponse.json(
      { message: "Individual match created", match: matchObj },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating individual match:", err);
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
  } catch (err) {
    console.error("Error fetching individual matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
