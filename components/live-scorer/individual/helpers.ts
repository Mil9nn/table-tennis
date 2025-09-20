// features/match/live-scorer/individual/helpers.ts

import type { PlayerKey } from "@/hooks/useMatchStore";

// Check if game is won (standard 11 points, win by 2)
export const checkGameWon = (p1: number, p2: number): PlayerKey | null => {
  if ((p1 >= 11 || p2 >= 11) && Math.abs(p1 - p2) >= 2) {
    return p1 > p2 ? "player1" : "player2";
  }
  return null;
};

// Server rotation logic (singles/doubles handled the same for now)
export const getNextServer = (
  p1: number,
  p2: number
): { server: PlayerKey; isDeuce: boolean; serveCount: number } => {
  const totalPoints = p1 + p2;
  const isDeuce = p1 >= 10 && p2 >= 10;

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