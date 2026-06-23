import { Router, Request, Response } from "express";
import { Server } from "socket.io";
import { SocketEventName } from "../types/socket.types.js";

const router = Router();

// Middleware to validate API key (if configured)
const validateApiKey = (req: Request, res: Response, next: Function) => {
  const apiKey = process.env.SOCKET_API_KEY;
  
  // If no API key is configured, skip validation
  if (!apiKey) {
    return next();
  }

  const providedKey = req.headers["x-api-key"] as string;

  if (!providedKey || providedKey !== apiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing API key",
    });
  }

  next();
};

/**
 * POST /api/emit/:matchId/:eventName
 * Emit an event to all clients in a specific match room
 */
router.post(
  "/emit/:matchId/:eventName",
  validateApiKey,
  async (req: Request, res: Response) => {
    try {
      const { matchId, eventName } = req.params;
      const payload = req.body;

      // Validate matchId
      if (!matchId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "matchId is required",
        });
      }

      // Validate eventName
      const validEventNames: SocketEventName[] = [
        "score:update",
        "shot:recorded",
        "server:change",
        "match:status",
        "game:completed",
        "match:completed",
        "match:reset",
        "viewer:joined",
        "viewer:left",
      ];

      if (!validEventNames.includes(eventName as SocketEventName)) {
        return res.status(400).json({
          error: "Bad Request",
          message: `Invalid event name. Must be one of: ${validEventNames.join(", ")}`,
        });
      }

      // Get Socket.IO instance from app locals
      const io: Server = req.app.locals.io;

      if (!io) {
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Socket.IO server not initialized",
        });
      }

      const roomName = `match:${matchId}`;

      // Add timestamp if not already present
      const enrichedPayload = {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      };

      // Emit to room
      // Type assertion needed because eventName is validated as SocketEventName
      (io.to(roomName) as any).emit(eventName, enrichedPayload);

      console.log(
        `[Socket Server] Emitted ${eventName} to room ${roomName}`,
        enrichedPayload
      );

      res.json({
        success: true,
        message: `Event ${eventName} emitted to room ${roomName}`,
        room: roomName,
        event: eventName,
      });
    } catch (error) {
      console.error("[Socket Server] Error emitting event:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/viewers/:matchId
 * Get the number of viewers in a match room
 */
router.get("/viewers/:matchId", async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "matchId is required",
      });
    }

    const io: Server = req.app.locals.io;

    if (!io) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Socket.IO server not initialized",
      });
    }

    const roomName = `match:${matchId}`;
    const sockets = await io.in(roomName).fetchSockets();
    const viewerCount = sockets.length;

    res.json({
      matchId,
      room: roomName,
      viewerCount,
    });
  } catch (error) {
    console.error("[Socket Server] Error fetching viewer count:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as emitRoutes };

