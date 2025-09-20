import type { PlayerKey } from "@/hooks/useMatchStore";

export const checkGameWon = (p1: number, p2: number): PlayerKey | null => {
  if ((p1 >= 11 || p2 >= 11) && Math.abs(p1 - p2) >= 2) {
    return p1 > p2 ? "player1" : "player2";
  }
  return null;
};

type ServerResult = {
  server: PlayerKey;
  isDeuce: boolean;
  serveCount: number;
};

// 🔥 Get next server considering singles/doubles
export const getNextServer = (
  p1: number,
  p2: number,
  isDoubles: boolean,
  serverOrder: PlayerKey[] // e.g. ["player1", "player2", "player3", "player4"]
): ServerResult => {
  const totalPoints = p1 + p2;
  const isDeuce = p1 >= 10 && p2 >= 10;

  if (isDoubles) {
    return getNextServerDoubles(totalPoints, isDeuce, serverOrder);
  } else {
    return getNextServerSingles(totalPoints, isDeuce);
  }
};

// 🏓 Singles logic
const getNextServerSingles = (totalPoints: number, isDeuce: boolean): ServerResult => {
  if (isDeuce) {
    return {
      server: totalPoints % 2 === 0 ? "player1" : "player2",
      isDeuce,
      serveCount: 0,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2);
  return {
    server: serveCycle % 2 === 0 ? "player1" : "player2",
    isDeuce,
    serveCount: totalPoints % 2,
  };
};

// 🏓 Doubles logic
const getNextServerDoubles = (
  totalPoints: number,
  isDeuce: boolean,
  serverOrder: PlayerKey[]
): ServerResult => {
  if (isDeuce) {
    // After deuce → 1 serve rotation
    const serverIndex = totalPoints % serverOrder.length;
    return {
      server: serverOrder[serverIndex],
      isDeuce,
      serveCount: 0,
    };
  }

  // Before deuce → rotate every 2 points
  const serveCycle = Math.floor(totalPoints / 2);
  const serverIndex = serveCycle % serverOrder.length;

  return {
    server: serverOrder[serverIndex],
    isDeuce,
    serveCount: totalPoints % 2,
  };
};

export const checkSetWon = (
  side1Games: number,
  side2Games: number
): PlayerKey | null => {
  if (side1Games > side2Games) return "player1";
  if (side2Games > side1Games) return "player2";
  return null;
};

export const checkMatchWon = (
  side1Sets: number,
  side2Sets: number,
  bestOf: number
): PlayerKey | null => {
  const targetSets = Math.floor(bestOf / 2) + 1; // e.g. best of 5 → 3 sets needed
  if (side1Sets >= targetSets) return "player1";
  if (side2Sets >= targetSets) return "player2";
  return null;
};

export type AddPointPayload = {
  side: "player1" | "player2";
  playerId?: string;
};

export type OnAddPoint = (payload: AddPointPayload) => void;