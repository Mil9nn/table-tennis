import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
// Register discriminators in order before route handlers run
import "@/models/MatchBase";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import Tournament from "@/models/Tournament";
import { emitToMatchRoom } from "@/lib/socketEmitter";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { canScoreTournamentMatch } from "@/lib/tournament-permissions";
import {
  applyShotsToLoadedMatch,
  deleteLastIndividualPointForScoringId,
  insertIndividualPoint,
} from "@/services/match/embeddedShotService";
import { getNextServer } from "@/services/match/serverCalculationService";

type ScoreMap = Map<string, number>;

function getParticipantIds(match: any): string[] {
  return (match.participants || []).map((p: any) => String(p?._id ?? p));
}

function getTeams(match: any): { players: string[] }[] | null {
  if (!match.teams || !Array.isArray(match.teams) || match.teams.length !== 2) return null;
  return match.teams.map((t: any) => ({
    players: (t.players || []).map((p: any) => String(p?._id ?? p)),
  }));
}

function findTeamIndex(teams: { players: string[] }[], playerId: string): number {
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].players.includes(playerId)) return i;
  }
  return -1;
}

function getScoresMap(game: any): ScoreMap {
  if (game.scoresById instanceof Map) return game.scoresById as ScoreMap;
  return new Map<string, number>(Object.entries(game.scoresById || {}));
}

function setScoresMap(game: any, map: ScoreMap): void {
  game.scoresById = map;
}

function syncGameTeamFields(game: any, teams: { players: string[] }[] | null, scores: ScoreMap): void {
  if (!teams) return;
  const t0Main = teams[0].players[0];
  const t1Main = teams[1].players[0];
  game.scoresByTeam = [
    Number(scores.get(t0Main) || 0),
    Number(scores.get(t1Main) || 0),
  ];
}

/** Keep in-memory shots aligned with $pull so match.save() does not restore deleted shots. */
function removeLastInMemoryShotForScoringId(game: any, scoringId: string): void {
  if (!Array.isArray(game?.shots)) return;
  for (let i = game.shots.length - 1; i >= 0; i--) {
    const shotSide = typeof game.shots[i]?.side === "string" ? game.shots[i].side : "";
    if (shotSide === scoringId) {
      game.shots.splice(i, 1);
      return;
    }
  }
}

const DOUBLES_POSITION_KEYS = [
  "side1_main",
  "side1_partner",
  "side2_main",
  "side2_partner",
] as const;

function idEq(a: unknown, b: unknown): boolean {
  return String(a) === String(b);
}

/** Left/right game totals: team mains, or legacy doubles anchors [0] vs [2]. */
function gameSidePointTotals(
  participantIds: string[],
  teams: { players: string[] }[] | null,
  scores: ScoreMap
): [number, number] {
  if (teams && teams.length === 2) {
    const t0Main = teams[0].players[0];
    const t1Main = teams[1].players[0];
    return [Number(scores.get(t0Main) || 0), Number(scores.get(t1Main) || 0)];
  }
  if (participantIds.length >= 4) {
    const s1 =
      Number(scores.get(participantIds[0]) || 0) +
      Number(scores.get(participantIds[1]) || 0);
    const s2 =
      Number(scores.get(participantIds[2]) || 0) +
      Number(scores.get(participantIds[3]) || 0);
    return [s1, s2];
  }
  if (participantIds.length >= 2) {
    const left = participantIds[0];
    const right = participantIds[1];
    return [Number(scores.get(left) || 0), Number(scores.get(right) || 0)];
  }
  return [0, 0];
}

function positionKeyFromParticipantId(
  participantIds: string[],
  playerId: string,
  matchType: string
): string {
  if (matchType !== "doubles") {
    if (idEq(participantIds[0], playerId)) return "side1";
    if (idEq(participantIds[1], playerId)) return "side2";
    return "side1";
  }
  for (let i = 0; i < 4; i++) {
    if (idEq(participantIds[i], playerId)) return DOUBLES_POSITION_KEYS[i];
  }
  return "side1_main";
}

