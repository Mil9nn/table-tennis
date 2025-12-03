import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { populateTeamMatch, populateTeamMatchBasic } from "@/services/match/populationService";
import { statsService } from "@/services/statsService";
import { TeamMatch as TeamMatchType } from "@/types/match.type";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    const match = await populateTeamMatch(TeamMatch.findById(id)).exec();

    if (!match) return NextResponse.json({ error: "Team match not found" }, { status: 404 });

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching team match:", error);
    return NextResponse.json({ error: "Failed to fetch team match" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;

    // Get the old match to check scorer and status
    const oldMatch = await TeamMatch.findById(id).lean<TeamMatchType>();
    if (!oldMatch) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    // Only scorer can update match
    const scorerId = oldMatch.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can update this match" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Whitelist allowed update fields (prevent mass assignment)
    const allowedFields = ["venue", "city", "status", "notes"];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const match = await populateTeamMatch(
      TeamMatch.findByIdAndUpdate(id, { $set: updateData }, { new: true })
    ).exec();

    // Trigger stats update if match was just completed
    if (oldMatch?.status !== "completed" && updateData.status === "completed") {
      try {
        await statsService.updateTeamMatchStats(id);
      } catch (statsError) {
        console.error("Error updating team stats:", statsError);
      }
    }

    return NextResponse.json({ match, message: "Team match updated successfully" });
  } catch (error) {
    console.error("Error updating team match:", error);
    return NextResponse.json({ error: "Failed to update team match" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;

    // Fetch match to verify scorer authorization
    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    // Only scorer can delete match
    const scorerId = match.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can delete this match" },
        { status: 403 }
      );
    }

    await TeamMatch.findByIdAndDelete(id);

    return NextResponse.json({ message: "Team match deleted successfully" });
  } catch (error) {
    console.error("Error deleting team match:", error);
    return NextResponse.json({ error: "Failed to delete team match" }, { status: 500 });
  }
}