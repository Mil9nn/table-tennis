import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
} from "@/lib/api";

/**
 * Cancel a tournament (organizer only)
 * Sets status to "cancelled" and prevents further actions
 */
export const POST = withDBAndErrorHandling(async (req, context) => {
  const { userId } = await requireAuth(req);
  const { id } = await context.params;

  const { tournament, isTeamTournament } = await loadTournament(id, userId, {
    requireOrganizer: true,
    populateParticipants: true,
    populateStandings: true,
    skipConnect: true,
  });

  // Prevent cancellation if tournament is already completed
  if (tournament.status === "completed") {
    throw ApiError.badRequest(
      "Cannot cancel completed tournament",
      "Completed tournaments cannot be cancelled."
    );
  }

  // Cancel tournament
  tournament.status = "cancelled";
  await tournament.save();

  return jsonOk({
    message: "Tournament cancelled successfully",
    tournament,
  });
});
