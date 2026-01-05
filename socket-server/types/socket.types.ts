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

// Server key type for tracking current server
export type ServerKey = "side1" | "side2" | string;

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
  "score:update": (data: any) => void;
  "shot:recorded": (data: any) => void;
  "server:change": (data: any) => void;
  "match:status": (data: any) => void;
  "game:completed": (data: any) => void;
  "match:completed": (data: any) => void;
  "match:reset": (data: any) => void;
  "viewer:joined": (data: ViewerEvent) => void;
  "viewer:left": (data: ViewerEvent) => void;
  pong: () => void;
}

// Event payload types
export interface ViewerEvent {
  matchId: string;
  viewerCount: number;
  timestamp: string;
}


