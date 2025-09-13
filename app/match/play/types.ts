// app/match/play/types.ts
export interface Shot {
  shotName: string;
  timestamp: number;
  playerId: string;
  scoreP1: number;
  scoreP2: number;
}

export interface Player {
  userId: string;
  username: string;
  displayName: string;
  currentScore: number;
  gamesWon: number;
  serving: boolean;
  shots: Shot[];
}

export interface RecentShot {
  shotName: string;
  playerName: string;
  playerId: string;
  timestamp: number;
  gameNumber: number;
}

export interface Game {
  gameNumber: number;
  scores: Record<string, number>;
  winnerId: string;
  shots: Shot[];
  startTime: number;
  endTime: number;
}

export interface Match {
  id: string;
  playerOrder: string[];
  players: Record<string, { userId: string; username: string; displayName: string }>;
  bestOf: number;
  category: "singles" | "doubles";
  games: Game[];
  winnerId: string | null;
  startTime: number;
  endTime: number | null;
}
