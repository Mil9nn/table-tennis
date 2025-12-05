import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { generateTournamentDraw } from "@/services/tournament/core/matchGenerationService";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";

/**
 * Generate tournament matches with ITTF-compliant scheduling
 * Supports: Round Robin and Knockout formats
 * Features: seeding, groups/pools
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

    // Validate draw can be generated
    const drawCheck = TournamentValidators.canGenerateDraw(tournament);
    const drawError = handleValidationResult(drawCheck);
    if (drawError) return drawError;

    // Check if draw already generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Draw already generated. Delete existing matches first." },
        { status: 400 }
      );
    }

    // Generate tournament draw using service
    const result = await generateTournamentDraw(tournament, decoded.userId, {
      courtsAvailable: 1,
      matchDuration: 60,
    });

    return NextResponse.json({
      message: "Tournament draw generated successfully",
      tournament: result.tournament,
      stats: result.stats,
    });
  } catch (err: any) {
    console.error("Error generating matches:", err);
    return NextResponse.json(
      { error: "Failed to generate matches", details: err.message },
      { status: 500 }
    );
  }
}