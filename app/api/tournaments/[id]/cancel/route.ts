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
 * Cancel a tournament (organizer only)
 * Sets status to "cancelled" and prevents further actions
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
  } catch (error) {
    return jsonError(error);
  }
}
