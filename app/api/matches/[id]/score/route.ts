// app/api/matches/[id]/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import Match from "@/models/Match";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing match id" }, { status: 400 });

    const match = await Match.findById(id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // Extract scores
    const side1Score = Number(body.side1Score ?? body.player1Score ?? 0);
    const side2Score = Number(body.side2Score ?? body.player2Score ?? 0);
    const { gameNumber = 1, shotData, gameWinner } = body;

    // Find or create game
    let currentGame = match.games.find((g) => Number(g.gameNumber) === Number(gameNumber));
    if (!currentGame) {
      currentGame = {
        gameNumber: Number(gameNumber),
        side1Score: 0,
        side2Score: 0,
        shots: [],
        startTime: new Date(),
      };

      if (body.currentPlayers) {
        const cp = body.currentPlayers;
        currentGame.currentPlayers = {
          side1: cp.side1 ?? cp.player1 ?? cp.team1 ?? "",
          side2: cp.side2 ?? cp.player2 ?? cp.team2 ?? "",
        };
      }

      match.games.push(currentGame);
    }

    // Update scores
    currentGame.side1Score = side1Score;
    currentGame.side2Score = side2Score;

    // Update players if provided
    if (body.currentPlayers) {
      const cp = body.currentPlayers;
      currentGame.currentPlayers = {
        side1: cp.side1 ?? currentGame.currentPlayers?.side1 ?? "",
        side2: cp.side2 ?? currentGame.currentPlayers?.side2 ?? "",
      };
    }

    // Add shot
    if (shotData) {
      const shotEntry: any = {
        shotNumber: (currentGame.shots?.length ?? 0) + 1,
        side:
          shotData.side ??
          (shotData.player === "player1" ? "side1" : shotData.player === "player2" ? "side2" : undefined),
        player: shotData.playerId ?? shotData.playerUserId ?? null,
        shotType: shotData.shotType ?? "unknown",
        result: shotData.result ?? "in_play",
        timestamp: shotData.timestamp ? new Date(shotData.timestamp) : new Date(),
      };
      if (shotData.playerName) shotEntry.playerName = shotData.playerName;

      currentGame.shots.push(shotEntry);

      // Update statistics
      match.statistics.totalShots = (match.statistics.totalShots || 0) + 1;

      // Track playerStats
      const playerKey = shotData.playerId?.toString() || shotData.playerName || shotEntry.side;
      if (playerKey) {
        if (!match.statistics.playerStats) match.statistics.playerStats = new Map();
        if (!match.statistics.playerStats.get(playerKey)) {
          match.statistics.playerStats.set(playerKey, {
            winners: 0,
            errors: 0,
            aces: 0,
            detailedShots: {},
          });
        }
        const stats = match.statistics.playerStats.get(playerKey);

        // Detailed shot
        if (shotData.shotType) {
          stats.detailedShots[shotData.shotType] =
            (stats.detailedShots[shotData.shotType] || 0) + 1;
        }
        if (shotData.result === "winner") stats.winners++;
        if (shotData.result === "error") stats.errors++;
        if (shotData.shotType === "serve_point") stats.aces++;

        match.statistics.playerStats.set(playerKey, stats);
      }
    }

    // Handle game winner
    if (gameWinner && !currentGame.winner) {
      let normalizedWinner: "side1" | "side2" | null = null;
      const gw = String(gameWinner).toLowerCase();
      if (gw === "player1" || gw === "side1" || gw === "team1") normalizedWinner = "side1";
      if (gw === "player2" || gw === "side2" || gw === "team2") normalizedWinner = "side2";

      currentGame.winner = normalizedWinner;
      currentGame.endTime = new Date();
      currentGame.duration = currentGame.startTime
        ? Math.floor((+currentGame.endTime - +currentGame.startTime) / 1000)
        : undefined;

      // Update match final score
      if (normalizedWinner === "side1") match.finalScore.side1Sets++;
      if (normalizedWinner === "side2") match.finalScore.side2Sets++;

      // Completion check
      const setsToWin = Math.ceil((match.numberOfSets ?? 3) / 2);
      if (match.finalScore.side1Sets >= setsToWin) {
        match.winner = "side1";
        match.status = "completed";
      } else if (match.finalScore.side2Sets >= setsToWin) {
        match.winner = "side2";
        match.status = "completed";
      }
    }

    // Update match duration
    if (match.status === "completed" && match.games.length > 0) {
      const firstGame = match.games[0];
      const lastGame = match.games[match.games.length - 1];
      if (firstGame.startTime && lastGame.endTime) {
        match.matchDuration = Math.floor((+lastGame.endTime - +firstGame.startTime) / 1000);
      }
    }

    // Save and populate
    await match.save();
    await match.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1", select: "name city players" },
      { path: "team2", select: "name city players" },
    ]);

    return NextResponse.json({ match, message: "Score updated successfully" });
  } catch (error) {
    console.error("Error updating score:", error);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}