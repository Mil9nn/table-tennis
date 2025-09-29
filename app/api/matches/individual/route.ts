import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const scorer = await User.findById(decoded.userId);
    if (!scorer) return NextResponse.json({ error: "Invalid scorer" }, { status: 400 });

    // ✅ Validate inputs
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

    // Lookup participants by IDs
    const users = await User.find({ _id: { $in: body.participants } }).select(
      "_id username fullName"
    );
    if (users.length !== body.participants.length) {
      return NextResponse.json(
        { error: "Invalid player IDs" },
        { status: 400 }
      );
    }

    const match = new IndividualMatch({
      matchType: body.matchType,
      matchCategory: "individual",
      numberOfSets: Number(body.numberOfSets),
      city: body.city,
      venue: body.venue || body.city,
      participants: body.participants, // ✅ directly use IDs
      scorer: scorer._id,
    });

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json(
      { message: "Individual match created", match },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating individual match:", err);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const matches = await IndividualMatch.find()
      .populate("participants", "username fullName")
      .populate("scorer", "username fullName")
      .populate("games.shots.player", "username fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Error fetching individual matches:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
