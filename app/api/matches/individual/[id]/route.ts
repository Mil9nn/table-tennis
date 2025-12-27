import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { populateIndividualMatch, populateIndividualMatchBasic } from "@/services/match/populationService";

// CRITICAL: Import models in correct order to ensure discriminators are registered
import Match from "@/models/MatchBase";
import IndividualMatch from "@/models/IndividualMatch";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    const match = await populateIndividualMatch(
      IndividualMatch.findById(id),
      { includeTournament: true }
    ).exec();

    if (!match) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching individual match:", error);
    return NextResponse.json(
      { error: "Failed to fetch individual match" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const body = await req.json();

    // Fetch match to verify scorer authorization
    const existingMatch = await IndividualMatch.findById(id);
    if (!existingMatch) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    // Only scorer can update match
    const scorerId = existingMatch.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can update this match" },
        { status: 403 }
      );
    }

    // Whitelist allowed update fields (prevent mass assignment)
    const allowedFields = ["venue", "city", "notes"];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const match = await populateIndividualMatchBasic(
      IndividualMatch.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
    ).exec();

    return NextResponse.json({
      match,
      message: "Individual match updated successfully",
    });
  } catch (error) {
    console.error("Error updating individual match:", error);
    return NextResponse.json(
      { error: "Failed to update individual match" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;

    // Fetch match to verify scorer authorization
    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    // Only scorer can delete match
    const scorerId = match.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can delete this match" },
        { status: 403 }
      );
    }

    await IndividualMatch.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Individual match deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting individual match:", error);
    return NextResponse.json(
      { error: "Failed to delete individual match" },
      { status: 500 }
    );
  }
}
