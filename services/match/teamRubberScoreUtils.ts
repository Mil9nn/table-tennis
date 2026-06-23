/**
 * Helpers for team rubber games using id-based `scoresById` (see createIdBasedGameSchema).
 */

type ScoreMap = Map<string, number>;

function toId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    const obj = raw as { _id?: unknown; $oid?: unknown; toString?: () => string };
    if (obj.$oid != null) return String(obj.$oid);
    if (obj._id != null) {
      const id = obj._id as { toString?: () => string };
      return typeof id === "object" && typeof id.toString === "function"
        ? id.toString()
        : String(id);
    }
    const s = obj.toString?.();
    if (s && s !== "[object Object]") return s;
  }
  return String(raw);
}

/** Anchor player ids used for aggregate team1/team2 point totals in a rubber. */
export function getRubberAnchorPlayerIds(subMatch: {
  playerTeam1?: unknown;
  playerTeam2?: unknown;
}): { team1PlayerId: string; team2PlayerId: string } {
  const t1Raw = subMatch.playerTeam1;
  const t2Raw = subMatch.playerTeam2;
  const t1 = Array.isArray(t1Raw) ? t1Raw[0] : t1Raw;
  const t2 = Array.isArray(t2Raw) ? t2Raw[0] : t2Raw;
  return {
    team1PlayerId: toId(t1),
    team2PlayerId: toId(t2),
  };
}

export function getScoresMap(game: {
  scoresById?: ScoreMap | Record<string, number>;
}): ScoreMap {
  if (game.scoresById instanceof Map) return game.scoresById;
  return new Map(Object.entries(game.scoresById || {}));
}

export function setScoresMap(
  game: { scoresById?: ScoreMap | Record<string, number> },
  map: ScoreMap
): void {
  game.scoresById = map;
}

export function readRubberTeamScores(
  game: {
    scoresById?: ScoreMap | Record<string, number>;
    team1Score?: number;
    team2Score?: number;
  },
  team1PlayerId: string,
  team2PlayerId: string
): { team1Score: number; team2Score: number } {
  if (game.team1Score != null || game.team2Score != null) {
    return {
      team1Score: Number(game.team1Score ?? 0),
      team2Score: Number(game.team2Score ?? 0),
    };
  }
  const map = getScoresMap(game);
  return {
    team1Score: Number(map.get(team1PlayerId) ?? 0),
    team2Score: Number(map.get(team2PlayerId) ?? 0),
  };
}

export function writeRubberTeamScores(
  game: { scoresById?: ScoreMap | Record<string, number> },
  team1PlayerId: string,
  team2PlayerId: string,
  team1Score: number,
  team2Score: number
): void {
  const map = getScoresMap(game);
  if (team1PlayerId) map.set(team1PlayerId, team1Score);
  if (team2PlayerId) map.set(team2PlayerId, team2Score);
  setScoresMap(game, map);
}

export function createEmptyRubberGame(
  gameNumber: number,
  team1PlayerId: string,
  team2PlayerId: string
): {
  gameNumber: number;
  scoresById: ScoreMap;
  winnerId: null;
  status: "in_progress";
  shots: [];
} {
  const scoresById = new Map<string, number>();
  if (team1PlayerId) scoresById.set(team1PlayerId, 0);
  if (team2PlayerId) scoresById.set(team2PlayerId, 0);
  return {
    gameNumber,
    scoresById,
    winnerId: null,
    status: "in_progress",
    shots: [],
  };
}

/** Add legacy team1Score/team2Score/winnerSide on games for API clients. */
export function decorateTeamRubberGamesForApi(matchPlain: Record<string, unknown>): void {
  const team1EntityId = toId((matchPlain.team1 as { _id?: unknown })?._id);
  const team2EntityId = toId((matchPlain.team2 as { _id?: unknown })?._id);

  if (
    matchPlain.numberOfGamesPerRubber != null &&
    matchPlain.numberOfSetsPerSubMatch == null
  ) {
    matchPlain.numberOfSetsPerSubMatch = matchPlain.numberOfGamesPerRubber;
  }

  for (const sm of (matchPlain.subMatches as Record<string, unknown>[]) || []) {
    if (sm.numberOfGames != null && sm.numberOfSets == null) {
      sm.numberOfSets = sm.numberOfGames;
    }

    const fs = (sm.finalScore as Record<string, unknown>) || {};
    const gamesMap =
      fs.scoresByTeamId instanceof Map
        ? fs.scoresByTeamId
        : new Map(Object.entries((fs.scoresByTeamId as Record<string, number>) || {}));
    const team1Games =
      fs.team1Games != null
        ? Number(fs.team1Games)
        : team1EntityId
          ? Number(gamesMap.get(team1EntityId) || 0)
          : 0;
    const team2Games =
      fs.team2Games != null
        ? Number(fs.team2Games)
        : team2EntityId
          ? Number(gamesMap.get(team2EntityId) || 0)
          : 0;
    sm.finalScore = {
      ...fs,
      team1Games,
      team2Games,
      team1Sets: fs.team1Sets != null ? fs.team1Sets : team1Games,
      team2Sets: fs.team2Sets != null ? fs.team2Sets : team2Games,
    };

    const { team1PlayerId, team2PlayerId } = getRubberAnchorPlayerIds(
      sm as { playerTeam1?: unknown; playerTeam2?: unknown }
    );
    for (const g of (sm.games as Record<string, unknown>[]) || []) {
      const { team1Score, team2Score } = readRubberTeamScores(
        g as { scoresById?: ScoreMap | Record<string, number> },
        team1PlayerId,
        team2PlayerId
      );
      g.team1Score = team1Score;
      g.team2Score = team2Score;
      if (g.winnerId && team1PlayerId && team2PlayerId) {
        const wid = toId(g.winnerId);
        g.winnerSide =
          wid === team1PlayerId ? "team1" : wid === team2PlayerId ? "team2" : null;
      }
      g.completed = g.status === "completed";
    }
  }
}
