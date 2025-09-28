import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

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

    // Only scorer is allowed to update the score
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

    // find or create the current game subdoc
    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      // push as plain object first (same as before)
      match.games.push({
        gameNumber,
        side1Score: 0,
        side2Score: 0,
        shots: [],
        winnerSide: null,
        completed: false,
        expedite: false,
      });

      // IMPORTANT: re-read the subdoc so currentGame becomes the Mongoose subdoc
      currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    }

    // --- Handle subtract (undo last point) ---
    if (body.action === "subtract" && body.side) {
      if (body.side === "side1" && currentGame.side1Score > 0) {
        currentGame.side1Score -= 1;
      }
      if (body.side === "side2" && currentGame.side2Score > 0) {
        currentGame.side2Score -= 1;
      }

      // remove last shot for that side
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

    // --- Handle normal score update (+ point) ---
    if (
      typeof body.side1Score === "number" &&
      typeof body.side2Score === "number"
    ) {
      currentGame.side1Score = body.side1Score;
      currentGame.side2Score = body.side2Score;
    }

    // --- Add single shot if provided (frontend "plus" action) ---
    // Keep the same `player` usage you had (no name manipulation).
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

      match.statistics = stats;

      // ensure Mongoose notices the nested changes
      // mark modified for games (we mutated shots) and statistics (we mutated nested map/object)
      try {
        match.markModified("games");
        match.markModified("statistics");
      } catch (e) {
        // markModified can throw on some lean objects; ignore safely
        console.warn("markModified warning", e);
      }

      // small debug to help you verify first-shot payload server-side
      // remove or toggle in production
      console.debug("[score route] pushed shot:", {
        matchId: match._id,
        gameNumber,
        shot,
        currentShotsCount: currentGame.shots?.length || 0,
      });
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
      { error: "Failed to update score", details: (err as Error).message },
      { status: 500 }
    );
  }
}
