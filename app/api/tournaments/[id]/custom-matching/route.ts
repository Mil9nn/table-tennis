import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

/**
 * Get qualified participants from group stage (for multi-stage tournaments)
 */
async function getQualifiedParticipants(tournament: any): Promise<Array<{ participantId: string; rank: number; points: number; groupId?: string }>> {
  const qualified: Array<{ participantId: string; rank: number; points: number; groupId?: string }> = [];

  if (tournament.useGroups && tournament.groups?.length > 0) {
    const advancePerGroup = tournament.advancePerGroup || 2;

    for (const group of tournament.groups) {
      const sortedStandings = [...(group.standings || [])].sort((a: any, b: any) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return b.points - a.points;
      });

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
  } else if (tournament.isMultiStage && tournament.standings?.length > 0) {
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
 * Get custom bracket matches for a knockout tournament
 */
export async function GET(
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

    const tournament = await Tournament.findById(id)
      .populate("participants", "username fullName profileImage")
      .populate("customBracketMatches.participant1", "username fullName profileImage")
      .populate("customBracketMatches.participant2", "username fullName profileImage")
      .populate("groups.standings.participant", "username fullName profileImage")
      .populate("standings.participant", "username fullName profileImage");

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // For multi-stage tournaments, get qualified participants
    let participants = tournament.participants;
    let isMultiStage = false;
    let qualifiedInfo = null;

    if (tournament.isMultiStage || tournament.format === "multi_stage") {
      isMultiStage = true;
      const qualified = await getQualifiedParticipants(tournament);
      
      if (qualified.length > 0) {
        // Get full participant data for qualified players
        const qualifiedIds = qualified.map(q => new mongoose.Types.ObjectId(q.participantId));
        const qualifiedParticipants = await Tournament.findById(id)
          .populate({
            path: "participants",
            match: { _id: { $in: qualifiedIds } },
            select: "username fullName profileImage"
          })
          .select("participants");

        if (qualifiedParticipants) {
          participants = qualifiedParticipants.participants || [];
          
          // Add rank and group info to participants
          participants = participants.map((p: any) => {
            const qual = qualified.find(q => q.participantId === p._id.toString());
            return {
              ...p.toObject(),
              rank: qual?.rank,
              points: qual?.points,
              groupId: qual?.groupId,
            };
          });
        }

        qualifiedInfo = {
          total: qualified.length,
          fromGroups: tournament.useGroups,
        };
      }
    }

    return NextResponse.json({
      customBracketMatches: tournament.customBracketMatches || [],
      participants,
      format: tournament.format,
      drawGenerated: tournament.drawGenerated,
      isMultiStage,
      qualifiedInfo,
      bracketGenerated: tournament.bracket && tournament.bracket.rounds?.length > 0,
    });
  } catch (err: any) {
    console.error("Error fetching custom matching:", err);
    return NextResponse.json(
      { error: "Failed to fetch custom matching" },
      { status: 500 }
    );
  }
}

/**
 * Save custom bracket matches for a knockout tournament
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

    // Only organizer can set custom matching
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't change after draw is generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot change matching after draw is generated" },
        { status: 400 }
      );
    }

    // Only for knockout tournaments or multi-stage tournaments
    const isKnockout = tournament.format === "knockout";
    const isMultiStage = tournament.isMultiStage || tournament.format === "multi_stage";
    
    if (!isKnockout && !isMultiStage) {
      return NextResponse.json(
        { error: "Custom matching is only available for knockout or multi-stage tournaments" },
        { status: 400 }
      );
    }

    const { customBracketMatches } = await req.json();

    // Validate matches
    if (!Array.isArray(customBracketMatches)) {
      return NextResponse.json(
        { error: "Invalid custom matches format" },
        { status: 400 }
      );
    }

    // Get valid participant IDs (either all participants or qualified ones for multi-stage)
    let validParticipantIds: Set<string>;
    
    if (isMultiStage) {
      const qualified = await getQualifiedParticipants(tournament);
      validParticipantIds = new Set(qualified.map(q => q.participantId));
    } else {
      validParticipantIds = new Set(
        tournament.participants.map((p: any) => p.toString())
      );
    }

    for (const match of customBracketMatches) {
      if (!match.participant1 || !match.participant2) {
        return NextResponse.json(
          { error: "Each match must have two participants" },
          { status: 400 }
        );
      }

      if (!validParticipantIds.has(match.participant1.toString())) {
        return NextResponse.json(
          { error: "Invalid participant in match - participant not qualified" },
          { status: 400 }
        );
      }

      if (!validParticipantIds.has(match.participant2.toString())) {
        return NextResponse.json(
          { error: "Invalid participant in match - participant not qualified" },
          { status: 400 }
        );
      }

      if (match.participant1.toString() === match.participant2.toString()) {
        return NextResponse.json(
          { error: "A participant cannot play against themselves" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate participants across matches
    const usedParticipants = new Set<string>();
    for (const match of customBracketMatches) {
      const p1 = match.participant1.toString();
      const p2 = match.participant2.toString();

      if (usedParticipants.has(p1)) {
        return NextResponse.json(
          { error: "Each participant can only appear in one match" },
          { status: 400 }
        );
      }
      if (usedParticipants.has(p2)) {
        return NextResponse.json(
          { error: "Each participant can only appear in one match" },
          { status: 400 }
        );
      }

      usedParticipants.add(p1);
      usedParticipants.add(p2);
    }

    // Save custom matches
    tournament.customBracketMatches = customBracketMatches;
    await tournament.save();

    await tournament.populate([
      { path: "customBracketMatches.participant1", select: "username fullName profileImage" },
      { path: "customBracketMatches.participant2", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Custom matching saved successfully",
      customBracketMatches: tournament.customBracketMatches,
    });
  } catch (err: any) {
    console.error("Error saving custom matching:", err);
    return NextResponse.json(
      { error: "Failed to save custom matching" },
      { status: 500 }
    );
  }
}

/**
 * Clear custom bracket matches
 */
export async function DELETE(
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

    // Only organizer can clear custom matching
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't change after draw is generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot change matching after draw is generated" },
        { status: 400 }
      );
    }

    tournament.customBracketMatches = [];
    await tournament.save();

    return NextResponse.json({
      message: "Custom matching cleared",
    });
  } catch (err: any) {
    console.error("Error clearing custom matching:", err);
    return NextResponse.json(
      { error: "Failed to clear custom matching" },
      { status: 500 }
    );
  }
}




