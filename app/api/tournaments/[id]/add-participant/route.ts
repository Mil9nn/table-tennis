import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import Team from "@/models/Team";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

/**
 * Add a participant to a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export async function POST(
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

  // Get participant ID from request
  const { participantId } = await req.json();

  if (!participantId) {
    throw ApiError.badRequest("Participant ID is required");
  }

  // Check if participant exists based on tournament category
  if (isTeamTournament) {
    const team = await Team.findById(participantId);
    if (!team) {
      throw ApiError.notFound("Team");
    }
  } else {
    const participant = await User.findById(participantId);
    if (!participant) {
      throw ApiError.notFound("Participant");
    }
  }

  // Validate draw not generated
  const drawCheck = TournamentValidators.validateDrawNotGenerated(tournament as any);
  const drawError = handleValidationResult(drawCheck);
  if (drawError) return drawError;

  // Validate participant not already in tournament
  const notInTournamentCheck =
    TournamentValidators.validateParticipantNotInTournament(
      tournament as any,
      participantId
    );
  const notInError = handleValidationResult(notInTournamentCheck);
  if (notInError) return notInError;

  // Validate capacity
  const capacityCheck = TournamentValidators.validateCapacity(tournament as any);
  const capacityError = handleValidationResult(capacityCheck);
  if (capacityError) return capacityError;

  // Add participant to tournament
  tournament.participants.push(participantId as any);

  // Clear doubles pairs if this is a doubles tournament
  // Pairs must be recreated after adding participants
  if (
    !isTeamTournament &&
    (tournament as any).matchType === "doubles"
  ) {
    if ((tournament as any).doublesPairs && (tournament as any).doublesPairs.length > 0) {
      (tournament as any).doublesPairs = [];
      (tournament as any).markModified("doublesPairs");
    }
  }

  // Log tournament state before save
  console.log("[add-participant] Before save - Tournament state:", {
    format: tournament.format,
    matchType: (tournament as any).matchType,
    participantCount: tournament.participants.length,
    drawGenerated: tournament.drawGenerated,
    status: tournament.status,
    hasHybridConfig: !!(tournament as any).hybridConfig,
    hasGroups: !!(tournament as any).groups && (tournament as any).groups.length > 0,
  });

  try {
    await tournament.save();
    console.log("[add-participant] Save successful");
  } catch (saveError: any) {
    console.error("[add-participant] Error saving tournament:", saveError);
    console.error("[add-participant] Error name:", saveError.name);
    console.error("[add-participant] Error message:", saveError.message);
    console.error("[add-participant] Error stack:", saveError.stack);
    console.error("[add-participant] Tournament state at error:", {
      format: tournament.format,
      matchType: (tournament as any).matchType,
      participantCount: tournament.participants.length,
      hasDoublesPairs: !!(tournament as any).doublesPairs,
      doublesPairsLength: (tournament as any).doublesPairs?.length || 0,
      drawGenerated: tournament.drawGenerated,
      drawGeneratedType: typeof tournament.drawGenerated,
      drawGeneratedValue: tournament.drawGenerated,
      status: tournament.status,
      hasHybridConfig: !!(tournament as any).hybridConfig,
    });
    if (saveError.errors) {
      console.error("[add-participant] Mongoose validation errors:", JSON.stringify(saveError.errors, null, 2));
    }
    // Re-throw the original error so we can see the actual Mongoose error
    throw saveError;
  }

  // Populate tournament data based on category
  try {
    await (tournament as any).populate("participants");
    await (tournament as any).populate("organizer");
    await (tournament as any).populate("seeding.participant");
  } catch (populateError: any) {
    console.error("[add-participant] Error populating tournament:", populateError);
    // Don't fail the request if populate fails, just log it
  }

  return jsonOk({
    message: isTeamTournament
      ? "Team added successfully!"
      : (tournament as any).matchType === "doubles"
      ? "Participant added successfully! Note: Doubles pairs have been cleared and must be recreated."
      : "Participant added successfully!",
    tournament,
  });
  } catch (error: any) {
    console.error("[add-participant] Unexpected error:", error);
    console.error("[add-participant] Error stack:", error.stack);
    console.error("[add-participant] Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return jsonError(error);
  }
}

/**
 * Remove a participant from a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export async function DELETE(
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

    // Get participant ID from request
    const { participantId } = await req.json();

    if (!participantId) {
      throw ApiError.badRequest("Participant ID is required");
    }

    // Prevent removal if draw has been generated
    if (tournament.drawGenerated) {
      throw ApiError.badRequest(
        "Cannot remove participant after draw generation",
        "Participants cannot be removed once the tournament draw has been generated. This would invalidate existing matches and standings."
      );
    }

    // Prevent removal if tournament has started
    if (tournament.status !== "draft" && tournament.status !== "upcoming") {
      throw ApiError.badRequest(
        "Cannot remove participant",
        "Participants cannot be removed once the tournament has started."
      );
    }

    // Validate participant is in tournament
    const inTournamentCheck = TournamentValidators.validateParticipantInTournament(
      tournament as any,
      participantId
    );
    const inError = handleValidationResult(inTournamentCheck);
    if (inError) return inError;

    // Check minimum participants requirement
    if (tournament.minParticipants) {
      const newParticipantCount = tournament.participants.length - 1;
      if (newParticipantCount < tournament.minParticipants) {
        throw ApiError.badRequest(
          "Cannot remove participant",
          `Removing this participant would leave ${newParticipantCount} participants, but minimum ${tournament.minParticipants} participants are required.`
        );
      }
    }

    // Remove participant
    tournament.participants = tournament.participants.filter(
      (p: any) => p.toString() !== participantId
    );

    // Also remove from seeding if present
    tournament.seeding = tournament.seeding.filter(
      (s: any) => s.participant.toString() !== participantId
    );

    // Clear doubles pairs if this is a doubles tournament
    // Pairs must be recreated after removing participants
    if (
      !isTeamTournament &&
      (tournament as any).matchType === "doubles" &&
      (tournament as any).doublesPairs &&
      (tournament as any).doublesPairs.length > 0
    ) {
      // Remove pairs that include the removed participant
      const updatedPairs = (tournament as any).doublesPairs.filter(
        (pair: any) =>
          pair.player1.toString() !== participantId &&
          pair.player2.toString() !== participantId
      );
      (tournament as any).doublesPairs = updatedPairs;
      (tournament as any).markModified("doublesPairs");
    }

    await tournament.save();

    // Populate tournament data based on category
    await (tournament as any).populate("participants");
    await (tournament as any).populate("organizer");
    await (tournament as any).populate("seeding.participant");

    return jsonOk({
      message: isTeamTournament
        ? "Team removed successfully!"
        : (tournament as any).matchType === "doubles"
        ? "Participant removed successfully! Note: Affected doubles pairs have been removed."
        : "Participant removed successfully!",
      tournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}
