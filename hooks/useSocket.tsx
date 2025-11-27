"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket.type";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  enabled?: boolean;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: SocketType | null;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Base hook for establishing Socket.IO connection
 * @param options - Configuration options
 * @returns Socket instance, connection status, and error state
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { enabled = true, autoConnect = true } = options;

  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    if (!enabled || !autoConnect) {
      return;
    }

    // Create socket connection
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    console.log("[Socket] Connecting to:", socketUrl);

    const newSocket: SocketType = io(socketUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("[Socket] Connected:", newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err);
      setError(err as Error);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("[Socket] Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[Socket] Reconnection attempt:", attemptNumber);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("[Socket] Reconnection failed");
      setError(new Error("Failed to reconnect to server"));
    });

    // Heartbeat
    newSocket.on("pong", () => {
      // Server responded to ping
    });

    // Cleanup on unmount
    return () => {
      console.log("[Socket] Cleaning up connection");
      newSocket.removeAllListeners();
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [enabled, autoConnect]);

  return { socket, isConnected, error };
}
