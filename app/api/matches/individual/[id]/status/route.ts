import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { statsService } from "@/services/statsService";
import { calculateStandings, areAllRoundsCompleted } from "@/services/tournamentService";
import {
  advanceWinnerInBracket,
  isTournamentComplete,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";

/**
 * Update tournament standings and status after a match completes
 */
async function updateTournamentAfterMatch(match: any) {
  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    
    return;
  }

  

  if (tournament.format === "round_robin") {
    // Update Round Robin standings
    await updateRoundRobinStandings(tournament);
  } else if (tournament.format === "knockout") {
    // Advance winner in knockout bracket
    await updateKnockoutBracket(tournament, match);
  }
}

/**
 * Update standings for Round Robin tournaments
 */
async function updateRoundRobinStandings(tournament: any) {
 

  const participantIds = tournament.participants.map((p: any) => p.toString());

  // CASE 1: Tournament with Groups
  if (tournament.useGroups && tournament.groups && tournament.groups.length > 0) {
    for (const group of tournament.groups) {
      // Fetch all matches for this group
      const groupMatchIds = group.rounds.flatMap((r: any) => r.matches);
      const matches = await IndividualMatch.find({
        _id: { $in: groupMatchIds },
      }).lean();

      // Calculate standings using ITTF rules
      const standingsData = calculateStandings(
        group.participants.map((p: any) => p.toString()),
        matches as any,
        tournament.rules
      );

      // Update group standings
      group.standings = standingsData.map((s) => ({
        participant: s.participant,
        played: s.played,
        won: s.won,
        lost: s.lost,
        drawn: s.drawn,
        setsWon: s.setsWon,
        setsLost: s.setsLost,
        setsDiff: s.setsDiff,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDiff: s.pointsDiff,
        points: s.points,
        rank: s.rank,
        form: s.form,
      }));

      
    }

    // Generate overall standings from group winners
    const advancePerGroup = tournament.advancePerGroup || 2;
    const qualifiers: any[] = [];

    tournament.groups.forEach((group: any) => {
      const topN = group.standings.slice(0, advancePerGroup);
      qualifiers.push(...topN);
    });

    tournament.standings = qualifiers.map((q: any, idx: number) => ({
      ...q,
      rank: idx + 1,
    }));

  }
  // CASE 2: Single Round Robin (no groups)
  else {
    const roundMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await IndividualMatch.find({
      _id: { $in: roundMatchIds },
    }).lean();

    const standingsData = calculateStandings(
      participantIds,
      matches as any,
      tournament.rules
    );

    tournament.standings = standingsData.map((s) => ({
      participant: s.participant,
      played: s.played,
      won: s.won,
      lost: s.lost,
      drawn: s.drawn,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      setsDiff: s.setsDiff,
      pointsScored: s.pointsScored,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.pointsDiff,
      points: s.points,
      rank: s.rank,
      form: s.form,
      headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
    }));

    
  }

  // Check if all rounds are completed and update tournament status
  const allMatchIds = tournament.useGroups
    ? tournament.groups.flatMap((g: any) => g.rounds.flatMap((r: any) => r.matches))
    : tournament.rounds.flatMap((r: any) => r.matches);

  const matches = await IndividualMatch.find({
    _id: { $in: allMatchIds },
  });

  const allCompleted = matches.every((m: any) => m.status === "completed");
  const anyInProgress = matches.some((m: any) => m.status === "in_progress");

  if (allCompleted && tournament.status !== "completed") {
    tournament.status = "completed";
    
  } else if (anyInProgress && tournament.status === "upcoming") {
    tournament.status = "in_progress";
    
  }

  await tournament.save();
  
}

/**
 * Update knockout bracket and advance winner
 */
async function updateKnockoutBracket(tournament: any, match: any) {
  

  if (!tournament.bracket) {
    
    return;
  }

  // Find winner and loser from match
  const winnerId = match.winnerSide === "side1"
    ? match.participants[0]
    : match.participants[1];
  const loserId = match.winnerSide === "side1"
    ? match.participants[1]
    : match.participants[0];

  // Find the bracket match position for this match
  let bracketPosition: number | null = null;
  let currentRound: any = null;

  for (const round of tournament.bracket.rounds) {
    const bracketMatch = round.matches.find(
      (m: any) => m.matchId?.toString() === match._id.toString()
    );
    if (bracketMatch) {
      bracketPosition = bracketMatch.bracketPosition;
      currentRound = round;
      break;
    }
  }

  if (bracketPosition === null) {
    
    return;
  }

  

  // Update bracket with winner
  const updatedBracket = advanceWinnerInBracket(
    tournament.bracket,
    bracketPosition,
    new mongoose.Types.ObjectId(winnerId),
    new mongoose.Types.ObjectId(loserId)
  );

  tournament.bracket = updatedBracket;

  // Check if tournament is complete
  if (isTournamentComplete(updatedBracket)) {
    tournament.status = "completed";
    
  } else if (tournament.status === "upcoming") {
    tournament.status = "in_progress";
    
  }

  // Create next round matches if current round is complete
  if (currentRound?.completed && currentRound.roundNumber < updatedBracket.rounds.length) {
    const nextRound = updatedBracket.rounds[currentRound.roundNumber];
    

    for (const bracketMatch of nextRound.matches) {
      // Skip if match already exists
      if (bracketMatch.matchId) continue;

      // Check if both participants are determined
      const p1Id = bracketMatch.participant1.participantId;
      const p2Id = bracketMatch.participant2.participantId;

      if (!p1Id || !p2Id) {
        
        continue;
      }

      // Create the match
      const newMatch = await IndividualMatch.create({
        tournament: tournament._id,
        matchCategory: "individual",
        matchType: tournament.matchType,
        numberOfSets: tournament.rules.setsPerMatch,
        participants: [p1Id, p2Id],
        status: "scheduled",
        games: [],
      });

      bracketMatch.matchId = newMatch._id;
      
    }
  }

  await tournament.save();
  
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const { status, winnerSide } = await req.json();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (
      !["scheduled", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden only the assigned scorer can update the score" },
        { status: 403 }
      );
    }

    match.status = status;

    if (
      status === "in_progress" &&
      !match.currentServer &&
      match.serverConfig?.firstServer
    ) {
      match.currentServer = match.serverConfig.firstServer;
    }

    if (status === "completed" && winnerSide) {
      match.winnerSide = winnerSide;
    }

    await match.save();
    await match.populate("participants", "username fullName");

    // Trigger stats update when match completes
    if (status === "completed" && winnerSide) {
      try {
        await statsService.updateIndividualMatchStats(id);
      } catch (statsError) {
        console.error("Error updating stats:", statsError);
        // Don't fail the request if stats update fails
      }

      // Trigger tournament updates when match completes
      if (match.tournament) {
        try {
          await updateTournamentAfterMatch(match);
        } catch (tournamentError) {
          console.error("Error updating tournament:", tournamentError);
          // Don't fail the request if tournament update fails
        }
      }
    }

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json(
      { error: "Failed to update match status" },
      { status: 500 }
    );
  }
}
