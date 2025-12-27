import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { statsService } from "@/services/statsService";
import { updateTournamentAfterMatch } from "@/services/tournament/tournamentUpdateService";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(req, "POST", `/api/matches/individual/${id}/status`);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
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

    // Check scoring permission
    // For tournament matches: organizer or any assigned scorer can score
    // For standalone matches: only the assigned scorer can score
    // 
    // Match-tournament validation: canScoreTournamentMatch() verifies that:
    // 1. The user is a scorer for the tournament (organizer or in scorers array)
    // 2. The match belongs to that tournament (implicit via match.tournament)
    // This prevents updating matches from wrong tournaments
    let canScore = match.scorer?.toString() === auth.userId;
    
    if (!canScore && match.tournament) {
      canScore = await canScoreTournamentMatch(auth.userId, match.tournament.toString());
    }
    
    if (!canScore) {
      return NextResponse.json(
        { error: "Forbidden: you don't have permission to update this match" },
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
          // Reload match to ensure we have the latest data with participants populated
          const updatedMatch = await IndividualMatch.findById(match._id).populate(
            "participants",
            "_id username fullName"
          );
          if (updatedMatch) {
            await updateTournamentAfterMatch(updatedMatch);
          }
        } catch (tournamentError) {
          console.error("Error updating tournament:", tournamentError);
          // Don't fail the request if tournament update fails
        }
      }
    }

    return NextResponse.json({ match });
  } catch (err: any) {
    console.error("[matches/individual/[id]/status] Error:", err);
    return NextResponse.json(
      { 
        error: "Failed to update match status",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}