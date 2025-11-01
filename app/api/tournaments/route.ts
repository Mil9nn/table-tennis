// app/api/tournaments/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const {
      name,
      format,
      category,
      matchType,
      startDate,
      city,
      venue,
      description,
      participants,
      rules,
      registrationDeadline,
    } = body;

    // Validate
    if (!name || !format || !category || !matchType || !startDate || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["round_robin", "knockout", "swiss"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid tournament format" },
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

    const tournament = new Tournament({
      name,
      format,
      category,
      matchType,
      startDate: new Date(startDate),
      city,
      venue: venue || city,
      description,
      participants: participants || [],
      organizer: decoded.userId,
      rules: {
        pointsForWin: rules?.pointsForWin || 2,
        pointsForLoss: rules?.pointsForLoss || 0,
        pointsForDraw: rules?.pointsForDraw || 1,
        setsPerMatch: rules?.setsPerMatch || 3,
        advanceTop: rules?.advanceTop || 0,
      },
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      status: "draft",
    });

    await tournament.save();
    await tournament.populate("organizer participants", "username fullName profileImage");

    return NextResponse.json(
      { message: "Tournament created successfully", tournament },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating tournament:", err);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    let query: any = {};
    if (status) query.status = status;
    if (format) query.format = format;

    let tournamentQuery = Tournament.find(query)
      .populate("organizer participants", "username fullName profileImage")
      .sort({ startDate: -1 });

    if (limit > 0) {
      tournamentQuery = tournamentQuery.limit(limit);
    }

    const tournaments = await tournamentQuery;

    return NextResponse.json({ tournaments }, { status: 200 });
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}