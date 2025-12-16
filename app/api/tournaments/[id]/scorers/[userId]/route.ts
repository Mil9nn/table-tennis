import Tournament from "@/models/Tournament";
import { rateLimit } from "@/lib/rate-limit/middleware";
import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
} from "@/lib/api";

/**
 * Remove a scorer from a tournament (organizer only)
 */
export const DELETE = withDBAndErrorHandling(async (req, context) => {
  const { id, userId: scorerUserId } = await context.params;

  // Rate limit check
  const rateLimitResponse = await rateLimit(
    req,
    "DELETE",
    `/api/tournaments/${id}/scorers/${scorerUserId}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  const { userId: authUserId } = await requireAuth(req);

  const { tournament } = await loadTournament(id, authUserId, {
    requireOrganizer: true,
    skipConnect: true,
  });

  // Check if user is in scorers array
  const scorerIndex = tournament.scorers?.findIndex(
    (scorerId: any) => scorerId.toString() === scorerUserId
  );

  if (scorerIndex === undefined || scorerIndex === -1) {
    throw ApiError.notFound("Scorer");
  }

  // Remove scorer
  tournament.scorers.splice(scorerIndex, 1);
  await tournament.save();

  // Return updated tournament with populated scorers
  const updatedTournament = await Tournament.findById(id)
    .populate("organizer", "username fullName profileImage")
    .populate("scorers", "username fullName profileImage");

  return jsonOk({
    message: "Scorer removed successfully",
    tournament: updatedTournament,
  });
});
