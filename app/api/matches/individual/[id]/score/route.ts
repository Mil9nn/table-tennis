import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { error: "Match is already completed" },
        { status: 400 }
      );
    }

    const side1Score = Number(body.side1Score ?? 0);
    const side2Score = Number(body.side2Score ?? 0);
    const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);

    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      currentGame = {
        gameNumber,
        side1Score: 0,
        side2Score: 0,
        shots: [],
        winnerSide: null,
        completed: false,
        expedite: false,
      };
      match.games.push(currentGame);
    }

    currentGame.side1Score = side1Score;
    currentGame.side2Score = side2Score;

    // --- Handle game winner ---
    if (body.gameWinner && !currentGame.winnerSide) {
      currentGame.winnerSide = body.gameWinner;
      currentGame.completed = true;

      if (body.gameWinner === "side1") {
        match.finalScore.side1Sets += 1;
      } else if (body.gameWinner === "side2") {
        match.finalScore.side2Sets += 1;
      }

      const targetSets = Math.floor(match.numberOfSets / 2) + 1;
      if (
        match.finalScore.side1Sets >= targetSets ||
        match.finalScore.side2Sets >= targetSets
      ) {
        match.status = "completed";
        match.winnerSide =
          match.finalScore.side1Sets > match.finalScore.side2Sets
            ? "side1"
            : "side2";
      } else {
        match.currentGame = gameNumber + 1;
        if (!match.games.some((g: any) => g.gameNumber === match.currentGame)) {
          match.games.push({
            gameNumber: match.currentGame,
            side1Score: 0,
            side2Score: 0,
            shots: [],
            winnerSide: null,
            completed: false,
            expedite: false,
          });
        }
      }
    }

    // --- Add shot data ---
    if (body.shotData?.player) {
      const shot = {
        shotNumber: currentGame.shots.length + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        stroke: body.shotData.stroke || null,
        outcome: body.shotData.outcome,
        errorType: body.shotData.errorType || null,
        server: body.shotData.server || null,
        timestamp: new Date(),
      };

      currentGame.shots.push(shot);

      // ---- Update statistics ----
      const stats = match.statistics || {};
      const playerId = body.shotData.player.toString();

      if (!stats.playerStats) stats.playerStats = new Map();
      if (!stats.playerStats.get(playerId)) {
        stats.playerStats.set(playerId, {
          winners: 0,
          unforcedErrors: 0,
          aces: 0,
          serveErrors: 0,
          detailedShots: {},
          errorsByType: {},
        });
      }
      const playerStats = stats.playerStats.get(playerId);

      if (shot.outcome === "winner") {
        stats.winners = (stats.winners || 0) + 1;
        playerStats.winners += 1;

        if (shot.stroke?.includes("serve")) {
          stats.aces = (stats.aces || 0) + 1;
          playerStats.aces += 1;
        }

        if (shot.stroke) {
          playerStats.detailedShots[shot.stroke] =
            (playerStats.detailedShots[shot.stroke] || 0) + 1;
        }
      }

      if (shot.outcome === "error" && shot.errorType) {
        stats.unforcedErrors = (stats.unforcedErrors || 0) + 1;
        playerStats.unforcedErrors += 1;

        if (shot.errorType === "serve") {
          stats.serveErrors = (stats.serveErrors || 0) + 1;
          playerStats.serveErrors += 1;
        }

        playerStats.errorsByType[shot.errorType] =
          (playerStats.errorsByType[shot.errorType] || 0) + 1;
      }
    }

    await match.save();

    await match.populate([
      { path: "participants", select: "username fullName" },
      { path: "games.shots.player", select: "username fullName" },
    ]);

    return NextResponse.json({ match, message: "Score updated" });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }
}