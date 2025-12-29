import { User } from "@/models/User";
import Team from "@/models/Team";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";
import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
} from "@/lib/api";

/**
 * Add a participant to a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export const POST = withDBAndErrorHandling(async (req, context) => {
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
    (tournament as any).matchType === "doubles" &&
    (tournament as any).doublesPairs &&
    (tournament as any).doublesPairs.length > 0
  ) {
    (tournament as any).doublesPairs = [];
    (tournament as any).markModified("doublesPairs");
  }

  await tournament.save();

  // Populate tournament data based on category
  await (tournament as any).populate("participants");
  await (tournament as any).populate("organizer");
  await (tournament as any).populate("seeding.participant");

  return jsonOk({
    message: isTeamTournament
      ? "Team added successfully!"
      : (tournament as any).matchType === "doubles"
      ? "Participant added successfully! Note: Doubles pairs have been cleared and must be recreated."
      : "Participant added successfully!",
    tournament,
  });
});

/**
 * Remove a participant from a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export const DELETE = withDBAndErrorHandling(async (req, context) => {
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
});
