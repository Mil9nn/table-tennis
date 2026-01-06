import { Shot } from "./shot.type";

// Server key type for tracking current server
export type ServerKey = "side1" | "side2" | string;

// Socket event names (string literals for type safety)
export type SocketEventName =
  | "score:update"
  | "shot:recorded"
  | "server:change"
  | "match:status"
  | "game:completed"
  | "match:completed"
  | "match:reset"
  | "viewer:joined"
  | "viewer:left";

// Client to Server events
export interface ClientToServerEvents {
  "join:match": (data: {
    matchId: string;
    userId?: string;
    role: "scorer" | "viewer";
  }) => void;
  "leave:match": (data: { matchId: string }) => void;
  ping: () => void;
}

// Server to Client events
export interface ServerToClientEvents {
  "score:update": (data: ScoreUpdateEvent) => void;
  "shot:recorded": (data: ShotRecordedEvent) => void;
  "server:change": (data: ServerChangeEvent) => void;
  "match:status": (data: MatchStatusEvent) => void;
  "game:completed": (data: GameCompletedEvent) => void;
  "match:completed": (data: MatchCompletedEvent) => void;
  "match:reset": (data: MatchResetEvent) => void;
  "viewer:joined": (data: ViewerEvent) => void;
  "viewer:left": (data: ViewerEvent) => void;
  pong: () => void;
}

// Event payload types

export interface ScoreUpdateEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  gameNumber: number;
  // Individual match scores
  side1Score?: number;
  side2Score?: number;
  // Team match scores
  team1Score?: number;
  team2Score?: number;
  subMatchId?: string;
  // Common fields
  currentServer: ServerKey | null;
  finalScore: {
    side1Sets?: number;
    side2Sets?: number;
    team1Games?: number;
    team2Games?: number;
  };
  gameCompleted?: boolean;
  gameWinner?: "side1" | "side2" | "team1" | "team2" | null;
  timestamp: string;
}

export interface ShotRecordedEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  gameNumber: number;
  subMatchId?: string;
  shot: Shot;
  timestamp: string;
}

export interface ServerChangeEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  subMatchId?: string;
  currentServer: ServerKey | null;
  reason: "score_update" | "manual_change" | "game_start";
  timestamp: string;
}

export interface MatchStatusEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  timestamp: string;
}

export interface GameCompletedEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  gameNumber: number;
  subMatchId?: string;
  winnerSide: "side1" | "side2" | "team1" | "team2" | null;
  finalScore: {
    side1Score?: number;
    side2Score?: number;
    team1Score?: number;
    team2Score?: number;
  };
  newSetScore: {
    side1Sets?: number;
    side2Sets?: number;
    team1Games?: number;
    team2Games?: number;
  };
  timestamp: string;
}

export interface MatchCompletedEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  winnerSide: "side1" | "side2" | "team1" | "team2" | null;
  finalScore: {
    side1Sets?: number;
    side2Sets?: number;
    team1Matches?: number;
    team2Matches?: number;
  };
  timestamp: string;
}

export interface MatchResetEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  type: "game" | "match";
  timestamp: string;
}

export interface ViewerEvent {
  matchId: string;
  viewerCount: number;
  timestamp: string;
}
