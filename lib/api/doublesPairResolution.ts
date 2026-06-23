import mongoose from "mongoose";
import { User } from "@/models/User";

export function normalizePairId(pairId: any): string {
  if (!pairId) return "";
  if (typeof pairId === "string") return pairId;
  if (pairId?.toString) return pairId.toString();
  return String(pairId);
}

export async function ensureDoublesPairsPopulated(
  doublesPairs: any[]
): Promise<any[]> {
  if (!doublesPairs || doublesPairs.length === 0) {
    return [];
  }

  const playerIds: string[] = [];
  doublesPairs.forEach((pair: any) => {
    const p1Id = pair.player1?._id?.toString() || pair.player1?.toString();
    const p2Id = pair.player2?._id?.toString() || pair.player2?.toString();
    if (p1Id) playerIds.push(p1Id);
    if (p2Id) playerIds.push(p2Id);
  });

  const playerObjectIds = playerIds
    .filter((id): id is string => Boolean(id && mongoose.Types.ObjectId.isValid(id)))
    .map((id) => new mongoose.Types.ObjectId(id));

  const users =
    playerObjectIds.length > 0
      ? await User.find({ _id: { $in: playerObjectIds } })
          .select("username fullName profileImage")
          .lean()
      : [];
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return doublesPairs.map((pair: any) => {
    const p1Id = pair.player1?._id?.toString() || pair.player1?.toString();
    const p2Id = pair.player2?._id?.toString() || pair.player2?.toString();

    const player1Populated =
      pair.player1 &&
      typeof pair.player1 === "object" &&
      pair.player1._id &&
      pair.player1.username;
    const player2Populated =
      pair.player2 &&
      typeof pair.player2 === "object" &&
      pair.player2._id &&
      pair.player2.username;

    return {
      _id: pair._id,
      player1: player1Populated ? pair.player1 : p1Id ? userMap.get(p1Id) || null : null,
      player2: player2Populated ? pair.player2 : p2Id ? userMap.get(p2Id) || null : null,
    };
  });
}

export function buildPairPseudoParticipant(pair: any, pairId: string) {
  const player1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
  const player2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
  return {
    _id: normalizePairId(pairId),
    fullName: `${player1Name} / ${player2Name}`,
    username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
    profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
    isPair: true,
    player1: pair.player1,
    player2: pair.player2,
  };
}

function resolvePairRef(
  participantRef: any,
  pairMap: Map<string, any>,
  playerToPairMap: Map<string, any>
): { pair: any; pairId: string } | null {
  let pair: any = null;
  let pairId: string | null = null;

  if (participantRef && typeof participantRef === "object" && participantRef._id) {
    const participantId = normalizePairId(participantRef._id);
    pair = playerToPairMap.get(participantId);
    if (pair) {
      pairId = normalizePairId(pair._id);
    } else {
      pair = pairMap.get(participantId);
      if (pair) {
        pairId = participantId;
      }
    }
  } else {
    pairId = normalizePairId(participantRef);
    pair = pairMap.get(pairId || "");
  }

  if (pair && pairId) {
    return { pair, pairId };
  }
  return null;
}

export function buildDoublesPairMaps(populatedPairs: any[]) {
  const pairMap = new Map<string, any>();
  const playerToPairMap = new Map<string, any>();

  populatedPairs.forEach((pair: any) => {
    const pairId = normalizePairId(pair._id);
    if (!pairId) return;
    pairMap.set(pairId, pair);
    if (pair.player1?._id) {
      playerToPairMap.set(pair.player1._id.toString(), pair);
    }
    if (pair.player2?._id) {
      playerToPairMap.set(pair.player2._id.toString(), pair);
    }
  });

  return { pairMap, playerToPairMap };
}

/** Normalize a standings row to canonical API field names. */
export function normalizeStandingRow(row: any) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    played: Number(row.played ?? row.matchesPlayed ?? 0) || 0,
    won: Number(row.won ?? row.wins ?? 0) || 0,
    lost: Number(row.lost ?? row.losses ?? 0) || 0,
    drawn: Number(row.drawn ?? row.draws ?? 0) || 0,
    setsWon: Number(row.setsWon ?? 0) || 0,
    setsLost: Number(row.setsLost ?? 0) || 0,
    setsDiff: Number(row.setsDiff ?? 0) || 0,
    pointsScored: Number(row.pointsScored ?? 0) || 0,
    pointsConceded: Number(row.pointsConceded ?? 0) || 0,
    pointsDiff: Number(row.pointsDiff ?? 0) || 0,
    points: Number(row.points ?? 0) || 0,
    rank: Number(row.rank ?? 0) || 0,
    form: Array.isArray(row.form) ? row.form : [],
    headToHead: row.headToHead ?? {},
  };
}

/**
 * Resolve group participants and standings for doubles tournaments using pair IDs.
 */
export function resolveDoublesGroups(
  groups: any[],
  populatedPairs: any[]
): any[] {
  if (!Array.isArray(groups) || groups.length === 0) return groups;

  const { pairMap, playerToPairMap } = buildDoublesPairMaps(populatedPairs);

  return groups.map((group: any) => {
    const participants = Array.isArray(group?.participants)
      ? group.participants.map((participant: any) => {
          if (participant?.isPair && participant?.fullName) return participant;
          const resolved = resolvePairRef(participant, pairMap, playerToPairMap);
          if (resolved) {
            return buildPairPseudoParticipant(resolved.pair, resolved.pairId);
          }
          const participantId = normalizePairId(participant?._id || participant) || "unknown";
          return {
            _id: participantId,
            fullName: "[ERROR: Pair not found]",
            username: `error_${participantId}`,
            isPair: true,
            _error: true,
          };
        })
      : group?.participants;

    const standings = Array.isArray(group?.standings)
      ? group.standings.map((standing: any) => {
          const normalized = normalizeStandingRow(standing);
          if (normalized?.participant?.isPair && normalized.participant.fullName) {
            return normalized;
          }
          const resolved = resolvePairRef(normalized?.participant, pairMap, playerToPairMap);
          if (resolved) {
            return {
              ...normalized,
              participant: buildPairPseudoParticipant(resolved.pair, resolved.pairId),
            };
          }
          const participantId =
            normalizePairId(normalized?.participant?._id || normalized?.participant) || "unknown";
          return {
            ...normalized,
            participant: {
              _id: participantId,
              fullName: "[ERROR: Pair not found]",
              username: `error_${participantId}`,
              isPair: true,
              _error: true,
            },
          };
        })
      : group?.standings;

    return {
      ...group,
      participants,
      standings,
    };
  });
}

/**
 * Resolve group participants/standings for singles or teams.
 */
export function resolveGroupsWithParticipantMap(
  groups: any[],
  participantById: Map<string, any>
): any[] {
  if (!Array.isArray(groups) || groups.length === 0) return groups;

  return groups.map((group: any) => ({
    ...group,
    participants: Array.isArray(group?.participants)
      ? group.participants.map((participant: any) => {
          if (participant && typeof participant === "object" && participant._id) {
            return participant;
          }
          return participantById.get(participant?.toString?.() || "") || participant;
        })
      : group?.participants,
    standings: Array.isArray(group?.standings)
      ? group.standings.map((standing: any) => {
          const normalized = normalizeStandingRow(standing);
          const participant = normalized?.participant;
          if (participant && typeof participant === "object" && participant._id) {
            return normalized;
          }
          const resolved = participantById.get(participant?.toString?.() || "");
          return resolved ? { ...normalized, participant: resolved } : normalized;
        })
      : group?.standings,
  }));
}
