// app/api/tournaments/[id]/generate-knockout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  generateKnockoutBracket,
  processByes,
  resolveParticipantSlot,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";

/**
 * Generate knockout stage for multi-stage tournaments
 * Called after all round robin matches are completed
 */
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

    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate tournament is multi-stage
    if (!tournament.isMultiStage && tournament.format !== "multi_stage" && tournament.format !== "round_robin") {
      return NextResponse.json(
        { error: "This endpoint is only for round robin tournaments" },
        { status: 400 }
      );
    }

    // Check if knockout is already generated
    if (tournament.bracket && tournament.bracket.rounds?.length > 0) {
      return NextResponse.json(
        { error: "Knockout bracket already generated" },
        { status: 400 }
      );
    }

    // Check if all round robin matches are completed
    const allRoundRobinComplete = await checkRoundRobinComplete(tournament);
    if (!allRoundRobinComplete) {
      return NextResponse.json(
        { error: "All round robin matches must be completed before generating knockout" },
        { status: 400 }
      );
    }

    // Get qualified participants
    const qualifiedParticipants = await getQualifiedParticipants(tournament);

    if (qualifiedParticipants.length < 2) {
      return NextResponse.json(
        { error: "At least 2 participants needed for knockout stage" },
        { status: 400 }
      );
    }

    

    // Create seeding based on round robin standings
    const seeding = qualifiedParticipants.map((p, idx) => ({
      participant: new mongoose.Types.ObjectId(p.participantId),
      seedNumber: idx + 1, // Seeded by their round robin ranking
    }));

    const isDoubles = tournament.matchType === "doubles" || tournament.matchType === "mixed_doubles";

    // Check for custom bracket matches (if custom mode is selected)
    let useCustom = false;
    try {
      const body = await req.json();
      useCustom = body.useCustom || false;
    } catch {
      // No body provided, use automatic generation
    }
    
    const customMatches = useCustom && tournament.customBracketMatches?.length > 0
      ? tournament.customBracketMatches.map((m: any) => ({
          participant1: new mongoose.Types.ObjectId(m.participant1.toString()),
          participant2: new mongoose.Types.ObjectId(m.participant2.toString()),
        }))
      : undefined;

    // Generate knockout bracket
    const bracketParticipants = qualifiedParticipants.map(
      (p) => new mongoose.Types.ObjectId(p.participantId)
    );

    const bracket = generateKnockoutBracket(
      bracketParticipants,
      seeding,
      {
        consolationBracket: true, // Include 3rd place match
        customMatches: customMatches,
      }
    );

    // Process byes
    const processedBracket = processByes(bracket);

    // Create actual matches for round 1
    const knockoutRound1Matches = [];
    for (const match of processedBracket.rounds[0].matches) {
      // Skip matches that are byes
      if (match.completed) continue;

      const participant1Id = resolveParticipantSlot(match.participant1, processedBracket);
      const participant2Id = resolveParticipantSlot(match.participant2, processedBracket);

      if (!participant1Id || !participant2Id) continue;

      let matchParticipants;
      if (isDoubles) {
        // For doubles, we need team mappings - for now, use individual participants
        // This can be enhanced if team data is stored
        matchParticipants = [participant1Id, participant2Id];
      } else {
        matchParticipants = [participant1Id, participant2Id];
      }

      const individualMatch = new IndividualMatch({
        matchType: tournament.matchType,
        matchCategory: "individual",
        numberOfSets: tournament.rules.setsPerMatch,
        city: tournament.city,
        venue: tournament.venue || tournament.city,
        participants: matchParticipants,
        scorer: decoded.userId,
        status: "scheduled",
        tournament: tournament._id,
        isKnockout: true, // Mark as knockout match
      });

      await individualMatch.save();

      // Update bracket match with actual match ID
      match.matchId = individualMatch._id;
      knockoutRound1Matches.push(individualMatch._id);
    }

    // Save bracket to tournament
    tournament.bracket = processedBracket;

    // Update stages
    if (tournament.stages && tournament.stages.length >= 2) {
      // Mark stage 1 as completed
      tournament.stages[0].status = "completed";

      // Mark stage 2 as in_progress and add bracket
      tournament.stages[1].status = "in_progress";
      tournament.stages[1].bracket = processedBracket;
    }

    // Update current stage
    tournament.currentStageNumber = 2;

    // Note: Knockout matches are tracked in bracket only, not in rounds array
    // This keeps round-robin rounds separate from knockout bracket

    await tournament.save();
    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "standings.participant", select: "username fullName profileImage" },
      { path: "groups.standings.participant", select: "username fullName profileImage" },
      { path: "bracket.rounds.matches.participant1.participantId", select: "username fullName profileImage" },
      { path: "bracket.rounds.matches.participant2.participantId", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Knockout bracket generated successfully",
      tournament,
      knockoutStats: {
        qualifiedParticipants: qualifiedParticipants.length,
        bracketSize: processedBracket.size,
        totalKnockoutRounds: processedBracket.rounds.length,
        round1Matches: knockoutRound1Matches.length,
      },
    });
  } catch (err: any) {
    console.error("Error generating knockout:", err);
    return NextResponse.json(
      { error: "Failed to generate knockout bracket", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * Check if all round robin matches are completed
 */
async function checkRoundRobinComplete(tournament: any): Promise<boolean> {
  // Get all match IDs from round robin phase
  let matchIds: string[] = [];

  if (tournament.useGroups && tournament.groups?.length > 0) {
    // Get matches from all groups
    for (const group of tournament.groups) {
      for (const round of group.rounds || []) {
        matchIds.push(...round.matches.map((m: any) => m.toString()));
      }
    }
  } else {
    // Get matches from tournament.rounds
    for (const round of tournament.rounds || []) {
      matchIds.push(...round.matches.map((m: any) => m.toString()));
    }
  }

  if (matchIds.length === 0) {
    return false;
  }

  // Check if all matches are completed
  const matches = await IndividualMatch.find({
    _id: { $in: matchIds },
  });

  const allCompleted = matches.every((m) => m.status === "completed");
  const completedCount = matches.filter((m) => m.status === "completed").length;

  

  return allCompleted;
}

/**
 * Get qualified participants based on standings
 */
async function getQualifiedParticipants(tournament: any): Promise<Array<{ participantId: string; rank: number; points: number }>> {
  const qualified: Array<{ participantId: string; rank: number; points: number; groupId?: string }> = [];

  if (tournament.useGroups && tournament.groups?.length > 0) {
    // Get top N from each group
    const advancePerGroup = tournament.advancePerGroup || 2;

    for (const group of tournament.groups) {
      // Sort standings by rank (or points if rank not set)
      const sortedStandings = [...(group.standings || [])].sort((a: any, b: any) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return b.points - a.points;
      });

      // Take top N from this group
      for (let i = 0; i < Math.min(advancePerGroup, sortedStandings.length); i++) {
        const standing = sortedStandings[i];
        qualified.push({
          participantId: standing.participant.toString(),
          rank: i + 1,
          points: standing.points,
          groupId: group.groupId,
        });
      }
    }

    // Sort qualifiers: alternate between groups to create fair bracket
    // e.g., 1A vs 2B, 1B vs 2A for 2 groups
    qualified.sort((a, b) => {
      // First by rank within group, then by points
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.points - a.points;
    });
  } else {
    // No groups - get top N from overall standings
    const advanceTop = tournament.rules?.advanceTop || 4;

    const sortedStandings = [...(tournament.standings || [])].sort((a: any, b: any) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.points - a.points;
    });

    for (let i = 0; i < Math.min(advanceTop, sortedStandings.length); i++) {
      const standing = sortedStandings[i];
      qualified.push({
        participantId: standing.participant.toString(),
        rank: i + 1,
        points: standing.points,
      });
    }
  }

  
  return qualified;
}

/**
 * GET: Check if knockout can be generated
 */
export async function GET(
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

    const isMultiStage = tournament.isMultiStage || tournament.format === "multi_stage" || tournament.format === "round_robin";
    const knockoutAlreadyGenerated = tournament.bracket && tournament.bracket.rounds?.length > 0;
    const roundRobinComplete = await checkRoundRobinComplete(tournament);
    const qualifiedParticipants = await getQualifiedParticipants(tournament);

    return NextResponse.json({
      canGenerateKnockout: isMultiStage && !knockoutAlreadyGenerated && roundRobinComplete,
      isMultiStage,
      knockoutAlreadyGenerated,
      roundRobinComplete,
      qualifiedCount: qualifiedParticipants.length,
      qualifiedParticipants: qualifiedParticipants.map(p => p.participantId),
      currentStage: tournament.currentStageNumber || 1,
    });
  } catch (err: any) {
    console.error("Error checking knockout status:", err);
    return NextResponse.json(
      { error: "Failed to check knockout status", details: err.message },
      { status: 500 }
    );
  }
}
