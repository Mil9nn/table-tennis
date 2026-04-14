import mongoose, { ClientSession, Types } from "mongoose";
import MatchPoint from "@/models/MatchPoint";
import { User } from "@/models/User";
import type { MatchShotPayload } from "@/types/matchPoint.type";
import { decorateSinglesMatchForApi } from "@/lib/match/singlesCanonical";

const DEFAULT_USER_FIELDS = "username fullName profileImage";

function pointToShotPayload(p: Record<string, unknown>): MatchShotPayload {
  return {
    _id: p._id as Types.ObjectId,
    gameNumber: p.gameNumber as number | undefined,
    teamSubMatchId: p.teamSubMatchId as Types.ObjectId | undefined,
    shotNumber: p.shotNumber as number,
    side: p.side as MatchShotPayload["side"],
    player: p.player as Types.ObjectId,
    stroke: (p.stroke as string) ?? null,
    serveType: (p.serveType as string) ?? null,
    server: (p.server as Types.ObjectId) ?? null,
    originX: p.originX as number | undefined,
    originY: p.originY as number | undefined,
    landingX: p.landingX as number | undefined,
    landingY: p.landingY as number | undefined,
    timestamp: p.timestamp as Date,
  };
}

async function populateShotsPlayers(
  shots: MatchShotPayload[],
  userFields: string = DEFAULT_USER_FIELDS
): Promise<MatchShotPayload[]> {
  const ids = new Set<string>();
  for (const s of shots) {
    const pid = typeof s.player === "object" && s.player && "_id" in (s.player as object)
      ? String((s.player as { _id: unknown })._id)
      : String(s.player);
    ids.add(pid);
    if (s.server) {
      const sid =
        typeof s.server === "object" && s.server && "_id" in (s.server as object)
          ? String((s.server as { _id: unknown })._id)
          : String(s.server);
      ids.add(sid);
    }
  }
  if (ids.size === 0) return shots;
  const users = await User.find({ _id: { $in: [...ids] } })
    .select(userFields)
    .lean();
  const map = new Map(users.map((u) => [String(u._id), u]));
  return shots.map((s) => {
    const pId =
      typeof s.player === "object" && s.player && "_id" in (s.player as object)
        ? String((s.player as { _id: unknown })._id)
        : String(s.player);
    const sId = s.server
      ? typeof s.server === "object" && s.server && "_id" in (s.server as object)
        ? String((s.server as { _id: unknown })._id)
        : String(s.server)
      : null;
    return {
      ...s,
      player: (map.get(pId) as unknown as MatchShotPayload["player"]) ?? s.player,
      server: sId ? ((map.get(sId) as unknown as MatchShotPayload["server"]) ?? s.server) : null,
    };
  });
}

export async function getNextShotNumber(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  teamSubMatchId: Types.ObjectId | null,
  session?: ClientSession | null
): Promise<number> {
  const filter: Record<string, unknown> = {
    match: matchId,
    gameNumber,
    teamSubMatchId: teamSubMatchId ?? null,
  };
  let agg = MatchPoint.aggregate<{ maxN: number }>([
    { $match: filter },
    { $group: { _id: null, maxN: { $max: "$shotNumber" } } },
  ]);
  if (session) agg = agg.session(session);
  const rows = await agg.exec();
  const max = rows[0]?.maxN;
  return typeof max === "number" ? max + 1 : 1;
}

export async function insertIndividualPoint(
  params: {
    matchId: string | Types.ObjectId;
    gameNumber: number;
    shot: Omit<MatchShotPayload, "_id"> & { player: Types.ObjectId | string; server?: Types.ObjectId | string | null };
    session?: ClientSession | null;
  }
): Promise<MatchShotPayload> {
  const { matchId, gameNumber, shot, session } = params;
  const shotNumber = await getNextShotNumber(matchId, gameNumber, null, session ?? null);
  const doc = await MatchPoint.create(
    [
      {
        match: matchId,
        matchCategory: "individual",
        teamSubMatchId: null,
        gameNumber,
        shotNumber,
        side: shot.side,
        player: new Types.ObjectId(String(shot.player)),
        stroke: shot.stroke ?? null,
        serveType: shot.serveType ?? null,
        server: shot.server ? new Types.ObjectId(String(shot.server)) : null,
        originX: shot.originX,
        originY: shot.originY,
        landingX: shot.landingX,
        landingY: shot.landingY,
        timestamp: shot.timestamp ? new Date(shot.timestamp) : new Date(),
      },
    ],
    { session: session ?? undefined }
  );
  const plain = doc[0].toObject();
  return pointToShotPayload(plain as Record<string, unknown>);
}

