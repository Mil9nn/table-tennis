import { Shot } from "./shot.type";

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
  /** Match scores keyed by scoring id (player/team id) */
  scoresById?: Record<string, number>;
  /** Match sets keyed by scoring id (player/team id) */
  setsById?: Record<string, number>;
  /** Completed game winner id */
  gameWinnerId?: string;
  /** Current server as player id */
  currentServerPlayerId?: string;
  subMatchId?: string;
  gameCompleted?: boolean;
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
  currentServerPlayerId: string | null;
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
  winnerId: string | null;
  scoresById?: Record<string, number>;
  setsById?: Record<string, number>;
  timestamp: string;
}

export interface MatchCompletedEvent {
  matchId: string;
  matchCategory: "individual" | "team";
  winnerId: string | null;
  setsById?: Record<string, number>;
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
