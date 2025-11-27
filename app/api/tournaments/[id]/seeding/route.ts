// app/api/tournaments/[id]/seeding/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { generateRandomSeeding } from "@/services/tournamentService";

/**
 * GET - Retrieve tournament seeding
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const tournament = await Tournament.findById(id).populate(
      "seeding.participant",
      "username fullName profileImage"
    );

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      seeding: tournament.seeding,
      seedingMethod: tournament.seedingMethod,
    });
  } catch (err: any) {
    console.error("Error fetching seeding:", err);
    return NextResponse.json(
      { error: "Failed to fetch seeding" },
      { status: 500 }
    );
  }
}

/**
 * POST - Set or update tournament seeding
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

    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot change seeding after draw is generated" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { seeding, seedingMethod } = body;

    // Validate seeding
    if (seeding && Array.isArray(seeding)) {
      // Check all participants are seeded
      const seededParticipants = new Set(
        seeding.map((s: any) => s.participant.toString())
      );
      const allParticipants = new Set(
        tournament.participants.map((p: any) => p.toString())
      );

      if (seededParticipants.size !== allParticipants.size) {
        return NextResponse.json(
          { error: "All participants must be seeded" },
          { status: 400 }
        );
      }

      // Check for duplicate seed numbers
      const seedNumbers = seeding.map((s: any) => s.seedNumber);
      const uniqueSeeds = new Set(seedNumbers);
      if (seedNumbers.length !== uniqueSeeds.size) {
        return NextResponse.json(
          { error: "Duplicate seed numbers found" },
          { status: 400 }
        );
      }

      tournament.seeding = seeding;
    }

    if (seedingMethod) {
      tournament.seedingMethod = seedingMethod;

      // Generate random seeding if requested
      if (seedingMethod === "random") {
        const participantIds = tournament.participants.map((p: any) =>
          p.toString()
        );
        tournament.seeding = generateRandomSeeding(participantIds);
      }
    }

    await tournament.save();
    await tournament.populate(
      "seeding.participant",
      "username fullName profileImage"
    );

    return NextResponse.json({
      message: "Seeding updated successfully",
      seeding: tournament.seeding,
      seedingMethod: tournament.seedingMethod,
    });
  } catch (err: any) {
    console.error("Error updating seeding:", err);
    return NextResponse.json(
      { error: "Failed to update seeding", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear tournament seeding
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

    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Cannot clear seeding after draw is generated" },
        { status: 400 }
      );
    }

    tournament.seeding = [];
    tournament.seedingMethod = "none";

    await tournament.save();

    return NextResponse.json({
      message: "Seeding cleared successfully",
    });
  } catch (err: any) {
    console.error("Error clearing seeding:", err);
    return NextResponse.json(
      { error: "Failed to clear seeding" },
      { status: 500 }
    );
  }
}
