import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { withAuth } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";
import { updateTournamentAfterMatch } from "@/services/tournament/tournamentUpdateService";
import { teamMatchService } from "@/services/match/teamMatchService";
import { jsonError, ApiErrors } from "@/lib/api-errors";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  const { id, subMatchId } = await context.params;

  const rateLimitResponse = await rateLimit(
    req,
    "POST",
    `/api/matches/team/${id}/submatch/${subMatchId}/score`
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const body = await req.json();

    const match = await TeamMatch.findById(id);
    if (!match) {
      return ApiErrors.notFound("Match");
    }

    // Check scoring permission
    // Match-tournament validation: canScoreTournamentMatch() verifies that:
    // 1. The user is a scorer for the tournament (organizer or in scorers array)
    // 2. The match belongs to that tournament (implicit via match.tournament)
    // This prevents scoring matches from wrong tournaments
    let canScore = match.scorer?.toString() === auth.userId;

    if (!canScore && match.tournament) {
      canScore = await canScoreTournamentMatch(
        auth.userId,
        match.tournament.toString()
      );
    }

    if (!canScore) {
      return ApiErrors.forbidden(
        "You don't have permission to score this match"
      );
    }

    const result = await teamMatchService.updateSubMatchScore(
      id,
      subMatchId,
      {
        gameNumber: body.gameNumber,
        team1Score: body.team1Score,
        team2Score: body.team2Score,
        action: body.action,
        side: body.side,
        shotData: body.shotData,
      },
      async (completedMatch) => {
        if (completedMatch.tournament) {
          try {
            await updateTournamentAfterMatch(completedMatch);
          } catch (tournamentError) {
            console.error("[SCORE] ❌ Error updating tournament:", tournamentError);
          }
        }
      }
    );

    if (!result.success) {
      return jsonError(result.error || "Failed to update score", result.status || 400);
    }

    return NextResponse.json({
      match: result.match,
      message:
        result.match?.status === "completed"
          ? "Team match completed!"
          : "Score updated",
    });
  } catch (err: any) {
    console.error("[matches/team/[id]/submatch/[subMatchId]/score] Error:", err);
    return jsonError("Failed to update score", 500, { details: err.message });
  }
}
