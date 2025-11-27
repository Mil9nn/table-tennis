// app/api/tournaments/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

/**
 * Join a tournament using a join code
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { joinCode } = await req.json();

    if (!joinCode || joinCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      );
    }

    // Find tournament by join code
    const tournament = await Tournament.findOne({
      joinCode: joinCode.toUpperCase().trim(),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Invalid join code" },
        { status: 404 }
      );
    }

    // Check if join by code is allowed
    if (!tournament.allowJoinByCode) {
      return NextResponse.json(
        { error: "This tournament does not allow joining by code" },
        { status: 403 }
      );
    }

    // Check if registration deadline has passed
    if (
      tournament.registrationDeadline &&
      new Date() > new Date(tournament.registrationDeadline)
    ) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 403 }
      );
    }

    // Check if draw is already generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot join - tournament draw has already been generated" },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    const isAlreadyParticipant = tournament.participants.some(
      (p) => p.toString() === decoded.userId
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: "You are already registered for this tournament" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (
      tournament.maxParticipants &&
      tournament.participants.length >= tournament.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 403 }
      );
    }

    // Add user to participants
    tournament.participants.push(decoded.userId as any);
    await tournament.save();

    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "organizer", select: "username fullName" },
    ]);

    return NextResponse.json({
      message: "Successfully joined tournament!",
      tournament,
    });
  } catch (err: any) {
    console.error("Error joining tournament:", err);
    return NextResponse.json(
      { error: "Failed to join tournament", details: err.message },
      { status: 500 }
    );
  }
}
