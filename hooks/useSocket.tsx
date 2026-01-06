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

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  // Debug: Log environment variable status
  if (typeof window !== "undefined") {
    console.log("[Socket Debug] NEXT_PUBLIC_SOCKET_URL:", socketUrl || "NOT SET");
    console.log("[Socket Debug] Current hostname:", window.location.hostname);
  }

  // Don't connect if URL is not configured (except in local dev)
  if (!socketUrl) {
    const isLocalDev = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    
    if (!isLocalDev) {
      console.error(
        "[Socket] ❌ NEXT_PUBLIC_SOCKET_URL not configured!",
        "\nCurrent hostname:", typeof window !== "undefined" ? window.location.hostname : "unknown",
        "\nPlease:",
        "\n1. Set NEXT_PUBLIC_SOCKET_URL in Vercel → Settings → Environment Variables",
        "\n2. Value should be your Render socket server URL (e.g., https://your-socket-server.onrender.com)",
        "\n3. Redeploy your Vercel app to apply the change"
      );
      return;
    }
  }

  const finalSocketUrl = socketUrl || "http://localhost:3000";
  console.log("[Socket] Connecting to:", finalSocketUrl);

  const newSocket: SocketType = io(finalSocketUrl, {
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

  // Socket events
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
    setError(err);
    setIsConnected(false);
  });

  // Manager events (reconnect logic lives on io.Manager)
  newSocket.io.on("reconnect", (attemptNumber) => {
    console.log("[Socket] Reconnected after", attemptNumber, "attempts");
    setIsConnected(true);
    setError(null);
  });

  newSocket.io.on("reconnect_attempt", (attemptNumber) => {
    console.log("[Socket] Reconnection attempt:", attemptNumber);
  });

  newSocket.io.on("reconnect_failed", () => {
    console.error("[Socket] Reconnection failed");
    setError(new Error("Failed to reconnect to server"));
  });

  return () => {
    console.log("[Socket] Cleaning up connection");
    newSocket.removeAllListeners();
    newSocket.io.removeAllListeners();
    newSocket.close();
    socketRef.current = null;
    setSocket(null);
    setIsConnected(false);
  };
}, [enabled, autoConnect]);

  return { socket, isConnected, error };
}
