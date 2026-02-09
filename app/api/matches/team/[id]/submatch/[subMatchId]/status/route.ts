import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { withAuth } from "@/lib/api-utils";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  // Rate limiting
  const { id, subMatchId } = await context.params;
  const rateLimitResponse = await rateLimit(req, "POST", `/api/matches/team/${id}/submatch/${subMatchId}/status`);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const body = await req.json();

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check scoring permission
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

    const subMatch = match.subMatches.id(subMatchId);

    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    // Update submatch status
    if (body.status) {
      subMatch.status = body.status;

      // Set match startedAt when first submatch goes to in_progress
      if (body.status === "in_progress" && !match.startedAt) {
        match.startedAt = new Date();
      }

      if (body.status === "scheduled") {
        subMatch.winnerSide = null;
        subMatch.completed = false;
        subMatch.games = [];
        subMatch.finalScore = { team1Games: 0, team2Games: 0 };
      }

      match.markModified("subMatches");
      await match.save();

      const updatedMatch = await TeamMatch.findById(match._id)
        .populate(
          "team1.players.user team2.players.user",
          "username fullName profileImage"
        )
        .populate(
          "subMatches.playerTeam1 subMatches.playerTeam2",
          "username fullName profileImage"
        );

      return NextResponse.json({
        match: updatedMatch,
        message: "SubMatch status updated",
      });
    } else {
      return NextResponse.json(
        { error: "Status not provided" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("[matches/team/[id]/submatch/[subMatchId]/status POST] Error:", err);
    return NextResponse.json(
      {
        error: "Failed to update submatch status",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
      },
      { status: 500 }
    );
  }
}

// Optional: GET to fetch a submatch with logs
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();

    const { id, subMatchId } = await context.params;
    const match = await TeamMatch.findById(id)
      .populate("team1.players.user team2.players.user", "username fullName")
      .populate(
        "subMatches.playerTeam1 subMatches.playerTeam2",
        "username fullName"
      );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const subMatch = match.subMatches.id(subMatchId);

    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subMatch });
  } catch (err: any) {
    console.error("[matches/team/[id]/submatch/[subMatchId]/status GET] Error:", err);
    return NextResponse.json(
      { 
        error: "Failed to fetch submatch",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}
