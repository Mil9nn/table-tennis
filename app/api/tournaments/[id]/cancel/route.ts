import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";

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

    // Prevent cancellation if tournament is already completed
    if (tournament.status === "completed") {
      return NextResponse.json(
        { 
          error: "Cannot cancel completed tournament",
          details: "Completed tournaments cannot be cancelled."
        },
        { status: 400 }
      );
    }

    // Cancel tournament
    tournament.status = "cancelled";
    await tournament.save();

    // Populate tournament data
    await tournament.populate([
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "standings.participant", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Tournament cancelled successfully",
      tournament,
    });
  } catch (err: any) {
    console.error("Error cancelling tournament:", err);
    return NextResponse.json(
      { error: "Failed to cancel tournament", details: err.message },
      { status: 500 }
    );
  }
}

