// app/api/matches/team/[id]/submatch/[subMatchId]/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { withAuth } from "@/lib/api-utils";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id, subMatchId } = await context.params;
    const { resetType } = await req.json();

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check scoring permission
    let canScore = match.scorer?.toString() === auth.userId;
    
    if (!canScore && match.tournament) {
      canScore = await canScoreTournamentMatch(auth.userId, match.tournament.toString());
    }
    
    if (!canScore) {
      return NextResponse.json(
        { error: "Forbidden: you don't have permission to reset this match" },
        { status: 403 }
      );
    }

    // Support both matchNumber (integer), array index, and MongoDB _id (string)
    const subMatchIdNum = parseInt(subMatchId);
    let subMatch = match.subMatches.find((sm: any) => 
      sm.matchNumber === subMatchIdNum || sm._id?.toString() === subMatchId
    );
    // Fallback to array index for backwards compatibility
    if (!subMatch && !isNaN(subMatchIdNum) && subMatchIdNum < match.subMatches.length) {
      subMatch = match.subMatches[subMatchIdNum];
    }

    if (!subMatch) {
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    if (resetType === "game") {
      // Reset current game only
      const currentGameNum = subMatch.games?.length || 1;
      const gameIndex = subMatch.games.findIndex(
        (g: any) => g.gameNumber === currentGameNum
      );

      if (gameIndex >= 0) {
        subMatch.games[gameIndex].team1Score = 0;
        subMatch.games[gameIndex].team2Score = 0;
        subMatch.games[gameIndex].winnerSide = undefined;
        subMatch.games[gameIndex].shots = [];
      }

      // ✅ Clear server config so server dialog will show again
      subMatch.serverConfig = null;
      (subMatch as any).currentServer = null;

      // If submatch was completed, revert it
      if (subMatch.status === "completed") {
        subMatch.status = "in_progress";
        subMatch.winnerSide = undefined;

        // Recalculate game scores from completed games
        const completedGames = subMatch.games.filter((g: any) => g.winnerSide);
        subMatch.finalScore = {
          team1Games: completedGames.filter((g: any) => g.winnerSide === "team1").length,
          team2Games: completedGames.filter((g: any) => g.winnerSide === "team2").length,
        };

        // Also revert team match if it was completed
        if (match.status === "completed") {
          match.status = "in_progress";
          match.winnerTeam = null;
          if (!match.startedAt) {
            match.startedAt = new Date();
          }
        }
      }
    } else {
      // Full submatch reset
      subMatch.games = [
        {
          gameNumber: 1,
          team1Score: 0,
          team2Score: 0,
          shots: [],
          winnerSide: undefined,
          completed: false,
        },
      ];
      subMatch.finalScore = { team1Games: 0, team2Games: 0 };
      subMatch.winnerSide = undefined;
      subMatch.status = "scheduled";
      subMatch.completed = false;
    }

    match.markModified("subMatches");
    await match.save();

    const updatedMatch = await TeamMatch.findById(match._id)
      .populate("scorer", "username fullName")
      .populate("team1.captain team2.captain", "username fullName")
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage")
      .populate("subMatches.games.shots.player", "username fullName profileImage");

    return NextResponse.json({ match: updatedMatch });
  } catch (err) {
    console.error("SubMatch reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset submatch" },
      { status: 500 }
    );
  }
}