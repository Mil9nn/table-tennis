import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  updateBracketAfterMatch,
  getMatchesNeedingDocuments,
} from "@/services/tournament/core/bracketProgressionService";
import { createBracketMatch } from "@/services/tournament/core/matchGenerationService";
import { rateLimit } from "@/lib/rate-limit/middleware";

/**
 * Reprocess knockout bracket based on completed matches
 * POST /api/tournaments/[id]/reprocess-bracket
 *
 * This endpoint:
 * 1. Finds all completed matches in the bracket
 * 2. Advances winners to next rounds
 * 3. Creates new match documents for determined matchups
 * 4. Updates tournament status
 *
 * Useful for fixing tournaments where matches were completed before
 * auto-advancement was implemented.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(req, "POST", `/api/tournaments/${id}/reprocess-bracket`);
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

    const { id } = await context.params;

    // Load tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Verify user is organizer
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the tournament organizer can reprocess brackets" },
        { status: 403 }
      );
    }

    // Verify tournament is knockout format
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

    console.log(`[reprocess-bracket] Starting reprocessing for tournament ${id}`);

    // Collect all match IDs from the bracket
    const allMatchIds: string[] = [];
    tournament.bracket.rounds.forEach((round: any) => {
      round.matches.forEach((match: any) => {
        if (match.matchId) {
          allMatchIds.push(match.matchId.toString());
        }
      });
    });

    if (tournament.bracket.thirdPlaceMatch?.matchId) {
      allMatchIds.push(tournament.bracket.thirdPlaceMatch.matchId.toString());
    }

    // Fetch all matches
    const matches = await IndividualMatch.find({
      _id: { $in: allMatchIds },
    })
      .populate("participants", "_id username fullName")
      .sort({ createdAt: 1 }); // Process in order of creation

    console.log(`[reprocess-bracket] Found ${matches.length} matches`);

    // Find completed matches that need processing
    const completedMatches = matches.filter(
      (m: any) => m.status === "completed" && m.winnerSide
    );

    console.log(`[reprocess-bracket] Found ${completedMatches.length} completed matches`);

    let advancedCount = 0;
    let newMatchesCreated = 0;

    // First, advance bye winners (completed matches in bracket with no matchId)
    for (let roundIndex = 0; roundIndex < tournament.bracket.rounds.length - 1; roundIndex++) {
      const currentRound = tournament.bracket.rounds[roundIndex];
      const nextRound = tournament.bracket.rounds[roundIndex + 1];

      for (const match of currentRound.matches) {
        // Check if this is a completed bye match (no matchId but has winner)
        if (match.completed && match.winner && !match.matchId && match.bracketPosition.nextMatchNumber) {
          const nextMatch = nextRound.matches.find(
            (m: any) => m.bracketPosition.matchNumber === match.bracketPosition.nextMatchNumber
          );

          if (nextMatch) {
            // Determine which slot the winner goes into
            if (match.bracketPosition.matchNumber % 2 === 1) {
              nextMatch.participant1 = match.winner;
            } else {
              nextMatch.participant2 = match.winner;
            }
            advancedCount++;
            console.log(`[reprocess-bracket] Advanced bye winner ${match.winner} from round ${roundIndex + 1} to round ${roundIndex + 2}`);
          }
        }
      }
    }

    // Mark bracket as modified after bye winner advancement
    if (advancedCount > 0) {
      tournament.markModified('bracket'); // CRITICAL: bracket is Schema.Types.Mixed
    }

    // Process each completed match document in order
    for (const match of completedMatches) {
      try {
        // Get winner ID
        const winnerId = match.winnerSide === "side1"
          ? match.participants[0]._id.toString()
          : match.participants[1]._id.toString();

        console.log(
          `[reprocess-bracket] Processing match ${match._id}, winner: ${winnerId}`
        );

        // Check if this match is already processed in the bracket
        const bracketMatch = tournament.bracket.rounds
          .flatMap((r: any) => r.matches)
          .find((bm: any) => bm.matchId?.toString() === match._id.toString());

        if (bracketMatch?.completed && bracketMatch?.winner === winnerId) {
          console.log(`[reprocess-bracket] Match ${match._id} already processed, skipping`);
          continue;
        }

        // Advance winner using bracket progression service
        try {
          tournament.bracket = updateBracketAfterMatch(
            tournament.bracket,
            match._id.toString(),
            winnerId
          );
          tournament.markModified('bracket'); // CRITICAL: bracket is Schema.Types.Mixed
          advancedCount++;
          console.log(`[reprocess-bracket] Advanced winner ${winnerId} from match ${match._id}`);
        } catch (advanceError: any) {
          console.error(
            `[reprocess-bracket] Error advancing winner for match ${match._id}:`,
            advanceError.message
          );
          // Continue with other matches
        }
      } catch (matchError: any) {
        console.error(
          `[reprocess-bracket] Error processing match ${match._id}:`,
          matchError
        );
        // Continue with other matches
      }
    }

    // Now create new match documents for matches that need them
    const matchesNeedingDocs = getMatchesNeedingDocuments(tournament.bracket);
    const failedMatches: Array<{ round: number; matchNumber: number; error: string }> = [];

    if (matchesNeedingDocs.length > 0) {
      console.log(
        `[reprocess-bracket] Creating ${matchesNeedingDocs.length} new match documents`
      );

      for (const bracketMatch of matchesNeedingDocs) {
        try {
          const newMatchDoc = await createBracketMatch(
            bracketMatch,
            tournament,
            decoded.userId
          );

          if (newMatchDoc) {
            bracketMatch.matchId = newMatchDoc._id.toString();
            newMatchesCreated++;
            console.log(
              `[reprocess-bracket] Created match ${newMatchDoc._id} for round ${bracketMatch.bracketPosition.round}`
            );
          }
        } catch (createError: any) {
          console.error(
            `[reprocess-bracket] Error creating match document:`,
            createError
          );
          failedMatches.push({
            round: bracketMatch.bracketPosition.round,
            matchNumber: bracketMatch.bracketPosition.matchNumber,
            error: createError.message || "Unknown error"
          });
        }
      }
    }

    // Update tournament status
    if (tournament.bracket.completed) {
      tournament.status = "completed";
    } else if (tournament.status === "draft" || tournament.status === "upcoming") {
      tournament.status = "in_progress";
    }

    // Save tournament
    await tournament.save();

    console.log(`[reprocess-bracket] Reprocessing complete for tournament ${id}`);
    console.log(`[reprocess-bracket] Winners advanced: ${advancedCount}`);
    console.log(`[reprocess-bracket] New matches created: ${newMatchesCreated}`);

    // Populate for response
    const populatedTournament = await Tournament.findById(id)
      .populate("organizer", "username fullName profileImage")
      .populate("participants", "username fullName profileImage");

    return NextResponse.json({
      message: "Bracket reprocessed successfully",
      tournament: populatedTournament,
      stats: {
        completedMatchesFound: completedMatches.length,
        winnersAdvanced: advancedCount,
        newMatchesCreated: newMatchesCreated,
      },
      ...(failedMatches.length > 0 && {
        warning: `${failedMatches.length} match(es) failed to create`,
        failedMatches
      })
    });
  } catch (error: any) {
    console.error("[tournaments/[id]/reprocess-bracket] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to reprocess bracket",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}
