import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { rateLimit } from "@/lib/rate-limit/middleware";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

/**
 * Remove a scorer from a tournament (organizer only)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await connectDB();
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
    // Mark the scorers array as modified to ensure Mongoose tracks the change
    tournament.markModified("scorers");
    await tournament.save();

    // Reload tournament using the same model type to ensure consistency
    // Use loadTournament to get the correct model (TournamentIndividual or TournamentTeam)
    const { tournament: updatedTournament } = await loadTournament(id, authUserId, {
      requireOrganizer: true,
      skipConnect: true,
      populateScorers: true,
    });

    return jsonOk({
      message: "Scorer removed successfully",
      tournament: updatedTournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}
