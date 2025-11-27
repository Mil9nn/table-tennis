// app/api/tournaments/[id]/create-bracket-match/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { resolveParticipantSlot } from "@/services/tournament/knockoutService";

/**
 * Create a bracket match on-demand for knockout tournaments
 * This handles cases where the match should exist but wasn't created yet
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await req.json();
    const { bracketPosition } = body;

    if (bracketPosition === undefined) {
      return NextResponse.json(
        { error: "Bracket position required" },
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

    // Allow knockout tournaments and multi-stage tournaments with brackets
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

    // Find the bracket match
    let bracketMatch: any = null;
    let roundInfo: any = null;

    for (const round of tournament.bracket.rounds) {
      const match = round.matches.find(
        (m: any) => m.bracketPosition === bracketPosition
      );
      if (match) {
        bracketMatch = match;
        roundInfo = round;
        break;
      }
    }

    if (!bracketMatch) {
      return NextResponse.json(
        { error: "Bracket match not found" },
        { status: 404 }
      );
    }

    // Check if match already exists
    if (bracketMatch.matchId) {
      return NextResponse.json({
        message: "Match already exists",
        matchId: bracketMatch.matchId,
      });
    }

    // Resolve participants
    const participant1Id = resolveParticipantSlot(
      bracketMatch.participant1,
      tournament.bracket
    );
    const participant2Id = resolveParticipantSlot(
      bracketMatch.participant2,
      tournament.bracket
    );

    if (!participant1Id || !participant2Id) {
      return NextResponse.json(
        { error: "Both participants must be determined before creating match" },
        { status: 400 }
      );
    }

    // Handle doubles/mixed doubles
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";

    let matchParticipants;
    if (isDoubles && tournament.bracket.teamMappings) {
      // Find teams for both participants
      const team1 = tournament.bracket.teamMappings.find(
        (t: any) =>
          t.player1.toString() === participant1Id.toString() ||
          t.player2?.toString() === participant1Id.toString()
      );
      const team2 = tournament.bracket.teamMappings.find(
        (t: any) =>
          t.player1.toString() === participant2Id.toString() ||
          t.player2?.toString() === participant2Id.toString()
      );

      if (!team1 || !team2) {
        return NextResponse.json(
          { error: "Could not resolve teams for doubles match" },
          { status: 400 }
        );
      }

      matchParticipants = [
        team1.player1,
        team1.player2,
        team2.player1,
        team2.player2,
      ];
    } else {
      matchParticipants = [participant1Id, participant2Id];
    }

    // Create the match
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

    // Add to tournament rounds if not already there
    const existingRound = tournament.rounds.find(
      (r: any) => r.roundNumber === roundInfo.roundNumber
    );

    if (existingRound) {
      // Check if match already in round
      if (!existingRound.matches.some((m: any) => m.toString() === newMatch._id.toString())) {
        existingRound.matches.push(newMatch._id);
      }
    } else {
      tournament.rounds.push({
        roundNumber: roundInfo.roundNumber,
        matches: [newMatch._id],
        completed: false,
        scheduledDate: new Date(),
      });
    }

    await tournament.save();

    

    return NextResponse.json({
      message: "Match created successfully",
      matchId: newMatch._id,
    });
  } catch (err: any) {
    console.error("Error creating bracket match:", err);
    return NextResponse.json(
      { error: "Failed to create match", details: err.message },
      { status: 500 }
    );
  }
}
