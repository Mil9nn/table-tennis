import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  updateBracketAfterMatchWithState,
  updateBracketAfterMatch, // Keep for backward compatibility
} from "@/services/tournament/core/bracketProgressionService";
import { tournamentRepository } from "@/services/tournament/repositories/TournamentRepository";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";
import BracketState from "@/models/BracketState";

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

    // Load tournament using repository
    const tournament = await tournamentRepository.findById(id);
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

    // Check if bracket state exists (new architecture)
    const bracketState = await BracketState.findOne({ tournament: id });
    if (bracketState) {
      // Use new BracketState-based progression
      // Load the match using repository
      const match = await matchRepository.findById(matchId);
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

      // Verify user is organizer or scorer
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

      // Update bracket using BracketState
      try {
        const updatedBracketState = await updateBracketAfterMatchWithState(
          id,
          matchId,
          winnerId
        );

        // Update tournament status
        if (updatedBracketState.completed) {
          await tournamentRepository.updateStatus(id, "completed");
        } else if (tournament.status === "draft" || tournament.status === "upcoming") {
          await tournamentRepository.updateStatus(id, "in_progress");
        }

        // Populate for response
        const populatedTournament = await tournamentRepository.findByIdPopulated(id);

        return NextResponse.json({
          message: "Winner advanced successfully",
          tournament: populatedTournament,
          bracket: updatedBracketState,
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
    }

    // Fallback to legacy bracket handling (backward compatibility)
    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found" },
        { status: 404 }
      );
    }

    // Load the match using repository
    const match = await matchRepository.findById(matchId);
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

    // Use legacy bracket progression
    try {
      const updatedBracket = updateBracketAfterMatch(
        tournament.bracket,
        matchId,
        winnerId
      );

      // Update tournament status
      if (updatedBracket.completed) {
        await tournamentRepository.updateStatus(id, "completed");
      } else if (tournament.status === "draft" || tournament.status === "upcoming") {
        await tournamentRepository.updateStatus(id, "in_progress");
      }

      // Populate for response
      const populatedTournament = await tournamentRepository.findByIdPopulated(id);

      return NextResponse.json({
        message: "Winner advanced successfully",
        tournament: populatedTournament,
        bracket: updatedBracket,
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
