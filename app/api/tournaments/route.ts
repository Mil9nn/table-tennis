// app/api/tournaments/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const body = await request.json();

    const {
      name,
      format,
      category,
      matchType,
      startDate,
      city,
      venue,
      participants,
      rules,
      useGroups,
      numberOfGroups,
      advancePerGroup,
      seedingMethod,
      knockoutConfig,
      hybridConfig,
    } = body;

    // Validate
    if (!name || !format || !category || !matchType || !startDate || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate participants
    if (participants && participants.length > 0) {
      const users = await User.find({ _id: { $in: participants } });
      if (users.length !== participants.length) {
        return NextResponse.json(
          { error: "Invalid participant IDs" },
          { status: 400 }
        );
      }
    }

    // Initialize seeding array with registration order
    const initialSeeding = participants
      ? participants.map((pId: string, index: number) => ({
          participant: pId,
          seedNumber: index + 1,
        }))
      : [];

    const tournament = new Tournament({
      name,
      format,
      category,
      matchType,
      startDate: new Date(startDate),
      city,
      venue,
      participants: participants || [],
      organizer: auth.userId,
      useGroups: useGroups || false,
      numberOfGroups: numberOfGroups || undefined,
      advancePerGroup: advancePerGroup || undefined,
      seedingMethod: seedingMethod || "none",
      knockoutConfig: knockoutConfig || undefined,
      hybridConfig: hybridConfig || undefined,
      currentPhase: format === "hybrid" ? "round_robin" : undefined,
      seeding: initialSeeding, // Initialize seeding with registration order
      rules: {
        pointsForWin: rules?.pointsForWin || 2, // ITTF standard: 2 points for win
        pointsForLoss: rules?.pointsForLoss || 0,
        setsPerMatch: rules?.setsPerMatch || 3,
        pointsPerSet: rules?.pointsPerSet || 11,
        advanceTop: rules?.advanceTop || 0,
        deuceSetting: rules?.deuceSetting || "standard",
        tiebreakRules: rules?.tiebreakRules || [
          "points",
          "head_to_head",
          "sets_ratio",
          "points_ratio",
          "sets_won",
        ],
      },
      status: "draft",
    });

    await tournament.save();
    await tournament.populate([
      { path: "organizer participants", select: "username fullName profileImage" },
      { path: "standings.participant", select: "username fullName profileImage" },
      { path: "groups.standings.participant", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName profileImage" },
    ]);

    return NextResponse.json(
      { message: "Tournament created successfully", tournament },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating tournament:", err);
    console.error("Error details:", err.message);
    if (err.errors) {
      console.error("Validation errors:", err.errors);
    }
    return NextResponse.json(
      {
        error: "Failed to create tournament",
        details: err.message,
        validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        })) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Ensure Tournament model is registered
    Tournament;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    let query: any = {};
    if (status) query.status = status;
    if (format) query.format = format;

    let tournamentQuery = Tournament.find(query)
      .populate("organizer participants", "username fullName profileImage")
      .populate("standings.participant", "username fullName profileImage")
      .populate("groups.standings.participant", "username fullName profileImage")
      .populate("seeding.participant", "username fullName profileImage")
      .sort({ startDate: -1 })
      .skip(skip);

    if (limit > 0) {
      tournamentQuery = tournamentQuery.limit(limit);
    }

    const tournaments = await tournamentQuery;

    // Get total count for pagination
    const totalCount = await Tournament.countDocuments(query);

    return NextResponse.json({
      tournaments,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + tournaments.length < totalCount
      }
    }, { status: 200 });
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}