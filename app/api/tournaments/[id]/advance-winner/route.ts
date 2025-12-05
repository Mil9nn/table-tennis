import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  updateBracketAfterMatch,
  getMatchesNeedingDocuments,
} from "@/services/tournament/core/bracketProgressionService";
import { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { createBracketMatch } from "@/services/tournament/core/matchGenerationService";

/**
 * Advance winner to the next round in knockout tournament
 * POST /api/tournaments/[id]/advance-winner
 *
 * Request body:
 * - matchId: string - The ID of the completed match
 * - winnerId: string - The ID of the winner participant
 *
 * This endpoint:
 * 1. Verifies the user is the tournament organizer or scorer
 * 2. Loads the tournament and verifies it's a knockout format
 * 3. Gets the match and verifies it's completed
 * 4. Uses bracketProgressionService to advance the winner
 * 5. Updates the tournament bracket in the database
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Ensure models are registered
    if (!IndividualMatch) {
      throw new Error("IndividualMatch model not loaded");
    }

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { matchId, winnerId } = body;

    // Validate request body
    if (!matchId || !winnerId) {
      return NextResponse.json(
        { error: "matchId and winnerId are required" },
        { status: 400 }
      );
    }

    // Load tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Verify tournament format is knockout
    if (tournament.format !== "knockout") {
      return NextResponse.json(
        { error: "This endpoint is only for knockout tournaments" },
        { status: 400 }
      );
    }

    // Verify bracket exists
    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found" },
        { status: 404 }
      );
    }

    // Load the match
    const match = await IndividualMatch.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Verify match belongs to this tournament
    if (match.tournament?.toString() !== id) {
      return NextResponse.json(
        { error: "Match does not belong to this tournament" },
        { status: 400 }
      );
    }

    // Verify user is organizer or scorer of the match
    const isOrganizer = tournament.organizer.toString() === decoded.userId;
    const isScorer = match.scorer?.toString() === decoded.userId;

    if (!isOrganizer && !isScorer) {
      return NextResponse.json(
        { error: "Only the tournament organizer or match scorer can advance winners" },
        { status: 403 }
      );
    }

    // Verify match is completed
    if (match.status !== "completed") {
      return NextResponse.json(
        { error: "Match must be completed before advancing winner" },
        { status: 400 }
      );
    }

    // Verify winner is a participant in the match
    const isParticipant = match.participants.some(
      (p: any) => p.toString() === winnerId
    );
    if (!isParticipant) {
      return NextResponse.json(
        { error: "Winner must be a participant in the match" },
        { status: 400 }
      );
    }

    // Verify winner matches the match winner
    if (match.winnerSide) {
      // Determine which participant is the winner based on winnerSide
      const side1Participant = match.participants[0]?.toString();
      const side2Participant = match.participants[1]?.toString();

      const expectedWinnerId = match.winnerSide === "side1"
        ? side1Participant
        : side2Participant;

      if (expectedWinnerId !== winnerId) {
        return NextResponse.json(
          { error: "Winner ID does not match the match result" },
          { status: 400 }
        );
      }
    }

    // Update bracket using progression service
    try {
      const updatedBracket: KnockoutBracket = updateBracketAfterMatch(
        tournament.bracket,
        matchId,
        winnerId
      );

      // Save updated bracket to tournament
      tournament.bracket = updatedBracket;
      tournament.markModified('bracket'); // CRITICAL: bracket is Schema.Types.Mixed

      // Check if tournament is completed (bracket completed)
      if (updatedBracket.completed) {
        tournament.status = "completed";
      } else if (tournament.status === "draft" || tournament.status === "upcoming") {
        tournament.status = "in_progress";
      }

      await tournament.save();

      // Auto-create IndividualMatch documents for new matches that need them
      const matchesNeedingDocs = getMatchesNeedingDocuments(updatedBracket);
      const failedMatches: Array<{ round: number; matchNumber: number; error: string }> = [];

      if (matchesNeedingDocs.length > 0) {
        console.log(`Creating ${matchesNeedingDocs.length} new match documents...`);

        for (const bracketMatch of matchesNeedingDocs) {
          try {
            const newMatchDoc = await createBracketMatch(
              bracketMatch,
              tournament,
              decoded.userId // Use current user as scorer
            );

            if (newMatchDoc) {
              // Update bracket with the new matchId
              bracketMatch.matchId = newMatchDoc._id.toString();
            }
          } catch (matchError: any) {
            console.error("Error creating match document:", matchError);
            failedMatches.push({
              round: bracketMatch.bracketPosition.round,
              matchNumber: bracketMatch.bracketPosition.matchNumber,
              error: matchError.message || "Unknown error"
            });
            // Continue creating other matches even if one fails
          }
        }

        // Save bracket again with updated matchIds
        await tournament.save();
      }

      // Populate for response
      const populatedTournament = await Tournament.findById(id)
        .populate("organizer", "username fullName profileImage")
        .populate("participants", "username fullName profileImage")
        .populate({
          path: "rounds.matches",
          model: "IndividualMatch",
          populate: {
            path: "participants",
            select: "username fullName profileImage",
          },
        });

      return NextResponse.json({
        message: "Winner advanced successfully",
        tournament: populatedTournament,
        bracket: updatedBracket,
        ...(failedMatches.length > 0 && {
          warning: `${failedMatches.length} match(es) failed to create`,
          failedMatches
        })
      });
    } catch (bracketError: any) {
      console.error("Error updating bracket:", bracketError);
      return NextResponse.json(
        {
          error: "Failed to update bracket",
          details: bracketError.message
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error advancing winner:", error);
    return NextResponse.json(
      { error: "Failed to advance winner", details: error.message },
      { status: 500 }
    );
  }
}
