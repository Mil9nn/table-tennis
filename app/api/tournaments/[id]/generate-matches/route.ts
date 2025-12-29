import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { matchGenerationOrchestrator } from "@/services/tournament/core/matchGenerationOrchestrator";
import { tournamentRepository } from "@/services/tournament/repositories/TournamentRepository";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";
import { rateLimit } from "@/lib/rate-limit/middleware";

/**
 * Generate tournament matches with ITTF-compliant scheduling
 * Supports: Round Robin and Knockout formats
 * Features: seeding, groups/pools
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(req, "POST", `/api/tournaments/${id}/generate-matches`);
  if (rateLimitResponse) return rateLimitResponse;

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

    // Find tournament using repository
    const tournament = await tournamentRepository.findById(id);
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

    // Validate draw can be generated
    const drawCheck = TournamentValidators.canGenerateDraw(tournament);
    const drawError = handleValidationResult(drawCheck);
    if (drawError) return drawError;

    // Additional validation for doubles tournaments
    if (
      (tournament as any).category === "individual" &&
      (tournament as any).matchType === "doubles"
    ) {
      const participants = tournament.participants;
      const doublesPairs = (tournament as any).doublesPairs || [];

      // Validate even number of participants
      if (participants.length % 2 !== 0) {
        return NextResponse.json(
          {
            error: "Doubles tournament requires an even number of participants",
            details: `Current participant count: ${participants.length}. Please add or remove one participant.`,
          },
          { status: 400 }
        );
      }

      // Validate all participants are paired
      if (doublesPairs.length === 0) {
        return NextResponse.json(
          {
            error: "Doubles pairs not configured",
            details:
              "Please create doubles pairs before generating the draw. Go to the tournament page and click 'Manage Pairs'.",
          },
          { status: 400 }
        );
      }

      // Validate all participants are paired
      const pairedPlayerCount = doublesPairs.length * 2;
      if (pairedPlayerCount !== participants.length) {
        return NextResponse.json(
          {
            error: "Not all participants are paired",
            details: `You have ${participants.length} participants but only ${pairedPlayerCount} players in pairs. Please update your pairs.`,
          },
          { status: 400 }
        );
      }

      // Validate no player appears in multiple pairs
      const playerIds = doublesPairs.flatMap((pair: any) => [
        pair.player1.toString(),
        pair.player2.toString(),
      ]);
      const uniquePlayerIds = new Set(playerIds);
      if (playerIds.length !== uniquePlayerIds.size) {
        return NextResponse.json(
          {
            error: "Invalid pairs configuration",
            details: "One or more players appear in multiple pairs.",
          },
          { status: 400 }
        );
      }
    }

    // Check if draw already generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Draw already generated. Delete existing matches first." },
        { status: 400 }
      );
    }

    // Generate tournament draw using orchestrator
    const result = await matchGenerationOrchestrator.generateTournamentDraw(
      id,
      decoded.userId,
      {
        courtsAvailable: 1,
        matchDuration: 60,
      }
    );

    return NextResponse.json({
      message: "Tournament draw generated successfully",
      tournament: result.tournament,
      stats: result.stats,
    });
  } catch (err: any) {
    console.error("[tournaments/[id]/generate-matches] Error:", err);
    return NextResponse.json(
      { 
        error: "Failed to generate matches",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}