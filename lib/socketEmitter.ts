import { Server } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketEventName,
} from "@/types/socket.type";

// Extend global namespace to include socket.io instance
declare global {
  var io: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
}

/**
 * Get the global Socket.IO instance
 * @returns Socket.IO server instance or null if not initialized
 */
export function getSocketIO(): Server<
  ClientToServerEvents,
  ServerToClientEvents
> | null {
  if (!global.io) {
    console.warn("[Socket.IO] Server instance not available");
    return null;
  }
  return global.io;
}

/**
 * Emit an event to all clients in a specific match room
 * @param matchId - The match ID (will be used to create room name)
 * @param eventName - Name of the event to emit
 * @param payload - Event payload data
 */
export function emitToMatchRoom(
  matchId: string,
  eventName: SocketEventName,
  payload: any
): void {
  const io = getSocketIO();

  if (!io) {
    console.warn(
      `[Socket.IO] Cannot emit ${eventName} to match ${matchId}: Server not initialized`
    );
    return;
  }

  const roomName = `match:${matchId}`;

  // Add timestamp if not already present
  const enrichedPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    io.to(roomName).emit(eventName, enrichedPayload);
    console.log(
      `[Socket.IO] Emitted ${eventName} to room ${roomName}`,
      enrichedPayload
    );
  } catch (error) {
    console.error(
      `[Socket.IO] Error emitting ${eventName} to room ${roomName}:`,
      error
    );
  }
}

/**
 * Get the number of clients in a match room
 * @param matchId - The match ID
 * @returns Promise resolving to the number of viewers in the room
 */
export async function getMatchRoomViewerCount(
  matchId: string
): Promise<number> {
  const io = getSocketIO();

  if (!io) {
    return 0;
  }

  const roomName = `match:${matchId}`;

  try {
    const sockets = await io.in(roomName).fetchSockets();
    return sockets.length;
  } catch (error) {
    console.error(
      `[Socket.IO] Error fetching viewer count for room ${roomName}:`,
      error
    );
    return 0;
  }
}

/**
 * Check if Socket.IO server is initialized and ready
 * @returns True if server is available, false otherwise
 */
export function isSocketIOReady(): boolean {
  return global.io !== undefined;
}