export async function insertTeamPoint(
  params: {
    matchId: string | Types.ObjectId;
    teamSubMatchId: Types.ObjectId;
    gameNumber: number;
    shot: Omit<MatchShotPayload, "_id"> & { player: Types.ObjectId | string; server?: Types.ObjectId | string | null };
    session?: ClientSession | null;
  }
): Promise<MatchShotPayload> {
  const { matchId, teamSubMatchId, gameNumber, shot, session } = params;
  const shotNumber = await getNextShotNumber(matchId, gameNumber, teamSubMatchId, session ?? null);
  const doc = await MatchPoint.create(
    [
      {
        match: matchId,
        matchCategory: "team",
        teamSubMatchId,
        gameNumber,
        shotNumber,
        side: shot.side,
        player: new Types.ObjectId(String(shot.player)),
        stroke: shot.stroke ?? null,
        serveType: shot.serveType ?? null,
        server: shot.server ? new Types.ObjectId(String(shot.server)) : null,
        originX: shot.originX,
        originY: shot.originY,
        landingX: shot.landingX,
        landingY: shot.landingY,
        timestamp: shot.timestamp ? new Date(shot.timestamp) : new Date(),
      },
    ],
    { session: session ?? undefined }
  );
  const plain = doc[0].toObject();
  return pointToShotPayload(plain as Record<string, unknown>);
}

export async function deleteLastIndividualPointForSide(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  side: string,
  session?: ClientSession | null
): Promise<void> {
  let q = MatchPoint.findOne({
    match: matchId,
    gameNumber,
    teamSubMatchId: null,
    side,
  })
    .sort({ shotNumber: -1 })
    .select("_id");
  if (session) q = q.session(session);
  const last = await q;

  if (last) {
    await MatchPoint.deleteOne({ _id: last._id }, session ? { session } : {});
  }
}

export async function deleteLastIndividualPointForScoringId(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  scoringId: string,
  session?: ClientSession | null
): Promise<void> {
  let q = MatchPoint.findOne({
    match: matchId,
    gameNumber,
    teamSubMatchId: null,
    side: scoringId,
  })
    .sort({ shotNumber: -1 })
    .select("_id");
  if (session) q = q.session(session);
  const last = await q;

  if (last) {
    await MatchPoint.deleteOne({ _id: last._id }, session ? { session } : {});
  }
}

export async function deleteLastTeamPointForSide(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  gameNumber: number,
  side: string,
  session?: ClientSession | null
): Promise<void> {
  let q = MatchPoint.findOne({
    match: matchId,
    teamSubMatchId,
    gameNumber,
    side,
  })
    .sort({ shotNumber: -1 })
    .select("_id");
  if (session) q = q.session(session);
  const last = await q;

  if (last) {
    await MatchPoint.deleteOne({ _id: last._id }, session ? { session } : {});
  }
}

export async function deleteAllPointsForMatch(
  matchId: string | Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await MatchPoint.deleteMany({ match: matchId }, session ? { session } : {});
}

export async function deleteAllPointsForIndividualMatch(
  matchId: string | Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await MatchPoint.deleteMany(
    {
      match: matchId,
      matchCategory: "individual",
    },
    session ? { session } : {}
  );
}

export async function deleteAllPointsForTeamSubMatch(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await MatchPoint.deleteMany(
    {
      match: matchId,
      matchCategory: "team",
      teamSubMatchId,
    },
    session ? { session } : {}
  );
}

