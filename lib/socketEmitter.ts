import { SocketEventName } from "@/types/socket.type";
import { env } from "./env";

/**
 * Emit an event to all clients in a specific match room via HTTP API
 * This function is fire-and-forget and does not block execution
 * @param matchId - The match ID (will be used to create room name)
 * @param eventName - Name of the event to emit
 * @param payload - Event payload data
 */
export function emitToMatchRoom(
  matchId: string,
  eventName: SocketEventName,
  payload: any
): void {
  const socketServerUrl = env.SOCKET_SERVER_URL;

  if (!socketServerUrl) {
    console.warn(
      `[Socket.IO] Cannot emit ${eventName} to match ${matchId}: SOCKET_SERVER_URL not configured`
    );
    return;
  }

  // Add timestamp if not already present
  const enrichedPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // Fire-and-forget HTTP request
  (async () => {
    try {
      const url = `${socketServerUrl}/api/emit/${matchId}/${eventName}`;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add API key if configured
      if (process.env.SOCKET_API_KEY) {
        headers["X-API-Key"] = process.env.SOCKET_API_KEY;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(enrichedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log(
        `[Socket.IO] Emitted ${eventName} to match ${matchId} via HTTP API`
      );
    } catch (error) {
      console.error(
        `[Socket.IO] Error emitting ${eventName} to match ${matchId}:`,
        error
      );
    }
  })();
}

/**
 * Get the number of clients in a match room via HTTP API
 * @param matchId - The match ID
 * @returns Promise resolving to the number of viewers in the room
 */
export async function getMatchRoomViewerCount(
  matchId: string
): Promise<number> {
  const socketServerUrl = env.SOCKET_SERVER_URL;

  if (!socketServerUrl) {
    return 0;
  }

  try {
    const url = `${socketServerUrl}/api/viewers/${matchId}`;
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.viewerCount || 0;
  } catch (error) {
    console.error(
      `[Socket.IO] Error fetching viewer count for match ${matchId}:`,
      error
    );
    return 0;
  }
}

/**
 * Check if Socket.IO server is configured and ready
 * @returns True if server URL is configured, false otherwise
 */
export function isSocketIOReady(): boolean {
  return !!env.SOCKET_SERVER_URL;
}
