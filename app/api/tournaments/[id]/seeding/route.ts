import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

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
    const { userId } = await requireAuth(req);
    const { id } = await context.params;

    const { tournament, isTeamTournament } = await loadTournament(id, userId, {
      requireOrganizer: true,
      skipConnect: true,
    });

    // Prevent seeding changes after draw generation
    if (tournament.drawGenerated) {
      throw ApiError.badRequest(
        "Cannot modify seeding after draw generation",
        "Seeding cannot be changed once the tournament draw has been generated."
      );
    }

    // Get seeding data from request
    const { seeding } = await req.json();

    if (!Array.isArray(seeding)) {
      throw ApiError.badRequest("Seeding must be an array");
    }

    // Validate seeding data
    const participantIds = tournament.participants.map((p: any) => p.toString());
    const seedingParticipantIds = seeding.map(
      (s: any) => s.participant?.toString() || s.participant
    );

    // Check all participants are in tournament
    for (const seedParticipantId of seedingParticipantIds) {
      if (!participantIds.includes(seedParticipantId)) {
        throw ApiError.badRequest(
          "Invalid participant in seeding",
          `Participant ${seedParticipantId} is not in the tournament.`
        );
      }
    }

    // Check all tournament participants have seeds
    if (seedingParticipantIds.length !== participantIds.length) {
      throw ApiError.badRequest(
        "Incomplete seeding",
        `All ${participantIds.length} participants must have seeds assigned.`
      );
    }

    // Check for duplicate seed numbers
    const seedNumbers = seeding.map((s: any) => s.seedNumber);
    const uniqueSeedNumbers = new Set(seedNumbers);
    if (seedNumbers.length !== uniqueSeedNumbers.size) {
      throw ApiError.badRequest(
        "Duplicate seed numbers",
        "Each participant must have a unique seed number."
      );
    }

    // Validate seed numbers are sequential from 1
    const sortedSeedNumbers = [...seedNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sortedSeedNumbers.length; i++) {
      if (sortedSeedNumbers[i] !== i + 1) {
        throw ApiError.badRequest(
          "Invalid seed numbers",
          "Seed numbers must be sequential starting from 1."
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
    await (tournament as any).populate("organizer");
    await (tournament as any).populate("participants");
    await (tournament as any).populate("seeding.participant");

    return jsonOk({
      message: "Seeding updated successfully",
      tournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}
