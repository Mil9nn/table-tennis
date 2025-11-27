// app/api/tournaments/[id]/advance-winner/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  advanceWinnerInBracket,
  resolveParticipantSlot,
  isTournamentComplete,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";

/**
 * Advance winner to next round in knockout tournament
 * Called after a match is completed
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID required" },
        { status: 400 }
      );
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Allow knockout and round_robin (multi-stage) tournaments with brackets
    if (tournament.format !== "knockout" && !tournament.bracket) {
      return NextResponse.json(
        { error: "This endpoint is only for tournaments with knockout brackets" },
        { status: 400 }
      );
    }

    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found" },
        { status: 404 }
      );
    }

    // Find the completed match
    const match = await IndividualMatch.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    if (match.status !== "completed") {
      return NextResponse.json(
        { error: "Match is not completed yet" },
        { status: 400 }
      );
    }

    if (!match.winner) {
      return NextResponse.json(
        { error: "Match has no winner determined" },
        { status: 400 }
      );
    }

    // Find bracket match position
    let bracketPosition: number | null = null;
    for (const round of tournament.bracket.rounds) {
      for (const bracketMatch of round.matches) {
        if (bracketMatch.matchId?.toString() === matchId) {
          bracketPosition = bracketMatch.bracketPosition;
          break;
        }
      }
      if (bracketPosition !== null) break;
    }

    if (bracketPosition === null) {
      return NextResponse.json(
        { error: "Match not found in bracket" },
        { status: 404 }
      );
    }

    // Determine loser
    const winnerId = new mongoose.Types.ObjectId(match.winner.toString());
    const participants = match.participants.map((p: any) => p.toString());

    // For doubles/mixed doubles, loser is the first player from the losing team
    // For singles, loser is the other participant
    let loserId;
    const isDoubles = match.matchType === "doubles" || match.matchType === "mixed_doubles";

    if (isDoubles && participants.length === 4) {
      // Winner is in either first pair (0,1) or second pair (2,3)
      const winnerIdx = participants.findIndex((p: string) => p === match.winner.toString());
      if (winnerIdx < 2) {
        // Winner is from first team, loser is from second team
        loserId = new mongoose.Types.ObjectId(participants[2]);
      } else {
        // Winner is from second team, loser is from first team
        loserId = new mongoose.Types.ObjectId(participants[0]);
      }
    } else {
      // Singles match
      loserId = new mongoose.Types.ObjectId(
        participants.find((p: string) => p !== match.winner.toString())
      );
    }

    // Update bracket
    const updatedBracket = advanceWinnerInBracket(
      tournament.bracket,
      bracketPosition,
      winnerId,
      loserId
    );

    tournament.bracket = updatedBracket;

    // Check if we need to create next round matches
    const currentRound = updatedBracket.rounds.find((r) =>
      r.matches.some((m) => m.bracketPosition === bracketPosition)
    );

    if (currentRound?.completed && currentRound.roundNumber < updatedBracket.rounds.length) {
      // Current round is complete, create matches for next round
      const nextRound = updatedBracket.rounds[currentRound.roundNumber]; // 0-indexed

      const nextRoundMatches = [];

      for (const bracketMatch of nextRound.matches) {
        // Skip 3rd place match for now - it will be handled separately
        const isThirdPlaceMatch =
          updatedBracket.thirdPlaceMatchPosition !== undefined &&
          bracketMatch.bracketPosition === updatedBracket.thirdPlaceMatchPosition;

        // Resolve participants
        const participant1Id = resolveParticipantSlot(
          bracketMatch.participant1,
          updatedBracket
        );
        const participant2Id = resolveParticipantSlot(
          bracketMatch.participant2,
          updatedBracket
        );

        // Only create match if both participants are determined
        if (participant1Id && participant2Id && !bracketMatch.matchId) {
          // For doubles, resolve teams from bracket team mappings
          let matchParticipants;
          if (isDoubles && tournament.bracket.teamMappings) {
            // Find teams for both participants
            const team1 = tournament.bracket.teamMappings.find((t: any) =>
              t.player1.toString() === participant1Id.toString() ||
              t.player2?.toString() === participant1Id.toString()
            );
            const team2 = tournament.bracket.teamMappings.find((t: any) =>
              t.player1.toString() === participant2Id.toString() ||
              t.player2?.toString() === participant2Id.toString()
            );

            if (team1 && team2) {
              matchParticipants = [team1.player1, team1.player2, team2.player1, team2.player2];
            } else {
              console.error("Could not resolve teams for doubles next round match");
              continue;
            }
          } else {
            matchParticipants = [participant1Id, participant2Id];
          }

          const newMatch = new IndividualMatch({
            matchType: tournament.matchType,
            matchCategory: "individual",
            numberOfSets: tournament.rules.setsPerMatch,
            city: tournament.city,
            venue: tournament.venue || tournament.city,
            participants: matchParticipants,
            scorer: decoded.userId,
            status: "scheduled",
            tournament: tournament._id,
          });

          await newMatch.save();

          // Update bracket match with match ID
          bracketMatch.matchId = newMatch._id;
          nextRoundMatches.push(newMatch._id);

         
        }
      }

      
    }

    // Check if tournament is complete
    if (isTournamentComplete(updatedBracket)) {
      tournament.status = "completed";
      
    } else if (tournament.status === "upcoming") {
      tournament.status = "in_progress";
    }

    await tournament.save();
    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "bracket.rounds.matches.participant1.participantId", select: "username fullName profileImage" },
      { path: "bracket.rounds.matches.participant2.participantId", select: "username fullName profileImage" },
      { path: "bracket.rounds.matches.winner", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Winner advanced successfully",
      tournament,
      bracketPosition,
      nextRoundCreated: currentRound?.completed || false,
    });
  } catch (err: any) {
    console.error("Error advancing winner:", err);
    return NextResponse.json(
      { error: "Failed to advance winner", details: err.message },
      { status: 500 }
    );
  }
}
