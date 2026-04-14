import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { statsService } from "@/services/statsService";
import { updateTournamentAfterMatch } from "@/services/tournament/tournamentUpdateService";
import { emitToMatchRoom } from "@/lib/socketEmitter";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";
import {
  applyShotsToLoadedMatch,
  deleteLastIndividualPointForScoringId,
  insertIndividualPoint,
} from "@/services/match/matchPointService";

type ScoreMap = Map<string, number>;

function getParticipantIds(match: any): string[] {
  return (match.participants || []).map((p: any) => String(p?._id ?? p));
}

function getScoresMap(game: any): ScoreMap {
  if (game.scoresById instanceof Map) return game.scoresById as ScoreMap;
  return new Map<string, number>(Object.entries(game.scoresById || {}));
}

function setScoresMap(game: any, map: ScoreMap): void {
  game.scoresById = map;
}

function toObject(map: ScoreMap): Record<string, number> {
  return Object.fromEntries(map);
}

function gameWinnerIdFromScores(scores: ScoreMap): string | null {
  const rows = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length < 2) return null;
  const [topId, topScore] = rows[0];
  const secondScore = rows[1][1];
  if (topScore >= 11 && topScore - secondScore >= 2) return topId;
  return null;
}

function getNextSinglesServerId(params: {
  participantIds: string[];
  firstServerId?: string | null;
  currentGame: number;
  totalPoints: number;
}): string | null {
  const { participantIds, firstServerId, currentGame, totalPoints } = params;
  if (participantIds.length < 2) return null;
  const p0 = participantIds[0];
  const p1 = participantIds[1];
  const first = firstServerId && participantIds.includes(firstServerId) ? firstServerId : p0;
  const gameFirst = currentGame % 2 === 0 ? (first === p0 ? p1 : p0) : first;
  const other = gameFirst === p0 ? p1 : p0;
  const deuce = totalPoints >= 20;
  if (deuce) {
    return totalPoints % 2 === 0 ? gameFirst : other;
  }
  return Math.floor(totalPoints / 2) % 2 === 0 ? gameFirst : other;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(request, "POST", `/api/matches/individual/${id}/score`);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;
    const body = await request.json();

    const matchPreview = await IndividualMatch.findById(id);
    if (!matchPreview) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    let canScore = matchPreview.scorer?.toString() === auth.userId;
    if (!canScore && matchPreview.tournament) {
      canScore = await canScoreTournamentMatch(auth.userId, matchPreview.tournament.toString());
    }
    if (!canScore) {
      return NextResponse.json(
        { error: "Forbidden: you don't have permission to score this match" },
        { status: 403 }
      );
    }

    if (matchPreview.status === "completed") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
    }

    let shotTrackingMode: "detailed" | "simple" = "detailed";
    if (matchPreview.shotTrackingMode) {
      shotTrackingMode = matchPreview.shotTrackingMode;
    } else {
      const user = await User.findById(auth.userId).select("shotTrackingMode");
      if (user?.shotTrackingMode) {
        shotTrackingMode = user.shotTrackingMode;
      }
    }

    let emitShot: Record<string, unknown> | null = null;
    let didApplyScore = false;
    let didJustCompleteGame = false;
    let didJustCompleteMatch = false;
    let completedGameWinnerId: string | null = null;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async (s) => {
        const match = await IndividualMatch.findById(id).session(s);
        if (!match) {
          throw new Error("MATCH_NOT_FOUND");
        }
        if (match.status === "completed") {
          throw new Error("MATCH_COMPLETED");
        }

        const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);
        const participantIds = getParticipantIds(match);
        const setsMap: ScoreMap =
          match.finalScore?.setsById instanceof Map
            ? (match.finalScore.setsById as ScoreMap)
            : new Map(Object.entries(match.finalScore?.setsById || {}));

        let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
        if (!currentGame) {
          match.games.push({
            gameNumber,
            scoresById: new Map(participantIds.map((pid) => [pid, 0])),
            winnerId: null,
            status: "in_progress",
            completed: false,
          });
          currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
        }
        const scores = getScoresMap(currentGame);
        if (scores.size === 0) {
          for (const pid of participantIds) scores.set(pid, 0);
        }

        const scoringId = body.scoringId ? String(body.scoringId) : undefined;
        if (body.action === "subtract" && scoringId) {
          const now = Number(scores.get(scoringId) || 0);
          scores.set(scoringId, Math.max(0, now - 1));
          await deleteLastIndividualPointForScoringId(match._id, gameNumber, scoringId, s);
          didApplyScore = true;
        }

        if (body.scoresById && typeof body.scoresById === "object") {
          for (const [pid, value] of Object.entries(body.scoresById as Record<string, number>)) {
            scores.set(String(pid), Number(value || 0));
          }
          didApplyScore = true;
        } else if (body.action !== "subtract" && scoringId) {
          const before = Number(scores.get(scoringId) || 0);
          const after = before + 1;
          if (shotTrackingMode === "detailed" && (!body.shotData || !body.shotData.stroke)) {
            throw new Error("SHOT_REQUIRED");
          }
          scores.set(scoringId, after);
          didApplyScore = true;
        }
        setScoresMap(currentGame, scores);

        const gameWinnerId = gameWinnerIdFromScores(scores);
        const totalPoints = [...scores.values()].reduce((a, b) => a + b, 0);

        if (gameWinnerId && !currentGame.winnerId) {
          didJustCompleteGame = true;
          completedGameWinnerId = gameWinnerId;
          currentGame.winnerId = new mongoose.Types.ObjectId(gameWinnerId);
          currentGame.status = "completed";

          setsMap.set(gameWinnerId, Number(setsMap.get(gameWinnerId) || 0) + 1);
          match.finalScore.setsById = setsMap;

          const setsNeeded = Math.ceil(match.numberOfSets / 2);
          const wonSets = Number(setsMap.get(gameWinnerId) || 0);
          const isMatchWon = wonSets >= setsNeeded;

          if (isMatchWon) {
            didJustCompleteMatch = true;
            match.status = "completed";
            match.winnerId = new mongoose.Types.ObjectId(gameWinnerId);
            match.matchDuration =
              Date.now() -
              (match.startedAt?.getTime() || match.createdAt?.getTime() || Date.now());
          } else {
            match.currentGame = gameNumber + 1;
          }
        }

        if (didApplyScore && match.matchType === "singles") {
          const firstServer = match.serverConfig?.firstServerPlayerId
            ? String(match.serverConfig.firstServerPlayerId)
            : participantIds[0];
          const serverId = getNextSinglesServerId({
            participantIds,
            firstServerId: firstServer,
            currentGame: gameNumber,
            totalPoints,
          });
          match.currentServerPlayerId = serverId
            ? new mongoose.Types.ObjectId(serverId)
            : null;
        }

        if (body.shotData?.player && scoringId) {
          const stored = await insertIndividualPoint({
            matchId: match._id,
            gameNumber,
            shot: {
              side: scoringId,
              player: body.shotData.player,
              stroke: body.shotData.stroke || null,
              serveType: body.shotData.serveType || null,
              server: body.shotData.server || match.currentServerPlayerId || null,
              originX: body.shotData.originX,
              originY: body.shotData.originY,
              landingX: body.shotData.landingX,
              landingY: body.shotData.landingY,
              timestamp: new Date(),
            },
            session: s,
          });

          emitShot = { ...stored, timestamp: stored.timestamp };

          const stats = match.statistics || { playerStats: new Map() };
          const playerId = body.shotData.player.toString();
          if (!stats.playerStats) stats.playerStats = new Map();
          if (!stats.playerStats.get(playerId)) {
            stats.playerStats.set(playerId, { detailedShots: {} });
          }
          match.statistics = stats;
          match.markModified("games");
          match.markModified("statistics");
        }

        await match.save({ session: s });
      });
    } catch (e: any) {
      if (e?.message === "MATCH_NOT_FOUND") {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      if (e?.message === "MATCH_COMPLETED") {
        return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
      }
      if (e?.message === "SHOT_REQUIRED") {
        return NextResponse.json(
          {
            error: "Shot data is required when incrementing score. Every point must have a recorded shot.",
            details: "Score increased but no shot was provided",
          },
          { status: 400 }
        );
      }
      throw e;
    } finally {
      await session.endSession();
    }

    const matchAfter = await IndividualMatch.findById(id);
    const gameNumber = Number(body.gameNumber ?? matchAfter?.currentGame ?? 1);
    const currentGame = matchAfter?.games.find((g: any) => g.gameNumber === gameNumber);
    const scoresById = currentGame?.scoresById instanceof Map
      ? Object.fromEntries(currentGame.scoresById)
      : (currentGame?.scoresById || {});
    const setsById = matchAfter?.finalScore?.setsById instanceof Map
      ? Object.fromEntries(matchAfter.finalScore.setsById)
      : (matchAfter?.finalScore?.setsById || {});

    if (didApplyScore) {
      emitToMatchRoom(id, "server:change", {
        matchId: id,
        matchCategory: "individual",
        currentServerPlayerId:
          (matchAfter?.currentServerPlayerId as any)?.toString?.() || null,
        reason: "score_update",
        timestamp: new Date().toISOString(),
      });
    }

    if (didJustCompleteGame && completedGameWinnerId) {
      emitToMatchRoom(id, "game:completed", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        winnerId: completedGameWinnerId,
        scoresById,
        setsById,
        timestamp: new Date().toISOString(),
      });
    }

    if (didJustCompleteMatch && matchAfter?.status === "completed") {
      emitToMatchRoom(id, "match:completed", {
        matchId: id,
        matchCategory: "individual",
        winnerId: (matchAfter.winnerId as any)?.toString?.() || null,
        setsById,
        timestamp: new Date().toISOString(),
      });

      try {
        await statsService.updateIndividualMatchStats(id);
      } catch (statsError) {
        console.error("Error updating stats:", statsError);
      }

      if (matchAfter.tournament) {
        try {
          const updatedMatch = await IndividualMatch.findById(matchAfter._id);
          if (updatedMatch) {
            await updateTournamentAfterMatch(updatedMatch);
          }
        } catch (tournamentError) {
          console.error("[SCORE] ❌ Error updating tournament:", tournamentError);
        }
      }
    }

    if (emitShot) {
      emitToMatchRoom(id, "shot:recorded", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        shot: emitShot,
        timestamp: new Date().toISOString(),
      });
    }

    const scoreUpdatePayload: Record<string, unknown> = {
      matchId: id,
      matchCategory: "individual",
      gameNumber,
      scoresById,
      setsById,
      currentServerPlayerId:
        (matchAfter?.currentServerPlayerId as any)?.toString?.() || null,
      gameCompleted: currentGame?.status === "completed",
      gameWinnerId: (currentGame?.winnerId as any)?.toString?.() || null,
      timestamp: new Date().toISOString(),
    };

    emitToMatchRoom(id, "score:update", scoreUpdatePayload);

    const updatedMatchDoc = await IndividualMatch.findById(matchAfter?._id)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName profileImage");

    if (!updatedMatchDoc) {
      return NextResponse.json({ error: "Match not found after update" }, { status: 404 });
    }

    const updatedMatch = await applyShotsToLoadedMatch(updatedMatchDoc, "individual", true);

    return NextResponse.json({
      match: updatedMatch,
      message: matchAfter?.status === "completed" ? "Match completed!" : "Score updated",
    });
  } catch (err: any) {
    console.error("[matches/individual/[id]/score] Error:", err);
    return NextResponse.json(
      {
        error: "Failed to update score",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
      },
      { status: 500 }
    );
  }
}
