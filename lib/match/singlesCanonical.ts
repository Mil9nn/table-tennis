import mongoose from "mongoose";

/**
 * Singles matches: canonical storage uses player ObjectIds as keys (scores per game,
 * sets won per player, match winner). Legacy side1/side2 fields stay in sync for
 * existing code paths (server rotation, tournaments, stats).
 */

export function getSinglesParticipantIds(participants: unknown[]): [string, string] | null {
  if (!participants || participants.length < 2) return null;
  const raw0 = participants[0] as { _id?: unknown } | string;
  const raw1 = participants[1] as { _id?: unknown } | string;
  const p0 =
    typeof raw0 === "string"
      ? raw0
      : raw0?._id != null
        ? String(raw0._id)
        : null;
  const p1 =
    typeof raw1 === "string"
      ? raw1
      : raw1?._id != null
        ? String(raw1._id)
        : null;
  if (!p0 || !p1) return null;
  return [p0, p1];
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

/**
 * Mutates a singles IndividualMatch document so legacy side fields and canonical
 * player-keyed fields agree. Call from pre('save') and after loading legacy docs.
 */
export function syncSinglesCanonicalAndLegacy(doc: mongoose.Document & Record<string, unknown>): void {
  if (doc.matchType !== "singles") return;

  const ids = getSinglesParticipantIds((doc.participants as unknown[]) || []);
  if (!ids) return;
  const [p0, p1] = ids;

  doc.finalScore = (doc.finalScore || {}) as Record<string, unknown>;
  const fs = doc.finalScore as {
    side1Sets?: number;
    side2Sets?: number;
    sets?: Map<string, number> | Record<string, number>;
  };

  fs.side1Sets = Number(fs.side1Sets ?? 0);
  fs.side2Sets = Number(fs.side2Sets ?? 0);

  let setsMap: Map<string, number>;
  if (fs.sets instanceof Map) {
    setsMap = fs.sets;
  } else if (fs.sets && typeof fs.sets === "object") {
    setsMap = new Map(Object.entries(fs.sets as Record<string, number>));
  } else {
    setsMap = new Map<string, number>();
  }

  if (setsMap.size === 0) {
    setsMap.set(p0, fs.side1Sets);
    setsMap.set(p1, fs.side2Sets);
  } else {
    fs.side1Sets = setsMap.has(p0) ? Number(setsMap.get(p0)) : fs.side1Sets;
    fs.side2Sets = setsMap.has(p1) ? Number(setsMap.get(p1)) : fs.side2Sets;
    setsMap.set(p0, fs.side1Sets);
    setsMap.set(p1, fs.side2Sets);
  }
  fs.sets = setsMap;
  doc.markModified("finalScore");
  doc.markModified("finalScore.sets");

  const games = (doc.games || []) as Record<string, unknown>[];
  for (const g of games) {
    let scoreMap: Map<string, number>;
    if (g.scores instanceof Map) {
      scoreMap = g.scores as Map<string, number>;
    } else if (g.scores && typeof g.scores === "object") {
      scoreMap = new Map(Object.entries(g.scores as Record<string, number>));
    } else {
      scoreMap = new Map<string, number>();
    }

    const s1 = Number(g.side1Score ?? 0);
    const s2 = Number(g.side2Score ?? 0);

    if (scoreMap.size === 0) {
      scoreMap.set(p0, s1);
      scoreMap.set(p1, s2);
    } else {
      g.side1Score = scoreMap.has(p0) ? Number(scoreMap.get(p0)) : s1;
      g.side2Score = scoreMap.has(p1) ? Number(scoreMap.get(p1)) : s2;
      scoreMap.set(p0, Number(g.side1Score));
      scoreMap.set(p1, Number(g.side2Score));
    }
    g.scores = scoreMap;

    const completed = Boolean(g.completed);
    const wSide = g.winnerSide as string | null | undefined;
    let wPid = g.winnerPlayerId as mongoose.Types.ObjectId | undefined;

    if (wSide === "side1" || wSide === "side2") {
      if (!wPid) {
        wPid = toObjectId(wSide === "side1" ? p0 : p1);
        g.winnerPlayerId = wPid;
      }
    } else if (wPid) {
      const ws = wPid.toString();
      g.winnerSide = ws === p0 ? "side1" : ws === p1 ? "side2" : g.winnerSide;
    } else if (completed) {
      const a = Number(g.side1Score);
      const b = Number(g.side2Score);
      if ((a >= 11 || b >= 11) && Math.abs(a - b) >= 2) {
        const winSide = a > b ? "side1" : "side2";
        g.winnerSide = winSide;
        g.winnerPlayerId = toObjectId(winSide === "side1" ? p0 : p1);
      }
    }
  }
  doc.markModified("games");

  const winnerSide = doc.winnerSide as string | null | undefined;
  let winner = doc.winner as mongoose.Types.ObjectId | undefined;

  if (winnerSide === "side1" || winnerSide === "side2") {
    if (!winner) {
      winner = toObjectId(winnerSide === "side1" ? p0 : p1);
      doc.winner = winner;
    }
  } else if (winner) {
    const ws = winner.toString();
    doc.winnerSide = ws === p0 ? "side1" : ws === p1 ? "side2" : doc.winnerSide;
  }

  const cs = doc.currentServer as string | null | undefined;
  if (cs === "side1" || cs === "side2") {
    doc.currentServerPlayer = toObjectId(cs === "side1" ? p0 : p1);
  } else if (cs && mongoose.Types.ObjectId.isValid(cs) && String(cs).length === 24) {
    doc.currentServerPlayer = toObjectId(String(cs));
    const cid = String(cs);
    doc.currentServer = cid === p0 ? "side1" : cid === p1 ? "side2" : doc.currentServer;
  }

  doc.markModified("winner");
  doc.markModified("currentServerPlayer");
}

/**
 * Plain object (e.g. API / lean): attach serializable `scores` objects and string ids.
 */
export function decorateSinglesMatchForApi(plain: Record<string, unknown>): void {
  if (plain.matchType !== "singles") return;
  const participants = plain.participants as unknown[] | undefined;
  const ids = getSinglesParticipantIds(participants || []);
  if (!ids) return;
  const [p0, p1] = ids;

  const fs = plain.finalScore as Record<string, unknown> | undefined;
  if (fs?.sets instanceof Map) {
    fs.sets = Object.fromEntries(fs.sets as Map<string, number>);
  }
  if (fs && typeof fs === "object" && fs.setsByPlayerId === undefined) {
    const setsObj =
      fs.sets && typeof fs.sets === "object" && !(fs.sets instanceof Map)
        ? (fs.sets as Record<string, number>)
        : null;
    if (setsObj && Object.keys(setsObj).length > 0) {
      fs.setsByPlayerId = { ...setsObj };
    } else if (fs.side1Sets !== undefined || fs.side2Sets !== undefined) {
      fs.setsByPlayerId = {
        [p0]: Number(fs.side1Sets ?? 0),
        [p1]: Number(fs.side2Sets ?? 0),
      };
    }
  }

  const games = (plain.games || []) as Record<string, unknown>[];
  for (const g of games) {
    if (g.scores instanceof Map) {
      g.scores = Object.fromEntries(g.scores as Map<string, number>);
    }
    const sc = g.scores as Record<string, number> | undefined;
    if (sc && typeof sc === "object" && !(sc instanceof Map)) {
      g.scoresByPlayerId = { ...sc };
    } else if (g.side1Score !== undefined || g.side2Score !== undefined) {
      g.scoresByPlayerId = {
        [p0]: Number(g.side1Score ?? 0),
        [p1]: Number(g.side2Score ?? 0),
      };
    }
    if (g.winnerPlayerId) {
      g.winner = (g.winnerPlayerId as { toString?: () => string }).toString?.() ?? String(g.winnerPlayerId);
    } else if (g.winnerSide === "side1" || g.winnerSide === "side2") {
      g.winner = g.winnerSide === "side1" ? p0 : p1;
    }
  }

  if (plain.winner) {
    plain.winnerPlayerId =
      (plain.winner as { toString?: () => string }).toString?.() ?? String(plain.winner);
  } else if (plain.winnerSide === "side1" || plain.winnerSide === "side2") {
    plain.winnerPlayerId = plain.winnerSide === "side1" ? p0 : p1;
  }

  if (plain.currentServerPlayer) {
    plain.currentServerPlayerId =
      (plain.currentServerPlayer as { toString?: () => string }).toString?.() ??
      String(plain.currentServerPlayer);
  }
}
