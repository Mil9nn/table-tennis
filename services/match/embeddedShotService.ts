import mongoose, { ClientSession, Types } from "mongoose";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import type { EmbeddedShot } from "@/types/match.type";
import { User } from "@/models/User";

const DEFAULT_USER_FIELDS = "username fullName profileImage";

/**
 * Service for managing embedded shots in match game documents
 * Replaces the separate MatchPoint collection approach
 */

async function populateShotsPlayers(
  shots: EmbeddedShot[],
  userFields: string = DEFAULT_USER_FIELDS
): Promise<EmbeddedShot[]> {
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
      player: (map.get(pId) as unknown as EmbeddedShot["player"]) ?? s.player,
      server: sId ? ((map.get(sId) as unknown as EmbeddedShot["server"]) ?? s.server) : null,
    };
  });
}

export async function getNextShotNumber(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<number> {
  const filter: Record<string, unknown> = {
    _id: matchId,
    "games.gameNumber": gameNumber,
  };
  
  let agg = IndividualMatch.aggregate([
    { $match: filter },
    { $unwind: "$games" },
    { $match: { "games.gameNumber": gameNumber } },
    { $project: { maxShotNumber: { $max: "$games.shots.shotNumber" } } }
  ]);
  
  if (session) agg = agg.session(session);
  const rows = await agg.exec();
  const max = rows[0]?.maxShotNumber;
  return typeof max === "number" ? max + 1 : 1;
}

export async function insertIndividualPoint(
  params: {
    matchId: string | Types.ObjectId;
    gameNumber: number;
    shot: Omit<EmbeddedShot, "shotNumber"> & { player: Types.ObjectId | string; server?: Types.ObjectId | string | null };
    session?: ClientSession | null;
  }
): Promise<EmbeddedShot> {
  const { matchId, gameNumber, shot, session } = params;
  const shotNumber = await getNextShotNumber(matchId, gameNumber, session ?? null);
  
  const newShot: EmbeddedShot = {
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
  };

  // Assign _id to ensure it's returned
  (newShot as any)._id = new Types.ObjectId();

  // Use positional operator with explicit game filter for more reliable update
  await IndividualMatch.updateOne(
    { 
      _id: matchId, 
      "games.gameNumber": gameNumber 
    }, 
    { 
      $push: { "games.$.shots": newShot } 
    },
    { session: session ?? undefined }
  );
  return newShot;
}

export async function deleteLastIndividualPointForSide(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  side: string,
  session?: ClientSession | null
): Promise<void> {
  const match = await IndividualMatch.findById(matchId).session(session ?? undefined);
  if (!match) return;

  const game = match.games.find(g => g.gameNumber === gameNumber);
  if (!game || !game.shots) return;

  // Find the last shot for this side
  const sideShots = game.shots.filter(shot => shot.side === side);
  if (sideShots.length === 0) return;

  const lastShot = sideShots[sideShots.length - 1];
  
  await IndividualMatch.updateOne(
    { 
      _id: matchId,
      "games.gameNumber": gameNumber
    },
    { 
      $pull: {
        "games.$.shots": { shotNumber: lastShot.shotNumber }
      }
    },
    { session: session ?? undefined }
  );
}

export async function deleteLastIndividualPointForScoringId(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  scoringId: string,
  session?: ClientSession | null
): Promise<void> {
  // For individual matches, scoringId is the same as side
  await deleteLastIndividualPointForSide(matchId, gameNumber, scoringId, session);
}

export async function deleteAllPointsForIndividualMatch(
  matchId: string | Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await IndividualMatch.updateOne(
    { _id: matchId },
    { $set: { "games.$[].shots": [] } },
    { session: session ?? undefined }
  );
}

export async function deletePointsForIndividualGame(
  matchId: string | Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<void> {
  await IndividualMatch.updateOne(
    { 
      _id: matchId,
      "games.gameNumber": gameNumber
    },
    { $set: { "games.$.shots": [] } },
    { session: session ?? undefined }
  );
}

export async function listIndividualPoints(
  matchId: string,
  gameNumber?: number
): Promise<EmbeddedShot[]> {
  const match = await IndividualMatch.findById(matchId).lean();
  if (!match) return [];

  let shots: EmbeddedShot[] = [];
  
  if (typeof gameNumber === "number") {
    const game = match.games.find(g => g.gameNumber === gameNumber);
    shots = game?.shots || [];
  } else {
    // Get shots from all games, sorted by gameNumber and shotNumber
    shots = match.games.flatMap(g => 
      (g.shots || []).map(shot => ({ ...shot, gameNumber: g.gameNumber }))
    ).sort((a, b) => {
      if (a.gameNumber !== b.gameNumber) return a.gameNumber - b.gameNumber;
      return a.shotNumber - b.shotNumber;
    });
  }

  return populateShotsPlayers(shots);
}

async function populateEmbeddedShotsOnGames(
  games: Record<string, unknown>[] | undefined,
  userFields: string
): Promise<void> {
  for (const g of games || []) {
    if (g.shots && Array.isArray(g.shots)) {
      g.shots = await populateShotsPlayers(g.shots as EmbeddedShot[], userFields);
    }
  }
}

/** Apply shots to loaded match — populate player refs on embedded `games[].shots`. */
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

  if (includeShots) {
    if (category === "individual") {
      await populateEmbeddedShotsOnGames(
        plain.games as Record<string, unknown>[] | undefined,
        userFields
      );
    } else {
      for (const sm of (plain.subMatches as Record<string, unknown>[]) || []) {
        await populateEmbeddedShotsOnGames(
          sm.games as Record<string, unknown>[] | undefined,
          userFields
        );
      }
      const { decorateTeamRubberGamesForApi } = await import("./teamRubberScoreUtils");
      decorateTeamRubberGamesForApi(plain);
    }
  } else if (category === "individual") {
    for (const g of (plain.games as Record<string, unknown>[]) || []) {
      g.shots = [];
    }
  } else {
    for (const sm of (plain.subMatches as Record<string, unknown>[]) || []) {
      for (const g of (sm.games as Record<string, unknown>[]) || []) {
        g.shots = [];
      }
    }
    const { decorateTeamRubberGamesForApi } = await import("./teamRubberScoreUtils");
    decorateTeamRubberGamesForApi(plain);
  }

  return plain;
}

/** Bulk-hydrate matches with embedded shots (simplified for embedded structure) */
export async function hydrateIndividualMatchesWithPoints(
  matches: Record<string, unknown>[]
): Promise<void> {
  // For embedded shots, no additional hydration needed
  // Shots are already in the documents
  // Just populate user data if needed
  for (const match of matches) {
    for (const game of (match.games as Record<string, unknown>[]) || []) {
      if (game.shots && Array.isArray(game.shots)) {
        game.shots = await populateShotsPlayers(game.shots as EmbeddedShot[]);
      }
    }
  }
}

// ============================================
// TEAM MATCH (embedded in subMatches[].games[].shots)
// ============================================

export async function getNextTeamShotNumber(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<number> {
  let agg = TeamMatch.aggregate([
    { $match: { _id: new Types.ObjectId(String(matchId)) } },
    { $unwind: "$subMatches" },
    { $match: { "subMatches._id": teamSubMatchId } },
    { $unwind: "$subMatches.games" },
    { $match: { "subMatches.games.gameNumber": gameNumber } },
    {
      $project: {
        maxShotNumber: { $max: "$subMatches.games.shots.shotNumber" },
      },
    },
  ]);
  if (session) agg = agg.session(session);
  const rows = await agg.exec();
  const max = rows[0]?.maxShotNumber;
  return typeof max === "number" ? max + 1 : 1;
}

export async function insertTeamPoint(
  params: {
    matchId: string | Types.ObjectId;
    teamSubMatchId: Types.ObjectId;
    gameNumber: number;
    shot: Omit<EmbeddedShot, "shotNumber"> & {
      player: Types.ObjectId | string;
      server?: Types.ObjectId | string | null;
    };
    session?: ClientSession | null;
  }
): Promise<EmbeddedShot> {
  const { matchId, teamSubMatchId, gameNumber, shot, session } = params;
  const shotNumber = await getNextTeamShotNumber(
    matchId,
    teamSubMatchId,
    gameNumber,
    session ?? null
  );

  const newShot: EmbeddedShot = {
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
  };
  (newShot as { _id?: Types.ObjectId })._id = new Types.ObjectId();

  await TeamMatch.updateOne(
    { _id: matchId, "subMatches._id": teamSubMatchId },
    { $push: { "subMatches.$[sm].games.$[g].shots": newShot } },
    {
      arrayFilters: [
        { "sm._id": teamSubMatchId },
        { "g.gameNumber": gameNumber },
      ],
      session: session ?? undefined,
    }
  );
  return newShot;
}

export async function deleteLastTeamPointForSide(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  gameNumber: number,
  side: string,
  session?: ClientSession | null
): Promise<void> {
  const match = await TeamMatch.findById(matchId).session(session ?? undefined);
  if (!match) return;

  const subMatch = match.subMatches.find(
    (sm) => String(sm._id) === String(teamSubMatchId)
  );
  const game = subMatch?.games?.find((g) => g.gameNumber === gameNumber);
  if (!game?.shots?.length) return;

  const sideShots = game.shots.filter((s) => s.side === side);
  if (sideShots.length === 0) return;
  const lastShot = sideShots[sideShots.length - 1];

  await TeamMatch.updateOne(
    { _id: matchId, "subMatches._id": teamSubMatchId },
    {
      $pull: {
        "subMatches.$[sm].games.$[g].shots": { shotNumber: lastShot.shotNumber },
      },
    },
    {
      arrayFilters: [
        { "sm._id": teamSubMatchId },
        { "g.gameNumber": gameNumber },
      ],
      session: session ?? undefined,
    }
  );
}

export async function deleteAllPointsForMatch(
  matchId: string | Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await TeamMatch.updateOne(
    { _id: matchId },
    { $set: { "subMatches.$[].games.$[].shots": [] } },
    { session: session ?? undefined }
  );
}

export async function deleteAllPointsForTeamSubMatch(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  session?: ClientSession | null
): Promise<void> {
  await TeamMatch.updateOne(
    { _id: matchId, "subMatches._id": teamSubMatchId },
    { $set: { "subMatches.$.games.$[].shots": [] } },
    { session: session ?? undefined }
  );
}

export async function deletePointsForTeamGame(
  matchId: string | Types.ObjectId,
  teamSubMatchId: Types.ObjectId,
  gameNumber: number,
  session?: ClientSession | null
): Promise<void> {
  await TeamMatch.updateOne(
    { _id: matchId, "subMatches._id": teamSubMatchId },
    { $set: { "subMatches.$[sm].games.$[g].shots": [] } },
    {
      arrayFilters: [
        { "sm._id": teamSubMatchId },
        { "g.gameNumber": gameNumber },
      ],
      session: session ?? undefined,
    }
  );
}

export async function listTeamSubMatchPoints(
  matchId: string,
  teamSubMatchId: string,
  gameNumber?: number
): Promise<EmbeddedShot[]> {
  const match = await TeamMatch.findById(matchId).lean();
  if (!match) return [];

  const subMatch = match.subMatches?.find(
    (sm) => String(sm._id) === teamSubMatchId
  );
  if (!subMatch) return [];

  let shots: EmbeddedShot[] = [];
  if (typeof gameNumber === "number") {
    const game = subMatch.games?.find((g) => g.gameNumber === gameNumber);
    shots = (game?.shots as EmbeddedShot[]) || [];
  } else {
    shots = (subMatch.games || [])
      .flatMap((g) =>
        ((g.shots as EmbeddedShot[]) || []).map((shot) => ({
          ...shot,
          gameNumber: g.gameNumber,
        }))
      )
      .sort((a, b) => {
        const aGn = (a as EmbeddedShot & { gameNumber?: number }).gameNumber ?? 0;
        const bGn = (b as EmbeddedShot & { gameNumber?: number }).gameNumber ?? 0;
        if (aGn !== bGn) return aGn - bGn;
        return a.shotNumber - b.shotNumber;
      });
  }

  return populateShotsPlayers(shots);
}

export async function hydrateTeamMatchesWithPoints(
  matches: Record<string, unknown>[]
): Promise<void> {
  for (const match of matches) {
    for (const sm of (match.subMatches as Record<string, unknown>[]) || []) {
      await populateEmbeddedShotsOnGames(
        sm.games as Record<string, unknown>[] | undefined,
        DEFAULT_USER_FIELDS
      );
    }
  }
}
