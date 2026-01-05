import { Server, Socket } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../types/socket.types.js";

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track user metadata for each socket
interface SocketMetadata {
  matchId?: string;
  userId?: string;
  role?: "scorer" | "viewer";
  joinedAt: Date;
}

// Store metadata for all connected sockets
const socketMetadata = new Map<string, SocketMetadata>();

/**
 * Initialize Socket.IO connection handlers
 * @param io - Socket.IO server instance
 */
export function initializeSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on("connection", (socket: SocketType) => {
    const socketId = socket.id;

    // Initialize metadata for this socket
    socketMetadata.set(socketId, { joinedAt: new Date() });

    // Handle match room join
    socket.on("join:match", async (data) => {
      const { matchId, userId, role } = data;

      if (!matchId) {
        console.warn(`[Socket Server] Client ${socketId} tried to join without matchId`);
        return;
      }

      const roomName = `match:${matchId}`;

      try {
        // Leave any previous room
        const metadata = socketMetadata.get(socketId);
        if (metadata?.matchId) {
          const oldRoom = `match:${metadata.matchId}`;
          await socket.leave(oldRoom);
        }

        // Join new room
        await socket.join(roomName);

        // Update metadata
        socketMetadata.set(socketId, {
          matchId,
          userId,
          role,
          joinedAt: new Date(),
        });

        // Get updated viewer count
        const sockets = await io.in(roomName).fetchSockets();
        const viewerCount = sockets.length;

        // Notify room of new viewer
        io.to(roomName).emit("viewer:joined", {
          matchId,
          viewerCount,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `[Socket Server] Error joining room ${roomName}:`,
          error
        );
      }
    });

    // Handle match room leave
    socket.on("leave:match", async (data) => {
      const { matchId } = data;

      if (!matchId) {
        console.warn(`[Socket Server] Client ${socketId} tried to leave without matchId`);
        return;
      }

      const roomName = `match:${matchId}`;

      try {
        await socket.leave(roomName);

        // Clear metadata
        const metadata = socketMetadata.get(socketId);
        if (metadata) {
          metadata.matchId = undefined;
          socketMetadata.set(socketId, metadata);
        }

        console.log(`[Socket Server] Client ${socketId} left room ${roomName}`);

        // Get updated viewer count
        const sockets = await io.in(roomName).fetchSockets();
        const viewerCount = sockets.length;

        // Notify room of viewer leaving
        io.to(roomName).emit("viewer:left", {
          matchId,
          viewerCount,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `[Socket Server] Error leaving room ${roomName}:`,
          error
        );
      }
    });

    // Handle ping for connection health check
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      console.log(
        `[Socket Server] Client disconnected: ${socketId}, reason: ${reason}`
      );

      // Notify room if user was in a match room
      const metadata = socketMetadata.get(socketId);
      if (metadata?.matchId) {
        const roomName = `match:${metadata.matchId}`;

        try {
          // Get updated viewer count
          const sockets = await io.in(roomName).fetchSockets();
          const viewerCount = sockets.length;

          // Notify room
          io.to(roomName).emit("viewer:left", {
            matchId: metadata.matchId,
            viewerCount,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error(
            `[Socket Server] Error handling disconnect for room ${roomName}:`,
            error
          );
        }
      }

      // Clean up metadata
      socketMetadata.delete(socketId);
    });

    // Log all events in development
    if (process.env.NODE_ENV === "development") {
      socket.onAny((eventName, ...args) => {
        console.log(`[Socket Server] Event: ${eventName}`, args);
      });
    }
  });

  console.log("[Socket Server] Connection handlers initialized");
}

/**
 * Get metadata for a specific socket
 * @param socketId - Socket ID
 * @returns Socket metadata or undefined
 */
export function getSocketMetadata(socketId: string): SocketMetadata | undefined {
  return socketMetadata.get(socketId);
}

/**
 * Get all sockets in a specific room
 * @param io - Socket.IO server instance
 * @param matchId - Match ID
 * @returns Promise resolving to array of socket IDs
 */
export async function getMatchRoomSockets(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  matchId: string
): Promise<string[]> {
  const roomName = `match:${matchId}`;
  const sockets = await io.in(roomName).fetchSockets();
  return sockets.map((s) => s.id);
}


