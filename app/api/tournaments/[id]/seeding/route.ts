import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";

/**
 * Update tournament seeding (organizer only)
 * PUT /api/tournaments/[id]/seeding
 */
export async function PUT(
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

    // Prevent seeding changes after draw generation
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { 
          error: "Cannot modify seeding after draw generation",
          details: "Seeding cannot be changed once the tournament draw has been generated."
        },
        { status: 400 }
      );
    }

    // Get seeding data from request
    const { seeding } = await req.json();

    if (!Array.isArray(seeding)) {
      return NextResponse.json(
        { error: "Seeding must be an array" },
        { status: 400 }
      );
    }

    // Validate seeding data
    const participantIds = tournament.participants.map((p: any) => p.toString());
    const seedingParticipantIds = seeding.map((s: any) => s.participant?.toString() || s.participant);

    // Check all participants are in tournament
    for (const seedParticipantId of seedingParticipantIds) {
      if (!participantIds.includes(seedParticipantId)) {
        return NextResponse.json(
          { 
            error: "Invalid participant in seeding",
            details: `Participant ${seedParticipantId} is not in the tournament.`
          },
          { status: 400 }
        );
      }
    }

    // Check all tournament participants have seeds
    if (seedingParticipantIds.length !== participantIds.length) {
      return NextResponse.json(
        { 
          error: "Incomplete seeding",
          details: `All ${participantIds.length} participants must have seeds assigned.`
        },
        { status: 400 }
      );
    }

    // Check for duplicate seed numbers
    const seedNumbers = seeding.map((s: any) => s.seedNumber);
    const uniqueSeedNumbers = new Set(seedNumbers);
    if (seedNumbers.length !== uniqueSeedNumbers.size) {
      return NextResponse.json(
        { 
          error: "Duplicate seed numbers",
          details: "Each participant must have a unique seed number."
        },
        { status: 400 }
      );
    }

    // Validate seed numbers are sequential from 1
    const sortedSeedNumbers = [...seedNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sortedSeedNumbers.length; i++) {
      if (sortedSeedNumbers[i] !== i + 1) {
        return NextResponse.json(
          { 
            error: "Invalid seed numbers",
            details: "Seed numbers must be sequential starting from 1."
          },
          { status: 400 }
        );
      }
    }

    // Update seeding
    tournament.seeding = seeding.map((s: any) => ({
      participant: s.participant,
      seedNumber: s.seedNumber,
      seedingRank: s.seedingRank,
      seedingPoints: s.seedingPoints,
    }));

    tournament.seedingMethod = "manual";
    await tournament.save();

    // Populate tournament data
    await tournament.populate([
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Seeding updated successfully",
      tournament,
    });
  } catch (err: any) {
    console.error("Error updating seeding:", err);
    return NextResponse.json(
      { error: "Failed to update seeding", details: err.message },
      { status: 500 }
    );
  }
}

