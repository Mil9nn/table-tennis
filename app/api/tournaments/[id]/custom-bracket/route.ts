import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";
import { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { scheduleRound } from "@/services/tournament/core/bracketSchedulingService";
import { createBracketMatch, createBracketTeamMatch } from "@/services/tournament/core/matchGenerationService";

// CRITICAL: Import models in correct order to ensure discriminators are registered
// 1. Import base Match model first
import Match from "@/models/MatchBase";
// 2. Import discriminators (this registers them on Match)
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
// 3. Import other models
import Tournament from "@/models/Tournament";
import BracketState from "@/models/BracketState";

/**
 * Get all participants who have been eliminated (lost their matches)
 * @param bracket - The knockout bracket
 * @param upToRound - Check eliminations up to (but not including) this round
 * @returns Set of eliminated participant IDs
 */
function getEliminatedParticipants(
  bracket: KnockoutBracket,
  upToRound: number
): Set<string> {
  const eliminated = new Set<string>();

  // Check all rounds before the target round
  for (const round of bracket.rounds) {
    if (round.roundNumber >= upToRound) break;

    for (const match of round.matches) {
      if (match.completed && match.winner) {
        // Find the loser
        const loser =
          match.participant1 === match.winner
            ? match.participant2
            : match.participant1;

        if (loser) {
          eliminated.add(loser.toString());
        }
      }
    }
  }

  return eliminated;
}

/**
 * Get all participants who are eligible for a specific round
 * @param bracket - The knockout bracket
 * @param roundNumber - The target round number
 * @param tournamentParticipantIds - All tournament participants
 * @returns Set of eligible participant IDs
 */
function getEligibleParticipants(
  bracket: KnockoutBracket,
  roundNumber: number,
  tournamentParticipantIds: string[]
): Set<string> {
  // For round 1, all tournament participants are eligible
  if (roundNumber === 1) {
    return new Set(tournamentParticipantIds);
  }

  // For subsequent rounds, only participants who:
  // 1. Haven't lost yet (not eliminated)
  // 2. Either won their previous match OR haven't played yet (for custom matching scenarios)
  const eliminated = getEliminatedParticipants(bracket, roundNumber);
  const eligible = new Set<string>();

  for (const participantId of tournamentParticipantIds) {
    if (!eliminated.has(participantId)) {
      eligible.add(participantId);
    }
  }

  return eligible;
}

/**
 * Create custom bracket matchups for a specific round
 * POST /api/tournaments/[id]/custom-bracket
 *
 * Request body:
 * - roundNumber: number - The round number to customize
 * - matches: Array<{ matchNumber: number, participant1: string, participant2: string }>
 *
 * This endpoint:
 * 1. Verifies the user is the tournament organizer
 * 2. Loads the tournament and verifies it's a knockout format with allowCustomMatching enabled
 * 3. Validates that the round exists and is not yet completed
 * 4. Updates the bracket matches with custom participant pairings
 * 5. Creates IndividualMatch documents for the custom matches
 * 6. Updates the tournament bracket in the database
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(
    req,
    "POST",
    `/api/tournaments/${id}/custom-bracket`
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    // Ensure models are registered (explicitly reference to ensure they're loaded)
    // Import base Match model to ensure discriminator models are registered
    const MatchModel = Match;
    const TournamentModel = Tournament;
    const BracketStateModel = BracketState;

    // Force model registration by accessing the model
    // This ensures discriminators are registered in Next.js hot reload scenarios
    if (
      !MatchModel ||
      !IndividualMatch ||
      !TournamentModel ||
      !BracketStateModel
    ) {
      throw new Error("Required models not loaded");
    }

    // Explicitly ensure IndividualMatch discriminator is registered
    // Access the model to trigger registration if needed
    if (!Match.discriminators || !Match.discriminators["individual"]) {
      // Force re-import to ensure registration
      const IndividualMatchModule = await import("@/models/IndividualMatch");
      const _ = IndividualMatchModule.default;
      // Verify it's now registered
      if (!Match.discriminators || !Match.discriminators["individual"]) {
        console.error(
          "[Custom Bracket] IndividualMatch discriminator still not registered after import"
        );
        // Try accessing through mongoose.models as fallback
        if (!mongoose.models["Match"]?.discriminators?.["individual"]) {
          throw new Error(
            "IndividualMatch discriminator not registered. Please restart the server."
          );
        }
      }
    }

    // Get the IndividualMatch model (discriminator or direct import)
    const IndividualMatchModel =
      Match.discriminators?.["individual"] || IndividualMatch;
    if (!IndividualMatchModel) {
      throw new Error("IndividualMatch model not accessible");
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
    const { roundNumber, matches, doublesPairs } = body;

    // Validate request body
    if (roundNumber === undefined || !matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: "roundNumber and matches array are required" },
        { status: 400 }
      );
    }

    // Validate matches array structure
    for (const match of matches) {
      if (
        match.matchNumber === undefined ||
        !match.participant1 ||
        !match.participant2
      ) {
        return NextResponse.json(
          {
            error:
              "Each match must have matchNumber, participant1, and participant2",
          },
          { status: 400 }
        );
      }
    }

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
        { error: "Only the tournament organizer can customize brackets" },
        { status: 403 }
      );
    }

    // Verify tournament has a knockout bracket (either pure knockout or hybrid in knockout phase)
    const hasKnockoutBracket = 
      tournament.bracket && 
      (tournament.format === "knockout" || 
       (tournament.format === "hybrid" && tournament.currentPhase === "knockout"));
    
    if (!hasKnockoutBracket) {
      return NextResponse.json(
        { error: "This endpoint requires a tournament with an active knockout bracket" },
        { status: 400 }
      );
    }

    // Verify allowCustomMatching is enabled
    if (!tournament.knockoutConfig?.allowCustomMatching) {
      return NextResponse.json(
        { error: "Custom matching is not enabled for this tournament" },
        { status: 400 }
      );
    }

    // Load bracket from BracketState if not in tournament document
    if (!tournament.bracket) {
      const BracketState = (await import("@/models/BracketState")).default;
      const bracketState = await BracketState.findOne({ tournament: id });
      if (bracketState) {
        // Convert BracketState document to bracket object
        (tournament as any).bracket = {
          size: bracketState.size,
          rounds: bracketState.rounds,
          currentRound: bracketState.currentRound,
          completed: bracketState.completed,
          thirdPlaceMatch: bracketState.thirdPlaceMatch,
        };
      }
    }

    // Load bracket from BracketState if not in tournament document
    if (!tournament.bracket) {
      const bracketState = await BracketState.findOne({ tournament: id });
      if (bracketState) {
        // Convert BracketState document to bracket object
        (tournament as any).bracket = {
          size: bracketState.size,
          rounds: bracketState.rounds,
          currentRound: bracketState.currentRound,
          completed: bracketState.completed,
          thirdPlaceMatch: bracketState.thirdPlaceMatch,
        };
      }
    }

    // Verify bracket exists
    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found. Generate bracket first." },
        { status: 404 }
      );
    }

    const bracket: KnockoutBracket = tournament.bracket;

    // Find the round
    const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) {
      return NextResponse.json(
        { error: `Round ${roundNumber} not found in bracket` },
        { status: 404 }
      );
    }

    // Verify round is not completed
    if (round.completed) {
      return NextResponse.json(
        { error: "Cannot customize a completed round" },
        { status: 400 }
      );
    }

    // Check if this is a doubles tournament
    const matchType = tournament.matchType;
    const isDoubles = matchType === "doubles" || matchType === "mixed_doubles";

    // Create a mapping from temporary pair IDs to their ObjectId counterparts
    // This is needed because the frontend sends temporary 'pair-id-id' IDs that will be converted to ObjectIds
    const tempPairIdMap = new Map<string, string>();

    // For doubles Round 1, save pairs to tournament if provided
    if (isDoubles && roundNumber === 1 && doublesPairs && Array.isArray(doublesPairs)) {
      // Validate pairs structure
      for (const pair of doublesPairs) {
        if (!pair._id || !pair.player1 || !pair.player2) {
          return NextResponse.json(
            { error: "Each pair must have _id, player1, and player2" },
            { status: 400 }
          );
        }
      }

      // Save pairs to tournament
      // For new pairs (with temporary 'pair-' prefix), generate actual ObjectIds
      // For existing pairs (already have ObjectId), keep their IDs
      tournament.doublesPairs = doublesPairs.map((p: any) => {
        const tempId = p._id.toString();
        const pairId = tempId.startsWith('pair-')
          ? new mongoose.Types.ObjectId() // Generate new ObjectId for temp IDs
          : new mongoose.Types.ObjectId(p._id); // Use existing ObjectId
        
        // Map temp ID to actual ObjectId for validation
        tempPairIdMap.set(tempId, pairId.toString());
        
        return {
          _id: pairId,
          player1: new mongoose.Types.ObjectId(p.player1),
          player2: new mongoose.Types.ObjectId(p.player2),
        };
      });
      tournament.markModified('doublesPairs');
    }

    // Get the set of valid entry IDs for validation
    // For singles: player IDs
    // For doubles: pair IDs (from tournament.doublesPairs or temp IDs mapping)
    let validEntryIds: Set<string>;
    
    if (isDoubles) {
      // For doubles, use pair IDs
      // Include both the stored pair IDs and the temporary IDs mapping
      const pairIds = (tournament.doublesPairs || []).map((p: any) => p._id.toString());
      validEntryIds = new Set(pairIds);
      
      // Also include the temporary IDs that will be converted to the above
      tempPairIdMap.forEach((actualId, tempId) => {
        validEntryIds.add(tempId); // Allow matching by temp ID
      });
    } else {
      // For singles, use tournament participant IDs
      // For hybrid tournaments in knockout phase, use qualified participants only
      let participantIds: string[];
      if (tournament.format === "hybrid" && tournament.currentPhase === "knockout" && tournament.qualifiedParticipants) {
        participantIds = tournament.qualifiedParticipants.map((p: any) => p.toString());
      } else {
        participantIds = tournament.participants.map((p: any) => p.toString());
      }
      validEntryIds = new Set(participantIds);
    }

    // For hybrid tournaments in knockout phase, validate participants are qualified
    if (tournament.format === "hybrid" && tournament.currentPhase === "knockout" && tournament.qualifiedParticipants) {
      const qualifiedIds = new Set(tournament.qualifiedParticipants.map((p: any) => p.toString()));
      
      for (const match of matches) {
        if (!isDoubles) {
          // For singles, check if participant is qualified
          if (match.participant1 && !qualifiedIds.has(match.participant1)) {
            return NextResponse.json(
              {
                error: `Participant ${match.participant1} is not qualified for knockout phase. Only participants who advanced from round-robin can participate.`,
              },
              { status: 400 }
            );
          }
          if (match.participant2 && !qualifiedIds.has(match.participant2)) {
            return NextResponse.json(
              {
                error: `Participant ${match.participant2} is not qualified for knockout phase. Only participants who advanced from round-robin can participate.`,
              },
              { status: 400 }
            );
          }
        }
        // For doubles, we validate pairs are created from qualified participants
        // This is handled by the pair creation step
      }
    }

    // Validate match entries exist
    for (const match of matches) {
      if (!validEntryIds.has(match.participant1)) {
        return NextResponse.json(
          {
            error: isDoubles
              ? `Pair ${match.participant1} not found. Please create pairs first.`
              : `Participant ${match.participant1} not found in tournament`,
          },
          { status: 400 }
        );
      }
      if (!validEntryIds.has(match.participant2)) {
        return NextResponse.json(
          {
            error: isDoubles
              ? `Pair ${match.participant2} not found. Please create pairs first.`
              : `Participant ${match.participant2} not found in tournament`,
          },
          { status: 400 }
        );
      }
    }
    
    // Keep tournamentParticipantIds for eligibility checks (backward compat)
    const tournamentParticipantIds = tournament.participants.map((p: any) =>
      p.toString()
    );

    // Verify no duplicate participants within the same round
    const participantsInRound = new Set<string>();
    for (const match of matches) {
      if (participantsInRound.has(match.participant1)) {
        return NextResponse.json(
          {
            error: `Participant ${match.participant1} appears in multiple matches in round ${roundNumber}`,
          },
          { status: 400 }
        );
      }
      if (participantsInRound.has(match.participant2)) {
        return NextResponse.json(
          {
            error: `Participant ${match.participant2} appears in multiple matches in round ${roundNumber}`,
          },
          { status: 400 }
        );
      }
      participantsInRound.add(match.participant1);
      participantsInRound.add(match.participant2);
    }

    // Verify entries are eligible (haven't been eliminated)
    // For doubles, use pair IDs; for singles, use player IDs
    const eligibleEntryIds = isDoubles
      ? getEligibleParticipants(
          bracket,
          roundNumber,
          Array.from(validEntryIds) // Use pair IDs for doubles
        )
      : getEligibleParticipants(
          bracket,
          roundNumber,
          tournamentParticipantIds
        );

    for (const match of matches) {
      if (!eligibleEntryIds.has(match.participant1)) {
        return NextResponse.json(
          {
            error: isDoubles
              ? `Pair is not eligible for round ${roundNumber} (may have been eliminated)`
              : `Participant ${match.participant1} is not eligible for round ${roundNumber} (may have been eliminated in a previous round)`,
          },
          { status: 400 }
        );
      }
      if (!eligibleEntryIds.has(match.participant2)) {
        return NextResponse.json(
          {
            error: isDoubles
              ? `Pair is not eligible for round ${roundNumber} (may have been eliminated)`
              : `Participant ${match.participant2} is not eligible for round ${roundNumber} (may have been eliminated in a previous round)`,
          },
          { status: 400 }
        );
      }
    }

    // Verify match numbers are valid
    for (const match of matches) {
      const bracketMatch = round.matches.find(
        (m) => m.bracketPosition.matchNumber === match.matchNumber
      );
      if (!bracketMatch) {
        return NextResponse.json(
          {
            error: `Match number ${match.matchNumber} not found in round ${roundNumber}`,
          },
          { status: 400 }
        );
      }
    }

    // Check for existing matches that are already in progress or completed
    const existingMatchIds = round.matches
      .map((m) => m.matchId)
      .filter((id) => id);

    if (existingMatchIds.length > 0) {
      const existingMatches = await (IndividualMatchModel as any).find({
        _id: { $in: existingMatchIds },
      });

      const hasStartedMatches = existingMatches.some(
        (m: any) => m.status === "in_progress" || m.status === "completed"
      );

      if (hasStartedMatches) {
        return NextResponse.json(
          {
            error:
              "Cannot customize matches that have already started or completed",
          },
          { status: 400 }
        );
      }

      // Delete the old matches if they exist
      await (IndividualMatchModel as any).deleteMany({
        _id: { $in: existingMatchIds },
      });
    }

    // Update bracket matches with custom pairings
    for (const customMatch of matches) {
      const bracketMatch = round.matches.find(
        (m) => m.bracketPosition.matchNumber === customMatch.matchNumber
      );

      if (!bracketMatch) continue;

      // Update bracket match participants
      // If using temp pair IDs for doubles, convert to actual ObjectIds
      let participant1 = customMatch.participant1;
      let participant2 = customMatch.participant2;
      
      if (isDoubles && tempPairIdMap.size > 0) {
        if (tempPairIdMap.has(customMatch.participant1)) {
          participant1 = tempPairIdMap.get(customMatch.participant1)!;
        }
        if (tempPairIdMap.has(customMatch.participant2)) {
          participant2 = tempPairIdMap.get(customMatch.participant2)!;
        }
      }
      
      bracketMatch.participant1 = participant1;
      bracketMatch.participant2 = participant2;
      bracketMatch.completed = false;
      bracketMatch.winner = undefined;
    }

    // Schedule the round to assign courts and times
    const courtsAvailable = 1; // Default, should ideally come from tournament config
    const matchDuration = 60; // Default 60 minutes, should ideally come from tournament config

    const scheduledRound = scheduleRound(
      round,
      tournament.startDate,
      courtsAvailable,
      matchDuration
    );

    // Update round scheduled date and match schedules from the scheduling result
    round.scheduledDate = scheduledRound.scheduledDate;
    for (let i = 0; i < round.matches.length; i++) {
      if (scheduledRound.matches[i].scheduledDate) {
        round.matches[i].scheduledDate =
          scheduledRound.matches[i].scheduledDate;
      }
      if (scheduledRound.matches[i].courtNumber) {
        round.matches[i].courtNumber = scheduledRound.matches[i].courtNumber;
      }
    }

    // Create match documents with scheduling info
    const createdMatches: any[] = [];
    const isTeamCategory = tournament.category === "team";

    for (const customMatch of matches) {
      const bracketMatch = round.matches.find(
        (m) => m.bracketPosition.matchNumber === customMatch.matchNumber
      );

      if (!bracketMatch) continue;

      // Use the appropriate helper function to create the match
      // This ensures doubles matches get 4 participants, team matches are handled correctly, etc.
      const newMatch = isTeamCategory
        ? await createBracketTeamMatch(bracketMatch, tournament, decoded.userId)
        : await createBracketMatch(bracketMatch, tournament, decoded.userId);

      if (newMatch) {
        createdMatches.push(newMatch);
        // Update bracket with matchId
        bracketMatch.matchId = (newMatch._id as any).toString();
      }
    }

    // SPECIAL HANDLING FOR ROUND 1: Auto-advance bye recipients
    // When Round 1 is configured in custom matching, identify entries who didn't play
    // and automatically advance them to Round 2 as bye winners
    if (roundNumber === 1) {
      // Get all entry IDs (for doubles: pair IDs, for singles: player IDs)
      let allEntryIds: string[];
      if (isDoubles) {
        allEntryIds = (tournament.doublesPairs || []).map((p: any) => p._id.toString());
      } else {
        allEntryIds = tournament.participants.map((p: any) => p.toString());
      }

      // Get entries used in Round 1 matches
      const usedInRound1 = new Set<string>();
      matches.forEach((match) => {
        usedInRound1.add(match.participant1);
        usedInRound1.add(match.participant2);
      });

      // Calculate bye recipients (entries NOT in Round 1)
      const byeWinners = allEntryIds.filter(
        (p: any) => !usedInRound1.has(p)
      );

      // Find Round 2 to populate with bye winners
      const round2 = bracket.rounds.find((r) => r.roundNumber === 2);

      if (round2 && byeWinners.length > 0) {
        let byeIndex = 0;

        // Populate Round 2 matches with bye winners
        // Strategy: Fill matches systematically
        // - Matches that receive R1 winners get one bye winner in the other slot
        // - Matches that don't receive R1 winners get two bye winners
        for (const r2match of round2.matches) {
          // Check if this R2 match receives a winner from R1
          const receivesFromR1 = round.matches.some(
            (r1m) =>
              r1m.bracketPosition.nextMatchNumber ===
              r2match.bracketPosition.matchNumber
          );

          if (receivesFromR1) {
            // One slot is for R1 winner (leave as null), other slot for bye winner
            // Determine which slot based on odd/even match number pattern
            const r1MatchNumber = round.matches.find(
              (r1m) =>
                r1m.bracketPosition.nextMatchNumber ===
                r2match.bracketPosition.matchNumber
            )?.bracketPosition.matchNumber;

            if (r1MatchNumber !== undefined) {
              if (r1MatchNumber % 2 === 1) {
                // Odd R1 match goes to participant1 slot, bye goes to participant2
                if (byeIndex < byeWinners.length) {
                  r2match.participant2 = byeWinners[byeIndex];
                  byeIndex++;
                }
              } else {
                // Even R1 match goes to participant2 slot, bye goes to participant1
                if (byeIndex < byeWinners.length) {
                  r2match.participant1 = byeWinners[byeIndex];
                  byeIndex++;
                }
              }
            }
          } else {
            // Both slots for bye winners
            if (byeIndex < byeWinners.length) {
              r2match.participant1 = byeWinners[byeIndex];
              byeIndex++;
            }
            if (byeIndex < byeWinners.length) {
              r2match.participant2 = byeWinners[byeIndex];
              byeIndex++;
            }
          }
        }
      }
    }

    // After advancing bye winners, create match documents for any newly-ready matches
    // (matches that now have both participants known)
    const newlyReadyMatches: any[] = [];

    for (const round of bracket.rounds) {
      for (const bracketMatch of round.matches) {
        // Skip if match already has a document
        if (bracketMatch.matchId) continue;

        // Check if both participants are now known
        if (
          bracketMatch.participant1 &&
          bracketMatch.participant2 &&
          !bracketMatch.completed
        ) {
          newlyReadyMatches.push(bracketMatch);
        }
      }
    }

    if (newlyReadyMatches.length > 0) {
      const isTeamCategory = tournament.category === "team";

      for (const bracketMatch of newlyReadyMatches) {
        try {
          // Use the appropriate helper function to create the match
          // This ensures doubles matches get 4 participants, team matches are handled correctly, etc.
          const match = isTeamCategory
            ? await createBracketTeamMatch(bracketMatch, tournament, decoded.userId)
            : await createBracketMatch(bracketMatch, tournament, decoded.userId);

          if (match) {
            bracketMatch.matchId = (match._id as any).toString();
          }
        } catch (err) {
          console.error(`[Custom Bracket] Error creating match document:`, err);
          // Continue with other matches
        }
      }
    }

    // Save updated bracket with new matchIds
    tournament.bracket = bracket;
    tournament.markModified("bracket"); // CRITICAL: bracket is Schema.Types.Mixed

    // Also update BracketState model for consistency
    try {
      const BracketState = (await import("@/models/BracketState")).default;
      const existingBracketState = await BracketState.findOne({
        tournament: id,
      });

      if (existingBracketState) {
        existingBracketState.rounds = bracket.rounds;
        existingBracketState.thirdPlaceMatch = bracket.thirdPlaceMatch;
        existingBracketState.currentRound = bracket.currentRound;
        existingBracketState.completed = bracket.completed;
        await existingBracketState.save();
      }
    } catch (bracketStateErr) {
      console.error(
        `[Custom Bracket] Warning: Failed to update BracketState:`,
        bracketStateErr
      );
      // Continue - not critical since Tournament.bracket is the source of truth for now
    }

    // Update tournament bracket field
    (tournament as any).bracket = bracket;
    (tournament as any).markModified("bracket");

    // Update tournament status if needed
    if (tournament.status === "draft" || tournament.status === "upcoming") {
      tournament.status = "in_progress";
    }

    await tournament.save();

    // Populate for response
    const populatedTournament = await Tournament.findById(id)
      .populate("organizer", "username fullName profileImage")
      .populate("participants", "username fullName profileImage")
      .populate({
        path: "rounds.matches",
        model: Match,
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      });

    // Populate created matches
    const populatedMatches = await (IndividualMatchModel as any).find({
      _id: { $in: createdMatches.map((m) => m._id) },
    }).populate("participants", "username fullName profileImage");

    return NextResponse.json({
      message: "Custom bracket created successfully",
      tournament: populatedTournament,
      bracket: bracket,
      matches: populatedMatches,
    });
  } catch (error: any) {
    console.error("[tournaments/[id]/custom-bracket] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create custom bracket",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: 500 }
    );
  }
}