function initialServerConfigForDoublesRotation(
  match: any,
  participantIds: string[]
): Parameters<typeof getNextServer>[3] {
  const sc = match.serverConfig as Record<string, unknown> | null | undefined;
  const isDoubles = match.matchType === "doubles";
  if (sc?.firstServer) {
    return {
      firstServer: sc.firstServer as any,
      firstReceiver:
        (sc.firstReceiver as any) ?? (isDoubles ? "side2_main" : null),
      serverOrder: sc.serverOrder as any,
    };
  }
  const fp = sc?.firstServerPlayerId;
  if (fp) {
    const firstServer = positionKeyFromParticipantId(
      participantIds,
      String(fp),
      match.matchType
    ) as any;
    const recvId = sc.firstReceiverPlayerId;
    const firstReceiver = isDoubles
      ? recvId
        ? (positionKeyFromParticipantId(
            participantIds,
            String(recvId),
            match.matchType
          ) as any)
        : "side2_main"
      : null;
    let serverOrder = sc.serverOrder as any;
    const orderIds = sc.serverOrderPlayerIds as unknown[] | undefined;
    if (
      isDoubles &&
      (!serverOrder || !Array.isArray(serverOrder)) &&
      Array.isArray(orderIds) &&
      orderIds.length === 4
    ) {
      serverOrder = orderIds.map((pid) =>
        positionKeyFromParticipantId(participantIds, String(pid), match.matchType)
      ) as any;
    }
    return { firstServer, firstReceiver, serverOrder };
  }
  return {
    firstServer: isDoubles ? "side1_main" : "side1",
    firstReceiver: isDoubles ? "side2_main" : null,
    serverOrder: undefined,
  };
}

