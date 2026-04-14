import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";
import {
  applyShotsToLoadedMatch,
  deleteAllPointsForIndividualMatch,
  deletePointsForIndividualGame,
} from "@/services/match/matchPointService";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const { resetType } = await req.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check scoring permission
    // For tournament matches: organizer or any assigned scorer can reset
    // For standalone matches: only the assigned scorer can reset
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

    if (resetType === "game") {
      const currentGameNum = match.currentGame ?? 1;
      await deletePointsForIndividualGame(id, currentGameNum);
      
      // ✅ FIXED: Find current game properly
      const gameIndex = match.games.findIndex((g: any) => g.gameNumber === currentGameNum);

      if (gameIndex >= 0) {
        // Reset existing game
        (match.games[gameIndex] as any).scoresById = new Map();
        (match.games[gameIndex] as any).winnerId = null;
        (match.games[gameIndex] as any).status = "in_progress";
      } else {
        // Create fresh current game
        match.games.push({
          gameNumber: currentGameNum,
          scoresById: new Map(),
          winnerId: null,
          status: "in_progress",
        });
      }

      // Clear server config and server pointer
      match.serverConfig = null;
      match.currentServerPlayerId = null;

      // If match was completed, revert status and recalculate sets
      if (match.status === "completed") {
        match.status = "in_progress";
        match.winnerId = null;
        match.startedAt = new Date();
        const sets = new Map<string, number>();
        for (const g of match.games as any[]) {
          const wid = g?.winnerId ? String(g.winnerId) : null;
          if (wid) sets.set(wid, Number(sets.get(wid) || 0) + 1);
        }
        match.finalScore.setsById = sets as any;
      }

    } else {
      await deleteAllPointsForIndividualMatch(id);
      // Full match reset
      match.games = [
        {
          gameNumber: 1,
          scoresById: new Map(),
          winnerId: null,
          status: "in_progress",
        },
      ];
      match.currentGame = 1;
      match.finalScore = { setsById: new Map() } as any;
      match.winnerId = null;
      match.currentServerPlayerId = null;
      match.status = "scheduled";
      match.matchDuration = 0;
      match.startedAt = undefined;
    }

    await match.save();

    const refreshed = await IndividualMatch.findById(id).populate(
      "participants",
      "username fullName"
    );
    if (!refreshed) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const matchJson = await applyShotsToLoadedMatch(refreshed, "individual", true);
    return NextResponse.json({ match: matchJson });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reset match" },
      { status: 500 }
    );
  }
}