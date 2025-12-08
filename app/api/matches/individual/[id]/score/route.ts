import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import {
  flipDoublesRotationForNextGame,
  getNextServer,
} from "@/components/live-scorer/individual/helpers";
import { statsService } from "@/services/statsService";
import { updateTournamentAfterMatch } from "@/services/tournament/tournamentUpdateService";
import { emitToMatchRoom } from "@/lib/socketEmitter";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const body = await request.json();

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can update
    if (match.scorer?.toString() !== auth.userId) {
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

      // ✅ Compute server after subtraction
      const serverResult = getNextServer(
        currentGame.side1Score,
        currentGame.side2Score,
        match.matchType !== "singles",
        match.serverConfig || {},
        gameNumber
      );
      match.currentServer = serverResult.server as any;
    }

    // Handle normal score update
    if (
      typeof body.side1Score === "number" &&
      typeof body.side2Score === "number"
    ) {
      // Validate: If score is increasing, shotData must be provided
      const scoreIncreased = 
        body.side1Score > currentGame.side1Score || 
        body.side2Score > currentGame.side2Score;
      
      if (scoreIncreased && (!body.shotData || !body.shotData.stroke)) {
        return NextResponse.json(
          { 
            error: "Shot data is required when incrementing score. Every point must have a recorded shot.",
            details: "Score increased but no shot was provided"
          },
          { status: 400 }
        );
      }

      currentGame.side1Score = body.side1Score;
      currentGame.side2Score = body.side2Score;

      // ✅ Compute server after score update
      const serverResult = getNextServer(
        body.side1Score,
        body.side2Score,
        match.matchType !== "singles",
        match.serverConfig || {},
        gameNumber
      );
      match.currentServer = serverResult.server as any;

      // Emit server change event
      emitToMatchRoom(id, "server:change", {
        matchId: id,
        matchCategory: "individual",
        currentServer: match.currentServer,
        reason: "score_update",
        timestamp: new Date().toISOString(),
      });
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

      // Emit game completed event
      emitToMatchRoom(id, "game:completed", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        winnerSide: currentGame.winnerSide,
        finalScore: {
          side1Score: currentGame.side1Score,
          side2Score: currentGame.side2Score,
        },
        newSetScore: {
          side1Sets: match.finalScore.side1Sets,
          side2Sets: match.finalScore.side2Sets,
        },
        timestamp: new Date().toISOString(),
      });

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

        // Save match first before triggering dependent updates
        await match.save();

        // Emit match completed event
        emitToMatchRoom(id, "match:completed", {
          matchId: id,
          matchCategory: "individual",
          winnerSide: match.winnerSide,
          finalScore: {
            side1Sets: match.finalScore.side1Sets,
            side2Sets: match.finalScore.side2Sets,
          },
          timestamp: new Date().toISOString(),
        });

        // Trigger stats update when match completes
        try {
          await statsService.updateIndividualMatchStats(id);
        } catch (statsError) {
          console.error("Error updating stats:", statsError);
          // Don't fail the request if stats update fails
        }

        if (match.tournament) {
          try {
            // Reload match to ensure we have the latest data with participants
            const updatedMatch = await IndividualMatch.findById(match._id);
            if (updatedMatch) {
              await updateTournamentAfterMatch(updatedMatch);
            }
          } catch (tournamentError) {
            console.error("[SCORE] ❌ Error updating tournament:", tournamentError);
            // Don't fail the request if tournament update fails
          }
        }
      } else {
        // Prepare next game
        match.currentGame = gameNumber + 1;

        if (match.matchType !== "singles") {
          // Ensure serverConfig object exists
          match.serverConfig = match.serverConfig || {};

          // Determine current server order
          let currentOrder = match.serverConfig.serverOrder;
          if (!Array.isArray(currentOrder) || currentOrder.length !== 4) {
            currentOrder = match.serverConfig.serverOrder || [];
          }

          // Flip rotation for next game
          if (Array.isArray(currentOrder) && currentOrder.length === 4) {
            const newOrder = flipDoublesRotationForNextGame(currentOrder);
            match.serverConfig.serverOrder = newOrder;
            match.currentServer = newOrder[0] || null;
          } else {
            match.currentServer = null;
          }
        } else {
          // ✅ Singles: compute server for next game (0-0)
          const serverResult = getNextServer(
            0,
            0,
            false,
            match.serverConfig || {},
            gameNumber + 1
          );
          match.currentServer = serverResult.server as any;
        }
      }
    }

    // Add shot data if provided
    if (body.shotData?.player && body.shotData?.stroke) {
      const shot = {
        shotNumber: (currentGame.shots?.length || 0) + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        stroke: body.shotData.stroke,
        server: body.shotData.server || null,
        originX: body.shotData.originX,
        originY: body.shotData.originY,
        landingX: body.shotData.landingX,
        landingY: body.shotData.landingY,
        timestamp: new Date(),
      };

      currentGame.shots = currentGame.shots || [];
      currentGame.shots.push(shot);

      // Emit shot recorded event
      emitToMatchRoom(id, "shot:recorded", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        shot,
        timestamp: new Date().toISOString(),
      });

      // Update statistics
      const stats = match.statistics || {};
      const playerId = body.shotData.player.toString();

      if (!stats.playerStats) stats.playerStats = new Map();
      if (!stats.playerStats.get(playerId)) {
        stats.playerStats.set(playerId, {
          detailedShots: {},
        });
      }

      const playerStats = stats.playerStats.get(playerId);

      match.statistics = stats;
      match.markModified("games");
      match.markModified("statistics");
    }

    // Save match if not already saved (when match completes, it's saved earlier to trigger tournament updates)
    if (match.status !== "completed") {
      await match.save();
    }

    // Emit score update event (for both completed and in-progress matches)
    emitToMatchRoom(id, "score:update", {
      matchId: id,
      matchCategory: "individual",
      gameNumber,
      side1Score: currentGame.side1Score,
      side2Score: currentGame.side2Score,
      currentServer: match.currentServer,
      finalScore: {
        side1Sets: match.finalScore.side1Sets,
        side2Sets: match.finalScore.side2Sets,
      },
      gameCompleted: currentGame.completed || false,
      gameWinner: currentGame.winnerSide || null,
      timestamp: new Date().toISOString(),
    });

    const updatedMatchDoc = await IndividualMatch.findById(match._id).populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "games.shots.player", select: "username fullName profileImage" },
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