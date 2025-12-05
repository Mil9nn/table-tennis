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
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { transitionToKnockoutPhase, getPhaseInfo } from "@/services/tournament";
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

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Verify organizer
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the organizer can transition tournament phases" },
        { status: 403 }
      );
    }

    // Verify it's a hybrid tournament
    if (tournament.format !== "hybrid") {
      return NextResponse.json(
        { error: "Tournament must be hybrid format to transition phases" },
        { status: 400 }
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

    // Fetch updated tournament with populated data
    const updatedTournament = await Tournament.findById(tournamentId)
      .populate("participants", "name email profilePicture")
      .populate("qualifiedParticipants", "name email profilePicture")
      .populate("organizer", "name email");

    return NextResponse.json(
      {
        message: result.message,
        warnings: result.warnings,
        tournament: updatedTournament,
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