function doublesServerKeyToPlayerId(
  participantIds: string[],
  serverKey: string
): string | null {
  const idx = (DOUBLES_POSITION_KEYS as readonly string[]).indexOf(serverKey);
  if (idx < 0 || idx >= participantIds.length) return null;
  return participantIds[idx] || null;
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

    // Simplified approach without unnecessary transaction
    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.status === "completed") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
    }

    const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);
    const participantIds = getParticipantIds(match);
    const teams = getTeams(match);
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
        shots: [],
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
      await deleteLastIndividualPointForScoringId(match._id, gameNumber, scoringId);
      removeLastInMemoryShotForScoringId(currentGame, scoringId);
      if (currentGame.winnerId) {
        const gameWinnerId = gameWinnerIdFromScores(scores);
        if (!gameWinnerId) {
          currentGame.winnerId = null;
          currentGame.status = "in_progress";
          currentGame.winnerTeamIndex = undefined;
        }
      }
      match.markModified("games");
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
      // For detailed mode, require stroke unless it's simple tracking from native app
      if (shotTrackingMode === "detailed" && (!body.shotData || !body.shotData.stroke)) {
        // Allow shots without stroke for simple tracking (native app)
        // Check if this is simple tracking by looking for null coordinates
        if (body.shotData && body.shotData.originX === null && body.shotData.originY === null) {
          console.log('Scoring API - Allowing simple tracking shot in detailed mode');
        } else {
          return NextResponse.json(
            {
              error: "Shot data is required when incrementing score. Every point must have a recorded shot.",
              details: "Score increased but no shot was provided",
            },
            { status: 400 }
          );
        }
      }
      // For simple tracking mode, allow shots without stroke/coordinates
      if (shotTrackingMode === "simple" && !body.shotData) {
        // Create minimal shot data for simple tracking
        body.shotData = {
          side: scoringId,
          player: scoringId,
          stroke: null,
          serveType: null,
          server: match.currentServerPlayerId || null,
          originX: null,
          originY: null,
          landingX: null,
          landingY: null,
        };
      }
      scores.set(scoringId, after);
      didApplyScore = true;
    }
    setScoresMap(currentGame, scores);
    syncGameTeamFields(currentGame, teams, scores);

    const gameWinnerId = gameWinnerIdFromScores(scores);
    const totalPoints = [...scores.values()].reduce((a, b) => a + b, 0);

    if (gameWinnerId && !currentGame.winnerId) {
      didJustCompleteGame = true;
      completedGameWinnerId = gameWinnerId;
      currentGame.winnerId = new mongoose.Types.ObjectId(gameWinnerId);
      currentGame.status = "completed";

      let setWinnerId = gameWinnerId;
      if (teams) {
        const winnerTeamIdx = findTeamIndex(teams, gameWinnerId);
        if (winnerTeamIdx >= 0) {
          currentGame.winnerTeamIndex = winnerTeamIdx;
          // For doubles, count set wins by team side anchor, not by whichever player scored last.
          setWinnerId = teams[winnerTeamIdx].players[0] || gameWinnerId;
        }
      }

      setsMap.set(setWinnerId, Number(setsMap.get(setWinnerId) || 0) + 1);
      match.finalScore.setsById = setsMap;

      if (teams) {
        const t0Main = teams[0].players[0];
        const t1Main = teams[1].players[0];
        match.finalScore.setsByTeam = [
          Number(setsMap.get(t0Main) || 0),
          Number(setsMap.get(t1Main) || 0),
        ];
      }

      let effectiveNumberOfSets =
        Number(match.numberOfSets) > 0 ? Number(match.numberOfSets) : 3;
      if (match.tournament) {
        const tournament = await Tournament.findById(match.tournament)
          .select("rules.setsPerMatch");
        const tournamentSetsPerMatch = Number(
          (tournament as any)?.rules?.setsPerMatch,
        );
        if (Number.isFinite(tournamentSetsPerMatch) && tournamentSetsPerMatch > 0) {
          effectiveNumberOfSets = tournamentSetsPerMatch;
          if (Number(match.numberOfSets) !== tournamentSetsPerMatch) {
            // Keep match config aligned with tournament rules to prevent
            // best-of drift on subsequent points and clients.
            match.numberOfSets = tournamentSetsPerMatch;
          }
        }
      }
      const setsNeeded = Math.ceil(effectiveNumberOfSets / 2);
      const wonSets = Number(setsMap.get(setWinnerId) || 0);
      const isMatchWon = wonSets >= setsNeeded;

      if (isMatchWon) {
        didJustCompleteMatch = true;
        match.status = "completed";
        match.winnerId = new mongoose.Types.ObjectId(setWinnerId);
        if (teams) {
          match.winnerTeamIndex = findTeamIndex(teams, gameWinnerId);
        }
        match.matchDuration =
          Date.now() -
          (match.startedAt?.getTime() || match.createdAt?.getTime() || Date.now());
      } else {
        match.currentGame = gameNumber + 1;
      }
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
      });

      emitShot = { ...stored, timestamp: stored.timestamp };

      const updatedGame = match.games.find((g: any) => g.gameNumber === gameNumber);
      if (updatedGame) {
        if (!Array.isArray(updatedGame.shots)) {
          updatedGame.shots = [];
        }
        updatedGame.shots.push(stored);
        match.markModified("games");
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
      match.markModified("games");
      match.markModified("statistics");
    } else if (didApplyScore && match.matchType === "doubles") {
      const rotationConfig = initialServerConfigForDoublesRotation(match, participantIds);

      let nextPlayerId: string | null = null;
      if (didJustCompleteMatch) {
        nextPlayerId = null;
      } else if (didJustCompleteGame) {
        const nextGameNum = gameNumber + 1;
        const srv = getNextServer(0, 0, true, rotationConfig, nextGameNum);
        nextPlayerId = doublesServerKeyToPlayerId(participantIds, String(srv.server));
      } else {
        const [p1, p2] = gameSidePointTotals(participantIds, teams, scores);
        const srv = getNextServer(p1, p2, true, rotationConfig, gameNumber);
        nextPlayerId = doublesServerKeyToPlayerId(participantIds, String(srv.server));
      }

      match.currentServerPlayerId = nextPlayerId
        ? new mongoose.Types.ObjectId(nextPlayerId)
        : null;
      match.markModified("games");
      match.markModified("statistics");
    }

    await match.save();

    
    // Use the match object we already have - it contains the shots
    const currentGameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);
    const currentGameObj = match.games.find((g: any) => g.gameNumber === currentGameNumber);
    
    const scoresById = currentGameObj?.scoresById instanceof Map
      ? Object.fromEntries(currentGameObj.scoresById)
      : (currentGameObj?.scoresById || {});
    const setsById = match.finalScore?.setsById instanceof Map
      ? Object.fromEntries(match.finalScore.setsById)
      : (match.finalScore?.setsById || {});

    if (didApplyScore) {
      emitToMatchRoom(id, "server:change", {
        matchId: id,
        matchCategory: "individual",
        currentServerPlayerId:
          (match.currentServerPlayerId as any)?.toString?.() || null,
        reason: "score_update",
        timestamp: new Date().toISOString(),
      });
    }

    if (didJustCompleteGame && completedGameWinnerId) {
      emitToMatchRoom(id, "game:completed", {
        matchId: id,
        matchCategory: "individual",
        gameNumber: currentGameNumber,
        winnerId: completedGameWinnerId,
        scoresById,
        setsById,
        timestamp: new Date().toISOString(),
      });
    }

    if (didJustCompleteMatch && match.status === "completed") {
      emitToMatchRoom(id, "match:completed", {
        matchId: id,
        matchCategory: "individual",
        winnerId: (match.winnerId as any)?.toString?.() || null,
        setsById,
        timestamp: new Date().toISOString(),
      });

      try {
        const { statsService } = await import("@/services/statsService");
        await statsService.updateIndividualMatchStats(id);
      } catch (statsError) {
        console.error("Error updating stats:", statsError);
      }

      if (match.tournament) {
        try {
          const { updateTournamentAfterMatch } = await import(
            "@/services/tournament/tournamentUpdateService"
          );
          await updateTournamentAfterMatch(match);
        } catch (tournamentError) {
          console.error("[SCORE] ❌ Error updating tournament:", tournamentError);
        }
      }
    }

    if (emitShot) {
      emitToMatchRoom(id, "shot:recorded", {
        matchId: id,
        matchCategory: "individual",
        gameNumber: currentGameNumber,
        shot: emitShot,
        timestamp: new Date().toISOString(),
      });
    }

    const [side1Score, side2Score] = gameSidePointTotals(
      participantIds,
      teams,
      getScoresMap(currentGameObj ?? {})
    );

    const scoreUpdatePayload: Record<string, unknown> = {
      matchId: id,
      matchCategory: "individual",
      gameNumber: currentGameNumber,
      side1Score,
      side2Score,
      scoresById,
      setsById,
      scoresByTeam: currentGameObj?.scoresByTeam ?? [side1Score, side2Score],
      setsByTeam: match.finalScore?.setsByTeam ?? undefined,
      currentServerPlayerId:
        (match.currentServerPlayerId as any)?.toString?.() || null,
      gameCompleted: currentGameObj?.status === "completed",
      gameWinnerId: (currentGameObj?.winnerId as any)?.toString?.() || null,
      winnerTeamIndex: match.winnerTeamIndex ?? undefined,
      timestamp: new Date().toISOString(),
    };

    emitToMatchRoom(id, "score:update", scoreUpdatePayload);

    const populatedMatch = await IndividualMatch.findById(match._id)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName profileImage");

    if (!populatedMatch) {
      return NextResponse.json({ error: "Match not found after update" }, { status: 404 });
    }

    const responseMatch = await applyShotsToLoadedMatch(
      populatedMatch,
      "individual",
      true
    );

    return NextResponse.json({
      match: responseMatch,
      message: match.status === "completed" ? "Match completed!" : "Score updated",
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
