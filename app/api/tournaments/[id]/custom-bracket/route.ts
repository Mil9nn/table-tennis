import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { scheduleRound } from "@/services/tournament/core/bracketSchedulingService";

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
  const rateLimitResponse = await rateLimit(req, "POST", `/api/tournaments/${id}/custom-bracket`);
  if (rateLimitResponse) return rateLimitResponse;

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
    const { roundNumber, matches } = body;

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
            error: "Each match must have matchNumber, participant1, and participant2"
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

    // Verify tournament format is knockout
    if (tournament.format !== "knockout") {
      return NextResponse.json(
        { error: "This endpoint is only for knockout tournaments" },
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

    // Verify all participants are in the tournament
    const tournamentParticipantIds = tournament.participants.map((p: any) =>
      p.toString()
    );

    for (const match of matches) {
      if (!tournamentParticipantIds.includes(match.participant1)) {
        return NextResponse.json(
          { error: `Participant ${match.participant1} not found in tournament` },
          { status: 400 }
        );
      }
      if (!tournamentParticipantIds.includes(match.participant2)) {
        return NextResponse.json(
          { error: `Participant ${match.participant2} not found in tournament` },
          { status: 400 }
        );
      }
    }

    // Verify no duplicate participants within the same round
    const participantsInRound = new Set<string>();
    for (const match of matches) {
      if (participantsInRound.has(match.participant1)) {
        return NextResponse.json(
          { error: `Participant ${match.participant1} appears in multiple matches in round ${roundNumber}` },
          { status: 400 }
        );
      }
      if (participantsInRound.has(match.participant2)) {
        return NextResponse.json(
          { error: `Participant ${match.participant2} appears in multiple matches in round ${roundNumber}` },
          { status: 400 }
        );
      }
      participantsInRound.add(match.participant1);
      participantsInRound.add(match.participant2);
    }

    // Verify participants are eligible (haven't been eliminated)
    const eligibleParticipants = getEligibleParticipants(
      bracket,
      roundNumber,
      tournamentParticipantIds
    );

    for (const match of matches) {
      if (!eligibleParticipants.has(match.participant1)) {
        return NextResponse.json(
          {
            error: `Participant ${match.participant1} is not eligible for round ${roundNumber} (may have been eliminated in a previous round)`
          },
          { status: 400 }
        );
      }
      if (!eligibleParticipants.has(match.participant2)) {
        return NextResponse.json(
          {
            error: `Participant ${match.participant2} is not eligible for round ${roundNumber} (may have been eliminated in a previous round)`
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
          { error: `Match number ${match.matchNumber} not found in round ${roundNumber}` },
          { status: 400 }
        );
      }
    }

    // Check for existing matches that are already in progress or completed
    const existingMatchIds = round.matches
      .map((m) => m.matchId)
      .filter((id) => id);

    if (existingMatchIds.length > 0) {
      const existingMatches = await IndividualMatch.find({
        _id: { $in: existingMatchIds },
      });

      const hasStartedMatches = existingMatches.some(
        (m: any) => m.status === "in_progress" || m.status === "completed"
      );

      if (hasStartedMatches) {
        return NextResponse.json(
          {
            error: "Cannot customize matches that have already started or completed"
          },
          { status: 400 }
        );
      }

      // Delete the old matches if they exist
      await IndividualMatch.deleteMany({
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
      bracketMatch.participant1 = customMatch.participant1;
      bracketMatch.participant2 = customMatch.participant2;
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
        round.matches[i].scheduledDate = scheduledRound.matches[i].scheduledDate;
      }
      if (scheduledRound.matches[i].courtNumber) {
        round.matches[i].courtNumber = scheduledRound.matches[i].courtNumber;
      }
    }

    // Create IndividualMatch documents with scheduling info
    const createdMatches: any[] = [];

    for (const customMatch of matches) {
      const bracketMatch = round.matches.find(
        (m) => m.bracketPosition.matchNumber === customMatch.matchNumber
      );

      if (!bracketMatch) continue;

      // Create IndividualMatch document
      const newMatch = new IndividualMatch({
        tournament: id,
        matchCategory: "individual",
        matchType: tournament.matchType,
        numberOfSets: tournament.rules.setsPerMatch || 3,
        participants: [customMatch.participant1, customMatch.participant2],
        scorer: decoded.userId, // Set organizer as scorer
        status: "scheduled",
        bracketPosition: {
          round: roundNumber,
          matchNumber: customMatch.matchNumber,
          nextMatchNumber: bracketMatch.bracketPosition.nextMatchNumber,
        },
        sourceMatches: bracketMatch.sourceMatches, // Preserve source match info
        roundName: round.roundName,
        city: tournament.city,
        venue: tournament.venue,
        courtNumber: bracketMatch.courtNumber, // Add court assignment
        scheduledDate: bracketMatch.scheduledDate, // Add scheduled date
      });

      await newMatch.save();
      createdMatches.push(newMatch);

      // Update bracket with matchId
      bracketMatch.matchId = newMatch._id.toString();
    }

    // SPECIAL HANDLING FOR ROUND 1: Auto-advance bye recipients
    // When Round 1 is configured in custom matching, identify participants who didn't play
    // and automatically advance them to Round 2 as bye winners
    if (roundNumber === 1) {
      console.log("[Custom Matching R1] Handling bye advancement...");

      // Get all tournament participants
      const allParticipantIds = tournament.participants.map((p: any) => p.toString());

      // Get participants used in Round 1 matches
      const usedInRound1 = new Set<string>();
      matches.forEach((match) => {
        usedInRound1.add(match.participant1);
        usedInRound1.add(match.participant2);
      });

      // Calculate bye recipients (participants NOT in Round 1)
      const byeWinners = allParticipantIds.filter((p: any) => !usedInRound1.has(p));

      console.log(`[Custom Matching R1] Total participants: ${allParticipantIds.length}, Used in R1: ${usedInRound1.size}, Bye winners: ${byeWinners.length}`);

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
            (r1m) => r1m.bracketPosition.nextMatchNumber === r2match.bracketPosition.matchNumber
          );

          if (receivesFromR1) {
            // One slot is for R1 winner (leave as null), other slot for bye winner
            // Determine which slot based on odd/even match number pattern
            const r1MatchNumber = round.matches.find(
              (r1m) => r1m.bracketPosition.nextMatchNumber === r2match.bracketPosition.matchNumber
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

        console.log(`[Custom Matching R1] Advanced ${byeIndex} bye winners to Round 2`);
      }
    }

    // Save updated bracket
    tournament.bracket = bracket;
    tournament.markModified('bracket'); // CRITICAL: bracket is Schema.Types.Mixed

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
        model: "IndividualMatch",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      });

    // Populate created matches
    const populatedMatches = await IndividualMatch.find({
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
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}
