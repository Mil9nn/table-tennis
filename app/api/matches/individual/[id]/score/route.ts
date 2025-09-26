import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

// --- Helpers to adjust stats ---
function applyShotToStats(match: any, shot: any) {
  const stats = match.statistics || {};
  const playerId = shot.player.toString();

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

  const ps = stats.playerStats.get(playerId);

  if (shot.outcome === "winner") {
    stats.winners = (stats.winners || 0) + 1;
    ps.winners += 1;

    if (shot.stroke?.includes("serve")) {
      stats.aces = (stats.aces || 0) + 1;
      ps.aces += 1;
    }

    if (shot.stroke) {
      ps.detailedShots[shot.stroke] = (ps.detailedShots[shot.stroke] || 0) + 1;
    }
  }

  if (shot.outcome === "error" && shot.errorType) {
    stats.unforcedErrors = (stats.unforcedErrors || 0) + 1;
    ps.unforcedErrors += 1;

    if (shot.errorType === "serve") {
      stats.serveErrors = (stats.serveErrors || 0) + 1;
      ps.serveErrors += 1;
    }

    ps.errorsByType[shot.errorType] = (ps.errorsByType[shot.errorType] || 0) + 1;
  }

  match.statistics = stats;
}

function removeShotFromStats(match: any, shot: any) {
  const stats = match.statistics || {};
  const playerId = shot.player.toString();

  if (!stats.playerStats || !stats.playerStats.get(playerId)) return;

  const ps = stats.playerStats.get(playerId);

  if (shot.outcome === "winner") {
    stats.winners = Math.max(0, (stats.winners || 0) - 1);
    ps.winners = Math.max(0, ps.winners - 1);

    if (shot.stroke?.includes("serve")) {
      stats.aces = Math.max(0, (stats.aces || 0) - 1);
      ps.aces = Math.max(0, ps.aces - 1);
    }

    if (shot.stroke) {
      ps.detailedShots[shot.stroke] = Math.max(
        0,
        (ps.detailedShots[shot.stroke] || 0) - 1
      );
    }
  }

  if (shot.outcome === "error" && shot.errorType) {
    stats.unforcedErrors = Math.max(0, (stats.unforcedErrors || 0) - 1);
    ps.unforcedErrors = Math.max(0, ps.unforcedErrors - 1);

    if (shot.errorType === "serve") {
      stats.serveErrors = Math.max(0, (stats.serveErrors || 0) - 1);
      ps.serveErrors = Math.max(0, ps.serveErrors - 1);
    }

    ps.errorsByType[shot.errorType] = Math.max(
      0,
      (ps.errorsByType[shot.errorType] || 0) - 1
    );
  }

  match.statistics = stats;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // --- Auth Check ---
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
        { error: "Forbidden only the assigned scorer can update the score" },
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

    // --- Subtract flow ---
    if (body.action === "subtract" && body.side) {
      if (body.side === "side1" && currentGame.side1Score > 0) {
        currentGame.side1Score -= 1;
      }
      if (body.side === "side2" && currentGame.side2Score > 0) {
        currentGame.side2Score -= 1;
      }

      const lastIndex = currentGame.shots
        .map((s: any, i: number) => ({ ...s, i }))
        .reverse()
        .find((s: any) => s.side === body.side)?.i;

      if (typeof lastIndex === "number") {
        const removedShot = currentGame.shots[lastIndex];
        currentGame.shots.splice(lastIndex, 1);

        // ✅ Adjust stats
        removeShotFromStats(match, removedShot);
      }
    }

    // --- Normal score update (+ point) ---
    if (
      typeof body.side1Score === "number" &&
      typeof body.side2Score === "number"
    ) {
      currentGame.side1Score = body.side1Score;
      currentGame.side2Score = body.side2Score;
    }

    // --- Add shot (on + point) ---
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

      // ✅ Update stats
      applyShotToStats(match, shot);
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