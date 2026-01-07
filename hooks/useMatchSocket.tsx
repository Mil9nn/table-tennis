"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "./useSocket";
import { useSocketEvent } from "./useSocketEvent";
import { useMatchStore } from "./useMatchStore";
import {
  ScoreUpdateEvent,
  ShotRecordedEvent,
  ServerChangeEvent,
  GameCompletedEvent,
  MatchCompletedEvent,
} from "@/types/socket.type";

interface UseMatchSocketOptions {
  matchId: string;
  matchCategory: "individual" | "team";
  role: "scorer" | "viewer";
  enabled?: boolean;
}

interface UseMatchSocketReturn {
  socket: ReturnType<typeof useSocket>["socket"];
  isConnected: boolean;
  isJoined: boolean;
  setIsUpdating: (value: boolean) => void;
}

/**
 * High-level hook for managing socket connection and event handling for matches
 * @param options - Configuration options
 * @returns Socket instance, connection status, join status, and update flag setter
 */
export function useMatchSocket(options: UseMatchSocketOptions): UseMatchSocketReturn {
  const { matchId, matchCategory, role, enabled = true } = options;

  const { socket, isConnected } = useSocket({ enabled });
  const [isJoined, setIsJoined] = useState(false);

  // Track if scorer is currently updating (to prevent processing own updates)
  const isUpdatingRef = useRef(false);

  // Zustand store
  const match = useMatchStore((state) => state.match);
  const setMatch = useMatchStore((state) => state.setMatch);
  const fetchMatch = useMatchStore((state) => state.fetchMatch);

  // Join match room when connected
  useEffect(() => {
    if (!socket || !isConnected || !matchId || !enabled) {
      return;
    }

    

    socket.emit("join:match", {
      matchId,
      role,
    });

    setIsJoined(true);
    
    // Verify join was successful
    socket.once("viewer:joined", (data) => {
      
    });

    // If late joiner (no match data yet), fetch current state
    if (!match) {
      
      fetchMatch(matchId, matchCategory).catch((err) => {
        console.error("[MatchSocket] Failed to fetch match state:", err);
      });
    }

    // Leave room on unmount
    return () => {
      if (socket) {
        
        socket.emit("leave:match", { matchId });
        setIsJoined(false);
      }
    };
  }, [socket, isConnected, matchId, matchCategory, role, enabled]);

  // Handler: Score Update
  const handleScoreUpdate = useCallback(
    (data: ScoreUpdateEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
        
        return;
      }

      // Only process updates for this match
      if (data.matchId !== matchId) {
        return;
      }

      if (!match) {
        // Fetch full match if we don't have it
        fetchMatch(matchId, matchCategory);
        return;
      }

      // Update match state based on score update
      const updatedMatch: any = { ...match };

      if (matchCategory === "individual" && "games" in updatedMatch) {
        // Find or create current game
        let currentGame = updatedMatch.games.find(
          (g: any) => g.gameNumber === data.gameNumber
        );

        if (!currentGame) {
          currentGame = {
            gameNumber: data.gameNumber,
            side1Score: 0,
            side2Score: 0,
            shots: [],
            winnerSide: null,
            completed: false,
          };
          updatedMatch.games.push(currentGame);
        }

        // Update scores
        currentGame.side1Score = data.side1Score ?? 0;
        currentGame.side2Score = data.side2Score ?? 0;
        currentGame.completed = data.gameCompleted ?? false;
        currentGame.winnerSide = data.gameWinner;

        // Update server
        updatedMatch.currentServer = data.currentServer;

        // Update sets
        if (data.finalScore) {
          updatedMatch.finalScore = {
            side1Sets: data.finalScore.side1Sets ?? 0,
            side2Sets: data.finalScore.side2Sets ?? 0,
          };
        }
      }

      setMatch(updatedMatch);
    },
    [role, matchId, matchCategory, match, setMatch, fetchMatch]
  );

  // Handler: Shot Recorded
  const handleShotRecorded = useCallback(
    (data: ShotRecordedEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
        
        return;
      }

      if (data.matchId !== matchId || !match) {
        return;
      }

      // Update match state with new shot
      const updatedMatch: any = { ...match };

      if (matchCategory === "individual" && "games" in updatedMatch) {
        const currentGame = updatedMatch.games.find(
          (g: any) => g.gameNumber === data.gameNumber
        );

        if (currentGame) {
          currentGame.shots = currentGame.shots || [];
          // Check if shot already exists (by timestamp or shotNumber)
          const shotExists = currentGame.shots.some(
            (s: any) =>
              s.timestamp?.toString() === data.shot.timestamp?.toString() ||
              s.shotNumber === data.shot.shotNumber
          );

          if (!shotExists) {
            currentGame.shots.push(data.shot);
          }
        }
      }

      setMatch(updatedMatch);
    },
    [role, matchId, matchCategory, match, setMatch]
  );

  // Handler: Server Change
  const handleServerChange = useCallback(
    (data: ServerChangeEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
       
        return;
      }

      if (data.matchId !== matchId || !match) {
        return;
      }

      // Update match state with new server
      const updatedMatch: any = { ...match };
      updatedMatch.currentServer = data.currentServer;

      setMatch(updatedMatch);
    },
    [role, matchId, match, setMatch]
  );

  // Handler: Game Completed
  const handleGameCompleted = useCallback(
    (data: GameCompletedEvent) => {
      

      if (data.matchId !== matchId || !match) {
        return;
      }

      // Refetch to get full updated state
      fetchMatch(matchId, matchCategory);
    },
    [matchId, matchCategory, match, fetchMatch]
  );

  // Handler: Match Completed
  const handleMatchCompleted = useCallback(
    (data: MatchCompletedEvent) => {
      

      if (data.matchId !== matchId) {
        return;
      }

      // Refetch to get full final state
      fetchMatch(matchId, matchCategory);
    },
    [matchId, matchCategory, fetchMatch]
  );

  // Register event listeners
  useSocketEvent(socket, "score:update", handleScoreUpdate);
  useSocketEvent(socket, "shot:recorded", handleShotRecorded);
  useSocketEvent(socket, "server:change", handleServerChange);
  useSocketEvent(socket, "game:completed", handleGameCompleted);
  useSocketEvent(socket, "match:completed", handleMatchCompleted);

  // Function to set updating flag (called by scorer before/after updates)
  const setIsUpdating = useCallback((value: boolean) => {
    isUpdatingRef.current = value;
  }, []);

  return {
    socket,
    isConnected,
    isJoined,
    setIsUpdating,
  };
}
