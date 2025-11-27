"use client";

import { useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketEventName,
} from "@/types/socket.type";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Hook for listening to a specific socket event with automatic cleanup
 * @param socket - Socket.IO instance
 * @param eventName - Name of the event to listen to
 * @param handler - Event handler function
 */
export function useSocketEvent<E extends SocketEventName>(
  socket: SocketType | null,
  eventName: E,
  handler: ServerToClientEvents[E]
): void {
  useEffect(() => {
    if (!socket || !handler) {
      return;
    }

    // Add event listener
    socket.on(eventName, handler as any);

    // Cleanup: remove listener on unmount or when dependencies change
    return () => {
      socket.off(eventName, handler as any);
    };
  }, [socket, eventName, handler]);
}
