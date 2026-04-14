import type { IndividualGame, Participant } from "@/types/match.type";

/**
 * Client-side helpers for singles matches (no server / mongoose).
 */

export function getSinglesParticipantIds(
  participants: Pick<Participant, "_id">[] | undefined
): [string, string] | null {
  if (!participants || participants.length < 2) return null;
  return [String(participants[0]._id), String(participants[1]._id)];
}

/** Works with populated users or raw ObjectIds from Mongoose */
export function getSinglesParticipantIdsFromRaw(
  participants: unknown[] | undefined
): [string, string] | null {
  if (!participants || participants.length < 2) return null;
  const id0 = (participants[0] as { _id?: unknown })?._id ?? participants[0];
  const id1 = (participants[1] as { _id?: unknown })?._id ?? participants[1];
  if (id0 == null || id1 == null) return null;
  return [String(id0), String(id1)];
}

/** Build point totals keyed by player id (for sockets / API). */
export function pointScoresRecordForSinglesGame(
  game: {
    side1Score?: number;
    side2Score?: number;
    scores?: Record<string, number> | Map<string, number> | null;
  },
  p0: string,
  p1: string
): Record<string, number> {
  if (game.scores instanceof Map) {
    return Object.fromEntries(game.scores);
  }
  if (game.scores && typeof game.scores === "object") {
    return { ...(game.scores as Record<string, number>) };
  }
  return {
    [p0]: Number(game.side1Score ?? 0),
    [p1]: Number(game.side2Score ?? 0),
  };
}

export function participantNameById(
  participants: Participant[] | undefined,
  playerId: string | null | undefined
): string | null {
  if (!playerId || !participants?.length) return null;
  const p = participants.find((x) => String(x._id) === String(playerId));
  return p?.fullName || p?.username || null;
}

/** Point totals for display: index 0 = side1 / left, index 1 = side2 / right */
export function singlesGamePointScores(
  game: IndividualGame,
  p0: string,
  p1: string
): { side1Score: number; side2Score: number } {
  const by = game.scoresByPlayerId ?? game.scores;
  if (by && typeof by === "object") {
    return {
      side1Score: Number(by[p0] ?? game.side1Score ?? 0),
      side2Score: Number(by[p1] ?? game.side2Score ?? 0),
    };
  }
  return {
    side1Score: Number(game.side1Score ?? 0),
    side2Score: Number(game.side2Score ?? 0),
  };
}

/** Prefer canonical player id for game winner; fallback to winnerSide + order */
export function singlesGameWinnerPlayerId(
  game: IndividualGame,
  p0: string,
  p1: string
): string | null {
  if (game.winner) return String(game.winner);
  if (game.winnerPlayerId) return String(game.winnerPlayerId);
  if (game.winnerSide === "side1") return p0;
  if (game.winnerSide === "side2") return p1;
  return null;
}

export function setsWonRecordForSingles(
  finalScore: {
    side1Sets?: number;
    side2Sets?: number;
    sets?: Record<string, number> | Map<string, number> | null;
  },
  p0: string,
  p1: string
): Record<string, number> {
  const fs = finalScore;
  if (fs.sets instanceof Map) {
    return Object.fromEntries(fs.sets);
  }
  if (fs.sets && typeof fs.sets === "object") {
    return { ...(fs.sets as Record<string, number>) };
  }
  return {
    [p0]: Number(fs.side1Sets ?? 0),
    [p1]: Number(fs.side2Sets ?? 0),
  };
}

export function singlesMatchWinnerPlayerId(
  match: {
    winnerPlayerId?: string;
    winner?: string;
    winnerSide?: "side1" | "side2" | null;
  },
  p0: string,
  p1: string
): string | null {
  if (match.winnerPlayerId) return String(match.winnerPlayerId);
  if (match.winner) return String(match.winner);
  if (match.winnerSide === "side1") return p0;
  if (match.winnerSide === "side2") return p1;
  return null;
}
