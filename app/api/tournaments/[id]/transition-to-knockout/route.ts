/**
 * POST /api/tournaments/[id]/transition-to-knockout
 *
 * Transitions a hybrid tournament from round-robin phase to knockout phase
 * - Validates round-robin phase is complete
 * - Determines qualified participants
 * - Generates knockout bracket
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { syncTournamentProjections } from "@/models/utils/tournamentProjectionSync";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { transitionToKnockoutPhase, getPhaseInfo } from "@/services/tournament";
import { loadTournament } from "@/lib/api/tournamentLoader";
import { loadAndApplyProjectedTournamentData } from "@/lib/api/tournamentProjections";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const params = await context.params;
    const tournamentId = params.id;

    // Load tournament using the correct model (Team vs Individual)
    const { tournament: initialTournament, isTeamTournament } = await loadTournament(tournamentId, decoded.userId, {
      skipConnect: true,
      requireOrganizer: true,
    });

    // Verify it's a hybrid tournament
    if (initialTournament.format !== "hybrid") {
      return NextResponse.json(
        { error: "Tournament must be hybrid format to transition phases" },
        { status: 400 }
      );
    }

    // Reload tournament fresh to avoid version conflicts
    // This ensures we have the latest version after any concurrent updates (e.g., from hybrid-status endpoint)
    let tournament: any = null;
    if (isTeamTournament) {
      const TournamentTeam = (await import("@/models/TournamentTeam")).default;
      tournament = await (TournamentTeam as any).findById(tournamentId);
    } else {
      const TournamentIndividual = (await import("@/models/TournamentIndividual")).default;
      tournament = await (TournamentIndividual as any).findById(tournamentId);
    }

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get current phase info
    const phaseInfo = getPhaseInfo(tournament);

    // Check if already in knockout phase
    if (phaseInfo.currentPhase === "knockout") {
      return NextResponse.json(
        { error: "Tournament is already in knockout phase" },
        { status: 400 }
      );
    }

    // Check if in transition
    if (phaseInfo.currentPhase === "transition") {
      return NextResponse.json(
        { error: "Tournament is already transitioning to knockout phase" },
        { status: 400 }
      );
    }

    // Perform transition
    const result = await transitionToKnockoutPhase(tournament, {
      scorerId: new mongoose.Types.ObjectId(decoded.userId),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to transition to knockout phase",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // Save tournament
    await tournament.save();
    try {
      await syncTournamentProjections(tournament.toObject ? tournament.toObject() : tournament);
    } catch (projectionSyncError) {
      console.error("[transition-to-knockout POST] Projection sync failed:", projectionSyncError);
    }

    // Fetch updated tournament with populated data using the correct model
    // Also load bracket from BracketState if not in tournament document
    let updatedTournament: any = null;
    if (isTeamTournament) {
      const TournamentTeam = (await import("@/models/TournamentTeam")).default;
      updatedTournament = await (TournamentTeam as any).findById(tournamentId)
        .populate("participants", "name email profilePicture")
        .populate("qualifiedParticipants", "name email profilePicture")
        .populate("organizer", "name email");
    } else {
      const TournamentIndividual = (await import("@/models/TournamentIndividual")).default;
      updatedTournament = await (TournamentIndividual as any).findById(tournamentId)
        .populate("participants", "name email profilePicture")
        .populate("qualifiedParticipants", "name email profilePicture")
        .populate("organizer", "name email");
    }

    // Load bracket from BracketState if not in tournament document or is empty
    if (updatedTournament) {
      const hasBracket = updatedTournament.bracket && 
        typeof updatedTournament.bracket === 'object' && 
        Object.keys(updatedTournament.bracket).length > 0 &&
        updatedTournament.bracket.rounds && 
        Array.isArray(updatedTournament.bracket.rounds) && 
        updatedTournament.bracket.rounds.length > 0;
      
      if (!hasBracket) {
        const BracketState = (await import("@/models/BracketState")).default;
        const bracketState = await BracketState.findOne({ tournament: tournamentId });
        if (bracketState) {
          (updatedTournament as any).bracket = {
            size: bracketState.size,
            rounds: bracketState.rounds,
            currentRound: bracketState.currentRound,
            completed: bracketState.completed,
            thirdPlaceMatch: bracketState.thirdPlaceMatch,
          };
        }
      }
    }

    const tournamentData = updatedTournament?.toObject
      ? updatedTournament.toObject()
      : updatedTournament;
    await loadAndApplyProjectedTournamentData(tournamentId, tournamentData);

    return NextResponse.json(
      {
        message: result.message,
        warnings: result.warnings,
        tournament: tournamentData,
        result: {
          phase: result.phase,
          matchesCreated: result.matchesCreated,
          qualifiedCount: phaseInfo.qualifiedCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error transitioning to knockout phase:", error);
    return NextResponse.json(
      {
        error: "Failed to transition to knockout phase",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tournaments/[id]/transition-to-knockout
 *
 * Check if tournament can transition to knockout phase
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const params = await context.params;
    const tournamentId = params.id;

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Verify it's a hybrid tournament
    if (tournament.format !== "hybrid") {
      return NextResponse.json(
        { error: "Tournament must be hybrid format" },
        { status: 400 }
      );
    }

    // Get phase information
    const phaseInfo = getPhaseInfo(tournament);

    return NextResponse.json(
      {
        canTransition: phaseInfo.canTransition,
        currentPhase: phaseInfo.currentPhase,
        roundRobinComplete: phaseInfo.roundRobinComplete,
        knockoutComplete: phaseInfo.knockoutComplete,
        qualifiedCount: phaseInfo.qualifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking transition status:", error);
    return NextResponse.json(
      {
        error: "Failed to check transition status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
