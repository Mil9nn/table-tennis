import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

      // CRITICAL: Deduplicate pairs by canonical player combination before normalizing
      // This ensures we only have unique pairs even if duplicates exist in the database
      const uniquePairsMap = new Map<string, any>(); // Map: canonicalKey -> pair
      
      for (const pair of doublesPairs) {
        if (!pair || !pair.player1 || !pair.player2) continue;
        
        const player1Id = pair.player1?.toString() || '';
        const player2Id = pair.player2?.toString() || '';
        
        if (!player1Id || !player2Id) continue;
        
        // Create canonical key (order-independent player combination)
        const canonicalKey = player1Id < player2Id 
          ? `${player1Id}:${player2Id}` 
          : `${player2Id}:${player1Id}`;
        
        // Only keep the first occurrence of each canonical pair
        if (!uniquePairsMap.has(canonicalKey)) {
          uniquePairsMap.set(canonicalKey, pair);
        } else {
          console.warn(`[generate-matches] Duplicate pair found in database: ${canonicalKey}, keeping first occurrence`);
        }
      }
      
      // Normalize the unique pairs: Convert any string IDs (temp IDs starting with 'pair-') to ObjectIds
      const normalizedPairs = Array.from(uniquePairsMap.values()).map((pair: any) => {
        const pairIdStr = pair._id?.toString() || '';
        // If pair ID is a temporary string (starts with 'pair-'), generate new ObjectId
        // Otherwise, ensure it's a valid ObjectId
        const pairId = pairIdStr.startsWith('pair-') || !mongoose.Types.ObjectId.isValid(pairIdStr)
          ? new mongoose.Types.ObjectId()
          : new mongoose.Types.ObjectId(pair._id);
        
        return {
          _id: pairId,
          player1: new mongoose.Types.ObjectId(pair.player1),
          player2: new mongoose.Types.ObjectId(pair.player2),
        };
      });
      
      // Validate we have the expected number of unique pairs
      const expectedPairs = participants.length / 2;
      if (normalizedPairs.length !== expectedPairs) {
        return NextResponse.json(
          {
            error: "Invalid pairs configuration",
            details: `Expected ${expectedPairs} unique pairs for ${participants.length} participants, but found ${normalizedPairs.length} after deduplication. Please reconfigure pairs.`,
          },
          { status: 400 }
        );
      }

      // Update tournament with normalized, deduplicated pairs
      (tournament as any).doublesPairs = normalizedPairs;
      (tournament as any).markModified('doublesPairs');
      await tournament.save();
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