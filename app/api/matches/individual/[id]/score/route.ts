import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { flipDoublesRotationForNextGame } from "@/components/live-scorer/individual/helpers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can update
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can update the score" },
        { status: 403 }
      );
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { error: "Match is already completed" },
        { status: 400 }
      );
    }

    const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);

    // Find or create current game
    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      match.games.push({
        gameNumber,
        side1Score: 0,
        side2Score: 0,
        shots: [],
        winnerSide: null,
        completed: false,
        expedite: false,
      });
      currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    }

    // Handle subtract action
    if (body.action === "subtract" && body.side) {
      if (body.side === "side1" && currentGame.side1Score > 0) {
        currentGame.side1Score -= 1;
      }
      if (body.side === "side2" && currentGame.side2Score > 0) {
        currentGame.side2Score -= 1;
      }

      // Remove last shot for that side
      const lastIndex = [...(currentGame.shots || [])]
        .reverse()
        .findIndex((s: any) => s.side === body.side);

      if (lastIndex !== -1) {
        currentGame.shots.splice(
          (currentGame.shots?.length || 0) - 1 - lastIndex,
          1
        );
      }
    }

    // Handle normal score update
    if (
      typeof body.side1Score === "number" &&
      typeof body.side2Score === "number"
    ) {
      currentGame.side1Score = body.side1Score;
      currentGame.side2Score = body.side2Score;
    }

    // Handle current server update if provided
    if (body.currentServer) {
      match.currentServer = body.currentServer;
    }

    // Check if game is won
    const isGameWon =
      (currentGame.side1Score >= 11 || currentGame.side2Score >= 11) &&
      Math.abs(currentGame.side1Score - currentGame.side2Score) >= 2;

    if (isGameWon && !currentGame.winnerSide) {
      currentGame.winnerSide =
        currentGame.side1Score > currentGame.side2Score ? "side1" : "side2";
      currentGame.completed = true;

      // Update set counts
      if (currentGame.winnerSide === "side1") {
        match.finalScore.side1Sets += 1;
      } else {
        match.finalScore.side2Sets += 1;
      }

      // Check if match is won
      const setsNeeded = Math.ceil(match.numberOfSets / 2);
      const isMatchWon =
        match.finalScore.side1Sets >= setsNeeded ||
        match.finalScore.side2Sets >= setsNeeded;

      if (isMatchWon) {
        match.status = "completed";
        match.winnerSide =
          match.finalScore.side1Sets >= setsNeeded ? "side1" : "side2";
        match.matchDuration =
          Date.now() - (match.createdAt?.getTime() || Date.now());
      } else {
        // Prepare next game
        match.currentGame = gameNumber + 1;

        if (match.matchType !== "singles") {
          // Ensure serverConfig object exists
          match.serverConfig = match.serverConfig || {};

          // Determine current server order (fallback to buildDoublesRotation if missing)
          let currentOrder = match.serverConfig.serverOrder;
          if (!Array.isArray(currentOrder) || currentOrder.length !== 4) {
            // NOTE: if you implemented buildDoublesRotation on backend, call it here.
            // Otherwise fall back to the existing order (avoid raising exceptions).
            currentOrder = match.serverConfig.serverOrder || [];
          }

          // Flip rotation for next game (if we have a valid order)
          if (Array.isArray(currentOrder) && currentOrder.length === 4) {
            const newOrder = flipDoublesRotationForNextGame(currentOrder);
            match.serverConfig.serverOrder = newOrder;

            // Persist the *first server* of the new rotation as the authoritative currentServer
            // This prevents recompute mismatch on reload.
            match.currentServer = newOrder[0] || null;
          } else {
            // If no valid serverOrder exists, clear currentServer so frontend will compute reliably
            match.currentServer = null;
          }
        }
      }
    }

    // Add shot data if provided
    if (body.shotData?.player) {
      const shot = {
        shotNumber: (currentGame.shots?.length || 0) + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        stroke: body.shotData.stroke || null,
        outcome: body.shotData.outcome,
        errorType: body.shotData.errorType || null,
        server: body.shotData.server || null,
        timestamp: new Date(),
      };

      currentGame.shots = currentGame.shots || [];
      currentGame.shots.push(shot);

      // Update statistics
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

      match.statistics = stats;
      match.markModified("games");
      match.markModified("statistics");
    }

    await match.save();
    
    const updatedMatchDoc = await IndividualMatch.findById(match._id).populate([
      { path: "participants", select: "username fullName" },
      { path: "games.shots.player", select: "username fullName" },
    ]);

    // ✅ Convert to plain object safely and include all schema-defined fields
    const updatedMatch = updatedMatchDoc.toObject({
      virtuals: true,
      getters: true,
    });

    // ✅ Guarantee these keys exist even if null
    if (updatedMatch.currentServer === undefined) {
      updatedMatch.currentServer = updatedMatchDoc.currentServer ?? null;
    }
    if (updatedMatch.serverConfig === undefined) {
      updatedMatch.serverConfig = updatedMatchDoc.serverConfig ?? null;
    }

    return NextResponse.json({
      match: updatedMatch,
      message:
        match.status === "completed" ? "Match completed!" : "Score updated",
    });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score", details: (err as Error).message },
      { status: 500 }
    );
  }
}
