import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";

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

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Validate organizer permissions
    const organizerCheck = TournamentValidators.validateIsOrganizer(
      tournament,
      decoded.userId
    );
    const error = handleValidationResult(organizerCheck);
    if (error) return error;

    // Get participant ID from request
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

    // Validate draw not generated
    const drawCheck = TournamentValidators.validateDrawNotGenerated(tournament);
    const drawError = handleValidationResult(drawCheck);
    if (drawError) return drawError;

    // Validate participant not already in tournament
    const notInTournamentCheck =
      TournamentValidators.validateParticipantNotInTournament(
        tournament,
        participantId
      );
    const notInError = handleValidationResult(notInTournamentCheck);
    if (notInError) return notInError;

    // Validate capacity
    const capacityCheck = TournamentValidators.validateCapacity(tournament);
    const capacityError = handleValidationResult(capacityCheck);
    if (capacityError) return capacityError;

    // Add user to participants
    tournament.participants.push(participantId as any);
    await tournament.save();

    // Populate tournament data
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

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Validate organizer permissions
    const organizerCheck = TournamentValidators.validateIsOrganizer(
      tournament,
      decoded.userId
    );
    const error = handleValidationResult(organizerCheck);
    if (error) return error;

    // Get participant ID from request
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Validate draw not generated
    const drawCheck = TournamentValidators.validateDrawNotGenerated(tournament);
    const drawError = handleValidationResult(drawCheck);
    if (drawError) return drawError;

    // Validate participant is in tournament
    const inTournamentCheck = TournamentValidators.validateParticipantInTournament(
      tournament,
      participantId
    );
    const inError = handleValidationResult(inTournamentCheck);
    if (inError) return inError;

    // Remove participant
    tournament.participants = tournament.participants.filter(
      (p: any) => p.toString() !== participantId
    );

    // Also remove from seeding if present
    tournament.seeding = tournament.seeding.filter(
      (s: any) => s.participant.toString() !== participantId
    );

    await tournament.save();

    // Populate tournament data
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
