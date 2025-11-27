import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Ensure models are registered for population
    if (!IndividualMatch || !User) {
      throw new Error("Required models not loaded");
    }

    const { id } = await context.params;

    const tournament = await Tournament.findById(id)
      .populate("organizer", "username fullName profileImage")
      .populate("participants", "username fullName profileImage")
      .populate("standings.participant", "username fullName profileImage")
      .populate("groups.standings.participant", "username fullName profileImage")
      .populate("groups.participants", "username fullName profileImage")
      .populate("seeding.participant", "username fullName profileImage")
      .populate({
        path: "rounds.matches",
        model: "IndividualMatch",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      })
      .populate({
        path: "groups.rounds.matches",
        model: "IndividualMatch",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Explicitly ensure IndividualMatch is registered
    if (!IndividualMatch) {
      throw new Error("IndividualMatch model not loaded");
    }

    const { id } = await context.params;

    // Fetch tournament to verify organizer authorization
    const existingTournament = await Tournament.findById(id);
    if (!existingTournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can update tournament
    const organizerId = existingTournament.organizer?.toString();
    if (organizerId && organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the organizer can update this tournament" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Whitelist allowed update fields (prevent mass assignment)
    const allowedFields = ["name", "description", "venue", "city", "startDate", "endDate", "status"];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const tournament = await Tournament.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("organizer", "username fullName profileImage")
      .populate("participants", "username fullName profileImage")
      .populate("standings.participant", "username fullName profileImage")
      .populate("groups.standings.participant", "username fullName profileImage")
      .populate("seeding.participant", "username fullName profileImage");

    return NextResponse.json({
      tournament,
      message: "Tournament updated successfully",
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch tournament to verify organizer authorization
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can delete tournament
    const organizerId = tournament.organizer?.toString();
    if (organizerId && organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the organizer can delete this tournament" },
        { status: 403 }
      );
    }

    await Tournament.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Tournament deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}