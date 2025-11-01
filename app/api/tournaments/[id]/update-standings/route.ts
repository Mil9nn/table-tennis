// app/api/tournaments/[id]/update-standings/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Fetch all matches
    const allMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await IndividualMatch.find({ _id: { $in: allMatchIds } });

    // Calculate standings
    const standingsMap = new Map();
    
    tournament.participants.forEach((pId: any) => {
      standingsMap.set(pId.toString(), {
        participant: pId,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        rank: 0,
      });
    });

    matches.forEach((match: any) => {
      if (match.status !== "completed" || !match.winnerSide) return;

      const p1Id = match.participants[0]._id.toString();
      const p2Id = match.participants[1]._id.toString();
      
      const p1Stats = standingsMap.get(p1Id);
      const p2Stats = standingsMap.get(p2Id);

      if (!p1Stats || !p2Stats) return;

      p1Stats.played += 1;
      p2Stats.played += 1;

      p1Stats.setsWon += match.finalScore.side1Sets;
      p1Stats.setsLost += match.finalScore.side2Sets;
      p2Stats.setsWon += match.finalScore.side2Sets;
      p2Stats.setsLost += match.finalScore.side1Sets;

      if (match.winnerSide === "side1") {
        p1Stats.won += 1;
        p2Stats.lost += 1;
        p1Stats.points += tournament.rules.pointsForWin;
        p2Stats.points += tournament.rules.pointsForLoss;
      } else {
        p2Stats.won += 1;
        p1Stats.lost += 1;
        p2Stats.points += tournament.rules.pointsForWin;
        p1Stats.points += tournament.rules.pointsForLoss;
      }
    });

    // Sort by points, then by set difference
    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      
      const aDiff = a.setsWon - a.setsLost;
      const bDiff = b.setsWon - b.setsLost;
      if (bDiff !== aDiff) return bDiff - aDiff;
      
      return b.setsWon - a.setsWon;
    });

    // Assign ranks
    standings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    tournament.standings = standings;
    
    // Check if all rounds completed
    const allRoundsCompleted = tournament.rounds.every((r: any) => {
      const roundMatches = matches.filter((m: any) => 
        r.matches.some((mid: any) => mid.toString() === m._id.toString())
      );
      return roundMatches.every((m: any) => m.status === "completed");
    });

    if (allRoundsCompleted) {
      tournament.status = "completed";
    }

    await tournament.save();
    await tournament.populate("standings.participant", "username fullName profileImage");

    return NextResponse.json({
      message: "Standings updated successfully",
      standings: tournament.standings,
    });
  } catch (err: any) {
    console.error("Error updating standings:", err);
    return NextResponse.json(
      { error: "Failed to update standings" },
      { status: 500 }
    );
  }
}