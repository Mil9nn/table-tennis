import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit/middleware";
import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
} from "@/lib/api";

const MAX_SCORERS = 10;

/**
 * Add a scorer to a tournament (organizer only)
 */
export const POST = withDBAndErrorHandling(async (req, context) => {
  const { id } = await context.params;

  // Rate limit check
  const rateLimitResponse = await rateLimit(
    req,
    "POST",
    `/api/tournaments/${id}/scorers`
  );
  if (rateLimitResponse) return rateLimitResponse;

  const { userId: authUserId } = await requireAuth(req);
  const { userId } = await req.json();

  if (!userId) {
    throw ApiError.badRequest("userId is required");
  }

  const { tournament } = await loadTournament(id, authUserId, {
    requireOrganizer: true,
    skipConnect: true,
  });

  // Check if user exists
  const user = await User.findById(userId).select("_id username fullName");
  if (!user) {
    throw ApiError.notFound("User");
  }

  // Check if user is already the organizer
  if (tournament.organizer.toString() === userId) {
    throw ApiError.badRequest(
      "The organizer is already an admin and can score matches"
    );
  }

  // Check if user is already a scorer
  const isAlreadyScorer = tournament.scorers?.some(
    (scorerId: any) => scorerId.toString() === userId
  );
  if (isAlreadyScorer) {
    throw ApiError.badRequest("User is already a scorer for this tournament");
  }

  // Check max scorers limit
  if ((tournament.scorers?.length || 0) >= MAX_SCORERS) {
    throw ApiError.badRequest(
      `Maximum ${MAX_SCORERS} scorers allowed per tournament`
    );
  }

  // Add scorer
  if (!tournament.scorers) {
    tournament.scorers = [];
  }
  tournament.scorers.push(userId);
  await tournament.save();

  // Return updated tournament with populated scorers
  const updatedTournament = await Tournament.findById(id)
    .populate("organizer", "username fullName profileImage")
    .populate("scorers", "username fullName profileImage");

  return jsonOk({
    message: "Scorer added successfully",
    tournament: updatedTournament,
  });
});

/**
 * Get scorers for a tournament
 */
export const GET = withDBAndErrorHandling(async (req, context) => {
  const { id } = await context.params;

  const tournament = await Tournament.findById(id)
    .select("organizer scorers")
    .populate("organizer", "username fullName profileImage")
    .populate("scorers", "username fullName profileImage");

  if (!tournament) {
    throw ApiError.notFound("Tournament");
  }

  return jsonOk({
    organizer: tournament.organizer,
    scorers: tournament.scorers || [],
    maxScorers: MAX_SCORERS,
  });
});
