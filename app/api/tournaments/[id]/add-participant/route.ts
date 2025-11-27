// app/api/tournaments/[id]/add-participant/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

/**
 * Add a participant to a tournament (organizer only)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can add participants
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Check if draw is already generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot add participants - tournament draw has already been generated" },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    const isAlreadyParticipant = tournament.participants.some(
      (p) => p.toString() === participantId
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: "User is already registered for this tournament" },
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
    tournament.participants.push(participantId as any);
    await tournament.save();

    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "organizer", select: "username fullName" },
    ]);

    return NextResponse.json({
      message: "Participant added successfully!",
      tournament,
    });
  } catch (err: any) {
    console.error("Error adding participant:", err);
    return NextResponse.json(
      { error: "Failed to add participant", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * Remove a participant from a tournament (organizer only)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can remove participants
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if draw is already generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot remove participants - tournament draw has already been generated" },
        { status: 403 }
      );
    }

    // Remove participant
    tournament.participants = tournament.participants.filter(
      (p) => p.toString() !== participantId
    );

    // Also remove from seeding if present
    tournament.seeding = tournament.seeding.filter(
      (s) => s.participant.toString() !== participantId
    );

    await tournament.save();

    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "organizer", select: "username fullName" },
    ]);

    return NextResponse.json({
      message: "Participant removed successfully!",
      tournament,
    });
  } catch (err: any) {
    console.error("Error removing participant:", err);
    return NextResponse.json(
      { error: "Failed to remove participant", details: err.message },
      { status: 500 }
    );
  }
}
