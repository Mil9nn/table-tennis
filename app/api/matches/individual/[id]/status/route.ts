import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { statsService } from "@/services/statsService";
import { updateTournamentAfterMatch } from "@/services/tournament/tournamentUpdateService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const { status, winnerSide } = await req.json();

    if (
      !["scheduled", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== auth.userId) {
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