export async function deletePointsForIndividualGame(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<void> {
  await MatchPoint.deleteMany(
    {
      match: matchId,
      teamSubMatchId: null,
      gameNumber,
    },
    session ? { session } : {}
  );
}

export async function deletePointsForTeamGame(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<void> {
  await MatchPoint.deleteMany(
    {
      match: matchId,
      teamSubMatchId,
      gameNumber,
    },
    session ? { session } : {}
  );
}

/** Attach `matchpoints` onto each game as `shots` (API / analytics; not persisted on match docs). */
export async function mergeShotsIntoIndividualGames(
  matchPlain: Record<string, any>,
  userFields: string = DEFAULT_USER_FIELDS
): Promise<void> {
  const matchId = matchPlain._id;
  if (!matchId) return;

  const points = await MatchPoint.find({
    match: matchId,
    matchCategory: "individual",
  })
    .sort({ gameNumber: 1, shotNumber: 1 })
    .lean();

  const byGame = new Map<number, MatchShotPayload[]>();
  for (const p of points) {
    const arr = byGame.get(p.gameNumber) ?? [];
    arr.push(pointToShotPayload(p as Record<string, unknown>));
    byGame.set(p.gameNumber, arr);
  }

  const games = matchPlain.games || [];
  for (const g of games) {
    const gn = g.gameNumber;
    const fromColl = byGame.get(gn) ?? [];
    g.shots =
      fromColl.length > 0 ? await populateShotsPlayers(fromColl, userFields) : [];
  }
}

export async function mergeShotsIntoTeamMatch(
  matchPlain: Record<string, any>,
  userFields: string = DEFAULT_USER_FIELDS
): Promise<void> {
  const matchId = matchPlain._id;
  if (!matchId) return;

  const points = await MatchPoint.find({
    match: matchId,
    matchCategory: "team",
  })
    .sort({ gameNumber: 1, shotNumber: 1 })
    .lean();

  const key = (subId: string, gn: number) => `${subId}::${gn}`;
  const bySubGame = new Map<string, MatchShotPayload[]>();
  for (const p of points) {
    const sid = p.teamSubMatchId?.toString() ?? "";
    const k = key(sid, p.gameNumber);
    const arr = bySubGame.get(k) ?? [];
    arr.push(pointToShotPayload(p as Record<string, unknown>));
    bySubGame.set(k, arr);
  }

  const subMatches = matchPlain.subMatches || [];
  for (const sm of subMatches) {
    const smId = sm._id?.toString() ?? "";
    const games = sm.games || [];
    for (const g of games) {
      const gn = g.gameNumber;
      const fromColl = bySubGame.get(key(smId, gn)) ?? [];
      g.shots =
        fromColl.length > 0 ? await populateShotsPlayers(fromColl, userFields) : [];
    }
  }
}

export async function listIndividualPoints(
  matchId: string,
  gameNumber?: number
): Promise<MatchShotPayload[]> {
  const q: Record<string, unknown> = {
    match: matchId,
    matchCategory: "individual",
  };
  if (typeof gameNumber === "number") q.gameNumber = gameNumber;

  const points = await MatchPoint.find(q).sort({ gameNumber: 1, shotNumber: 1 }).lean();
  const payloads = points.map((p) => pointToShotPayload(p as Record<string, unknown>));
  return populateShotsPlayers(payloads);
}

export async function listTeamSubMatchPoints(
  matchId: string,
  teamSubMatchId: string,
  gameNumber?: number
): Promise<MatchShotPayload[]> {
  const q: Record<string, unknown> = {
    match: matchId,
    matchCategory: "team",
    teamSubMatchId: new Types.ObjectId(teamSubMatchId),
  };
  if (typeof gameNumber === "number") q.gameNumber = gameNumber;

  const points = await MatchPoint.find(q).sort({ gameNumber: 1, shotNumber: 1 }).lean();
  const payloads = points.map((p) => pointToShotPayload(p as Record<string, unknown>));
  return populateShotsPlayers(payloads);
}

/** Bulk-load points for many individual matches (analytics). */
export async function fetchIndividualPointsByMatchIds(
  matchIds: Types.ObjectId[]
): Promise<Map<string, MatchShotPayload[]>> {
  if (matchIds.length === 0) return new Map();
  const points = await MatchPoint.find({
    match: { $in: matchIds },
    matchCategory: "individual",
  })
    .sort({ gameNumber: 1, shotNumber: 1 })
    .lean();

  const map = new Map<string, MatchShotPayload[]>();
  for (const p of points) {
    const id = String(p.match);
    const arr = map.get(id) ?? [];
    arr.push(pointToShotPayload(p as Record<string, unknown>));
    map.set(id, arr);
  }
  return map;
}

/** Bulk-load points for many team matches */
export async function fetchTeamPointsByMatchIds(
  matchIds: Types.ObjectId[]
): Promise<Map<string, MatchShotPayload[]>> {
  if (matchIds.length === 0) return new Map();
  const points = await MatchPoint.find({
    match: { $in: matchIds },
    matchCategory: "team",
  })
    .sort({ gameNumber: 1, shotNumber: 1 })
    .lean();

  const map = new Map<string, MatchShotPayload[]>();
  for (const p of points) {
    const id = String(p.match);
    const arr = map.get(id) ?? [];
    arr.push(pointToShotPayload(p as Record<string, unknown>));
    map.set(id, arr);
  }
  return map;
}

/** Strip or merge `matchpoints` into a match plain object for API responses. */
export async function applyShotsToLoadedMatch(
  matchDoc: any,
  category: "individual" | "team",
  includeShots: boolean,
  userFields: string = DEFAULT_USER_FIELDS
): Promise<Record<string, unknown>> {
  const plain =
    typeof matchDoc?.toObject === "function"
      ? matchDoc.toObject({
          virtuals: true,
          getters: true,
        })
      : { ...matchDoc };

  if (!includeShots) {
    if (category === "individual") {
      for (const g of (plain.games as Record<string, unknown>[]) || []) {
        g.shots = [];
      }
      decorateSinglesMatchForApi(plain as Record<string, unknown>);
    } else {
      for (const sm of (plain.subMatches as Record<string, unknown>[]) || []) {
        for (const g of (sm.games as Record<string, unknown>[]) || []) {
          g.shots = [];
        }
      }
    }
    return plain;
  }

  if (category === "individual") {
    await mergeShotsIntoIndividualGames(plain, userFields);
    decorateSinglesMatchForApi(plain as Record<string, unknown>);
  } else {
    await mergeShotsIntoTeamMatch(plain, userFields);
  }
  return plain;
}

/** Attach flat per-match points onto `games[].shots` for legacy analytics code. */
export function applyFlatPointsToIndividualMatchGames(
  match: Record<string, unknown>,
  points: MatchShotPayload[]
): void {
  const byGame = new Map<number, MatchShotPayload[]>();
  for (const p of points) {
    const gn = p.gameNumber;
    if (typeof gn !== "number") continue;
    const arr = byGame.get(gn) ?? [];
    arr.push(p);
    byGame.set(gn, arr);
  }
  for (const g of (match.games as Record<string, unknown>[]) || []) {
    const gn = g.gameNumber as number;
    const list = byGame.get(gn);
    if (list && list.length > 0) {
      g.shots = list;
    }
  }
}

/** Team: key by subMatch _id string + gameNumber */
export function applyFlatPointsToTeamMatchGames(
  match: Record<string, unknown>,
  points: MatchShotPayload[]
): void {
  const byKey = new Map<string, MatchShotPayload[]>();
  for (const p of points) {
    const sid = p.teamSubMatchId ? String(p.teamSubMatchId) : "";
    const gn = p.gameNumber;
    if (!sid || typeof gn !== "number") continue;
    const k = `${sid}::${gn}`;
    const arr = byKey.get(k) ?? [];
    arr.push(p);
    byKey.set(k, arr);
  }
  for (const sm of (match.subMatches as Record<string, unknown>[]) || []) {
    const smId = (sm._id as Types.ObjectId)?.toString?.() ?? "";
    for (const g of (sm.games as Record<string, unknown>[]) || []) {
      const gn = g.gameNumber as number;
      const list = byKey.get(`${smId}::${gn}`);
      if (list && list.length > 0) {
        g.shots = list;
      }
    }
  }
}

/** Bulk-hydrate `games[].shots` from `matchpoints` (ObjectId players; no User populate). */
export async function hydrateIndividualMatchesWithPoints(
  matches: Record<string, unknown>[]
): Promise<void> {
  if (!matches.length) return;
  const ids = matches.map((m) => m._id).filter(Boolean) as Types.ObjectId[];
  const map = await fetchIndividualPointsByMatchIds(ids);
  for (const m of matches) {
    applyFlatPointsToIndividualMatchGames(m, map.get(String(m._id)) ?? []);
  }
}

export async function hydrateTeamMatchesWithPoints(
  matches: Record<string, unknown>[]
): Promise<void> {
  if (!matches.length) return;
  const ids = matches.map((m) => m._id).filter(Boolean) as Types.ObjectId[];
  const map = await fetchTeamPointsByMatchIds(ids);
  for (const m of matches) {
    applyFlatPointsToTeamMatchGames(m, map.get(String(m._id)) ?? []);
  }
}
