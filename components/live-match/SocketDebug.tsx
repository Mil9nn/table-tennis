"use client";

import { useEffect, useState } from "react";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { Badge } from "@/components/ui/badge";

export function SocketDebug({ matchId, category }: { matchId: string; category: "individual" | "team" }) {
  const { socket, isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory: category,
    role: "viewer",
    enabled: true,
  });

  const [lastEvent, setLastEvent] = useState<string>("None");
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      "score:update": () => {
        setLastEvent("score:update");
        setEventCount((c) => c + 1);
      },
      "shot:recorded": () => {
        setLastEvent("shot:recorded");
        setEventCount((c) => c + 1);
      },
      "server:change": () => {
        setLastEvent("server:change");
        setEventCount((c) => c + 1);
      },
      "game:completed": () => {
        setLastEvent("game:completed");
        setEventCount((c) => c + 1);
      },
      "match:completed": () => {
        setLastEvent("match:completed");
        setEventCount((c) => c + 1);
      },
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event as any, handler);
    });

    return () => {
      Object.keys(handlers).forEach((event) => {
        socket.off(event as any);
      });
    };
  }, [socket]);

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs space-y-2 z-50 max-w-xs">
      <div className="font-semibold text-slate-200 mb-2">Socket Debug</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">URL:</span>
          <span className="text-slate-300 font-mono text-[10px]">{socketUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Connected:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Joined Room:</span>
          <Badge variant={isJoined ? "default" : "destructive"}>
            {isJoined ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Socket ID:</span>
          <span className="text-slate-300 font-mono text-[10px]">
            {socket?.id || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Events Received:</span>
          <span className="text-slate-300 font-bold">{eventCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Last Event:</span>
          <span className="text-slate-300 font-mono text-[10px]">{lastEvent}</span>
        </div>
      </div>
    </div>
  );
}

