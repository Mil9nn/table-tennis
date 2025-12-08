import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";
import { getAllMatchIds } from "@/services/tournament/tournamentUpdateService";

/**
 * Reset a tournament to draft status (organizer only)
 * Removes all matches and resets standings
 * Only allowed if tournament hasn't started or has no completed matches
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

    // Check if tournament has any completed matches
    if (tournament.drawGenerated) {
      const allMatchIds = getAllMatchIds(tournament);
      
      if (allMatchIds.length > 0) {
        const matches = await IndividualMatch.find({ _id: { $in: allMatchIds } });
        const hasCompletedMatches = matches.some((m: any) => m.status === "completed");
        
        if (hasCompletedMatches) {
          return NextResponse.json(
            { 
              error: "Cannot reset tournament with completed matches",
              details: "Tournaments with completed matches cannot be reset. This would invalidate match results and player statistics."
            },
            { status: 400 }
          );
        }
      }
    }

    // Reset tournament to draft
    tournament.status = "draft";
    tournament.drawGenerated = false;
    tournament.drawGeneratedAt = undefined;
    tournament.drawGeneratedBy = undefined;
    tournament.endDate = undefined;

    // Clear rounds and matches
    tournament.rounds = [];
    if (tournament.groups) {
      tournament.groups.forEach((group: any) => {
        group.rounds = [];
        group.standings = [];
      });
    }

    // Clear bracket for knockout/hybrid
    if (tournament.format === "knockout" || tournament.format === "hybrid") {
      tournament.bracket = undefined;
    }

    // Clear standings
    tournament.standings = [];

    // Reset hybrid phase if applicable
    if (tournament.format === "hybrid") {
      tournament.currentPhase = "round_robin";
      tournament.phaseTransitionDate = undefined;
      tournament.qualifiedParticipants = [];
    }

    await tournament.save();

    // Delete all associated match documents
    if (tournament.drawGenerated) {
      const allMatchIds = getAllMatchIds(tournament);
      if (allMatchIds.length > 0) {
        await IndividualMatch.deleteMany({ _id: { $in: allMatchIds } });
      }
    }

    // Populate tournament data
    await tournament.populate([
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Tournament reset successfully. You can now regenerate the draw.",
      tournament,
    });
  } catch (err: any) {
    console.error("Error resetting tournament:", err);
    return NextResponse.json(
      { error: "Failed to reset tournament", details: err.message },
      { status: 500 }
    );
  }
}

