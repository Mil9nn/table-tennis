import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

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
      .populate("customBracketMatches.participant2", "username fullName profileImage");

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      customBracketMatches: tournament.customBracketMatches || [],
      participants: tournament.participants,
      format: tournament.format,
      drawGenerated: tournament.drawGenerated,
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

    // Only for knockout tournaments
    if (tournament.format !== "knockout") {
      return NextResponse.json(
        { error: "Custom matching is only available for knockout tournaments" },
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

    // Validate all participants are in the tournament
    const participantIds = new Set(
      tournament.participants.map((p: any) => p.toString())
    );

    for (const match of customBracketMatches) {
      if (!match.participant1 || !match.participant2) {
        return NextResponse.json(
          { error: "Each match must have two participants" },
          { status: 400 }
        );
      }

      if (!participantIds.has(match.participant1.toString())) {
        return NextResponse.json(
          { error: "Invalid participant in match" },
          { status: 400 }
        );
      }

      if (!participantIds.has(match.participant2.toString())) {
        return NextResponse.json(
          { error: "Invalid participant in match" },
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


