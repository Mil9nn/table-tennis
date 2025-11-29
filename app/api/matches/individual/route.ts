import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import Tournament from "@/models/Tournament";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";

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

    // 📝 Create match
    const match = new IndividualMatch({
      matchType: body.matchType,
      matchCategory: "individual",
      numberOfSets: Number(body.numberOfSets),
      city: body.city,
      venue: body.venue || body.city,
      participants: body.participants, // just IDs
      scorer: scorer._id,
    });

    await match.save();

    // 👇 Populate with profileImage
    await match.populate("participants", "username fullName profileImage");

    const matchObj = match.toObject();

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

    // Ensure Tournament model is registered before populate
    Tournament;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const context = searchParams.get("context"); // "casual", "tournament", or null (all)

    // Build filter based on context
    let filter = {};
    if (context === "casual") {
      filter = { tournament: null };
    } else if (context === "tournament") {
      filter = { tournament: { $ne: null } };
    }

    let query = IndividualMatch.find(filter)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName")
      .populate("games.shots.player", "username fullName")
      .populate("tournament", "name format status")
      .sort({ createdAt: -1 })

    // apply limit if provided
    if (limit > 0) {
      query = query.limit(limit);
    }

    const matches = await query;

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Error fetching individual matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
