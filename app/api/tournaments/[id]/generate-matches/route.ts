// app/api/tournaments/[id]/generate-matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

// Round Robin match generation algorithm
function generateRoundRobinSchedule(participants: string[]): string[][][] {
  const n = participants.length;
  if (n < 2) return [];

  // If odd number, add a "bye"
  const hasBye = n % 2 === 1;
  const players = hasBye ? [...participants, "BYE"] : [...participants];
  const totalPlayers = players.length;
  const rounds: string[][][] = [];

  for (let round = 0; round < totalPlayers - 1; round++) {
    const roundMatches: string[][] = [];
    
    for (let match = 0; match < totalPlayers / 2; match++) {
      const home = (round + match) % (totalPlayers - 1);
      const away = (totalPlayers - 1 - match + round) % (totalPlayers - 1);
      
      const homePlayer = match === 0 ? players[totalPlayers - 1] : players[home];
      const awayPlayer = players[away];
      
      // Skip bye matches
      if (homePlayer !== "BYE" && awayPlayer !== "BYE") {
        roundMatches.push([homePlayer, awayPlayer]);
      }
    }
    
    if (roundMatches.length > 0) {
      rounds.push(roundMatches);
    }
  }

  return rounds;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

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

    // Only organizer can generate matches
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (tournament.participants.length < 2) {
      return NextResponse.json(
        { error: "At least 2 participants required" },
        { status: 400 }
      );
    }

    // Generate round robin schedule
    const participantIds = tournament.participants.map((p: any) => p.toString());
    const schedule = generateRoundRobinSchedule(participantIds);

    // Create matches for each round
    const rounds = [];
    
    for (let i = 0; i < schedule.length; i++) {
      const roundMatches = [];
      
      for (const [p1, p2] of schedule[i]) {
        const match = new IndividualMatch({
          matchType: tournament.matchType,
          matchCategory: "individual",
          numberOfSets: tournament.rules.setsPerMatch,
          city: tournament.city,
          venue: tournament.venue || tournament.city,
          participants: [p1, p2],
          scorer: decoded.userId,
          status: "scheduled",
        });
        
        await match.save();
        roundMatches.push(match._id);
      }
      
      rounds.push({
        roundNumber: i + 1,
        matches: roundMatches,
        completed: false,
      });
    }

    // Initialize standings
    const standings = participantIds.map((pId: string) => ({
      participant: pId,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
      rank: 0,
    }));

    tournament.rounds = rounds;
    tournament.standings = standings;
    tournament.status = "upcoming";
    
    await tournament.save();
    await tournament.populate([
      { path: "organizer participants", select: "username fullName profileImage" },
      { path: "rounds.matches", populate: { path: "participants", select: "username fullName" } },
    ]);

    return NextResponse.json({
      message: "Matches generated successfully",
      tournament,
    });
  } catch (err: any) {
    console.error("Error generating matches:", err);
    return NextResponse.json(
      { error: "Failed to generate matches" },
      { status: 500 }
    );
  }
}