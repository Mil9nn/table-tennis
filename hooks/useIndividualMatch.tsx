import { create } from "zustand";
import { toast } from "sonner";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  checkGameWon,
  checkMatchWonBySets,
  flipDoublesRotationForNextGame,
  getNextServer,
} from "@/components/live-scorer/individual/helpers";
import {
  IndividualMatch,
  MatchStatus,
  IndividualGame,
  InitialServerConfig,
  PlayerKey,
} from "@/types/match.type";

type ServerKey =
  | "side1"
  | "side2"
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner"
  | null;

export interface IndividualMatchState {
  match?: IndividualMatch | null;
  side1Score: number;
  side2Score: number;
  currentServer: ServerKey;
  currentGame: number;
  isMatchActive: boolean;
  side1Sets: number;
  side2Sets: number;
  status: MatchStatus;
  isStartingMatch?: boolean;

  setInitialMatch: (match: IndividualMatch) => void;
  resetGame: (fullReset?: boolean) => Promise<void>;
  updateScore: (
    player: PlayerKey,
    increment: number,
    shotType?: string,
    playerId?: string,
    shotLocationData?: {
      originX: number;
      originY: number;
      landingX: number;
      landingY: number;
      serveType?: string | null;
    }
  ) => Promise<void>;
  subtractPoint: (player: PlayerKey) => Promise<void>;
  toggleMatch: () => Promise<void>;
  swapSides: () => Promise<void>;
  isUpdatingScore?: boolean;
  isUndoing?: boolean;
}

export const useIndividualMatch = create<IndividualMatchState>((set, get) => {
  // compute next server based on match type + current score
  const computeNextServer = (
    match: IndividualMatch,
    p1: number,
    p2: number
  ): ServerKey => {
    if (!match) return "side1";

    const isDoubles =
      match.matchType === "doubles";

    // Try to read server config from a few possible locations for flexibility/compatibility
    const serverConfig: InitialServerConfig = {
      firstServer:
        match.serverConfig?.firstServer || (isDoubles ? "side1_main" : "side1"),
      firstReceiver:
        match.serverConfig?.firstReceiver || (isDoubles ? "side2_main" : null),
      serverOrder: match.serverConfig?.serverOrder || undefined,
    };

    const serverResult = getNextServer(
      p1,
      p2,
      isDoubles,
      serverConfig,
      match.currentGame
    );

    return serverResult.server as ServerKey;
  };

  const checkAndCompleteMatch = async (
    newSide1Sets: number,
    newSide2Sets: number,
    match: IndividualMatch
  ) => {
    const matchWinner = checkMatchWonBySets(
      newSide1Sets,
      newSide2Sets,
      match.numberOfSets
    );

    if (matchWinner) {
      try {
        // Update match status to completed on server
        await axiosInstance.post(`/matches/individual/${match._id}/status`, {
          status: "completed",
          winnerSide: matchWinner,
        });

        set({
          status: "completed",
          isMatchActive: false,
          side1Sets: newSide1Sets,
          side2Sets: newSide2Sets,
        });

        return true;
      } catch (err) {
        console.error("Failed to complete match:", err);
        toast.error("Failed to complete match");
      }
    }
    return false;
  };

  return {
    // initial UI state
    side1Score: 0,
    side2Score: 0,
    currentServer: null,
    currentGame: 1,
    isMatchActive: false,
    side1Sets: 0,
    side2Sets: 0,
    status: "scheduled" as MatchStatus,
    isStartingMatch: false,
    isUpdatingScore: false,
    isUndoing: false,

    // initialize state from server match payload
    // inside useIndividualMatch.tsx — replace setInitialMatch implementation
    setInitialMatch: (match) => {
      if (!match) return;

      const actualStatus: MatchStatus = match.status;

      // Handle completed matches explicitly
      if (actualStatus === "completed") {
        // For completed matches, all games have winnerSide, so we can't find an active game
        // Set scores to 0 (doesn't matter since match is done)
        // Use the last game number from games array or match.currentGame
        const lastGameNumber = match.games?.length 
          ? Math.max(...match.games.map((g: IndividualGame) => g.gameNumber || 0))
          : (match.currentGame ?? 1);

        set({
          match,
          currentServer: (match.currentServer as ServerKey) ?? null,
          side1Score: 0,
          side2Score: 0,
          currentGame: lastGameNumber,
          side1Sets: match.finalScore?.side1Sets ?? 0,
          side2Sets: match.finalScore?.side2Sets ?? 0,
          status: "completed",
          isMatchActive: false,
        });
        return;
      }

      // For active matches, use existing logic
      const currentGameNum = match.currentGame ?? 1;

      const currentGameObj = match.games?.find(
        (g: IndividualGame) => g.gameNumber === currentGameNum && !g.winnerSide
      );

      const p1 = currentGameObj?.side1Score ?? 0;
      const p2 = currentGameObj?.side2Score ?? 0;

      // ✅ Prefer persisted currentServer from DB if it exists — even if it's null
      let nextServer: ServerKey | null = null;
      if (match.currentServer) {
        nextServer = match.currentServer as ServerKey;
      } else if (match.serverConfig?.firstServer) {
        // Fall back to computed server using serverOrder + currentGame (handles doubles flip)
        nextServer = computeNextServer(match, p1, p2);
      } else {
        nextServer = null;
      }

      set({
        match,
        currentServer: nextServer,
        side1Score: p1,
        side2Score: p2,
        currentGame: currentGameNum,
        side1Sets: match.finalScore?.side1Sets ?? 0,
        side2Sets: match.finalScore?.side2Sets ?? 0,
        status: actualStatus,
        isMatchActive: actualStatus === "in_progress",
      });
    },

    // reset game or whole match (server-side)
    resetGame: async (fullReset = false) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) {
        toast.error("No match loaded");
        return;
      }

      if (!match._id) {
        toast.error("Invalid match ID");
        return;
      }

      const resetType =
        fullReset || match.status === "completed" ? "match" : "game";

      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/reset`,
          { resetType }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          // best-effort: initialize local store with returned match
          get().setInitialMatch(data.match as IndividualMatch);
          toast.success(
            resetType === "match" ? "Match restarted" : "Game reset"
          );
        }
      } catch (err: any) {
        console.error("resetGame error", err);
        const errorMessage = err?.response?.data?.error || err?.message || "Failed to reset game";
        toast.error(errorMessage);
      }
    },

    // update score (and optionally send shot data)
    updateScore: async (
      player,
      increment,
      shotType,
      playerId,
      shotLocationData?: {
        originX: number;
        originY: number;
        landingX: number;
        landingY: number;
        serveType?: string | null;
      }
    ) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      const pendingPlayer = useMatchStore.getState().pendingPlayer;

      if (!match) return;

      const { side1Score, side2Score, currentGame, isMatchActive, status } =
        get();

      // Block updates for completed matches - check both match prop (server data) and hook state
      if (match.status === "completed" || status === "completed") {
        console.warn("Attempted to score on completed match", { matchId: match._id, matchStatus: match.status, hookStatus: status });
        toast.error("Match is completed! Reset to continue.");
        return;
      }

      // Auto-start match if scheduled (not yet started)
      if (!isMatchActive && status === "scheduled") {
        try {
          await get().toggleMatch();
          // Wait a bit for the toggle to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to auto-start match:", error);
          toast.error("Failed to start the match");
          return;
        }
      } else if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }

      const newP1 = player === "side1" ? side1Score + increment : side1Score;
      const newP2 = player === "side2" ? side2Score + increment : side2Score;

      if (newP1 < 0 || newP2 < 0) return;

      // Detect if game is won
      const gameWinnerSide = checkGameWon(newP1, newP2);

      const requestBody: any = {
        gameNumber: currentGame,
        side1Score: newP1,
        side2Score: newP2,
        gameWinner: gameWinnerSide,
      };

      // Shot Data - Create shot data for both detailed and simple mode
      // In detailed mode: includes stroke and coordinates
      // In simple mode: includes only player, side, and server (for commentary)
      if (increment > 0) {
        // Use the explicitly passed playerId first, then fallback to pendingPlayer
        // Only use fallback defaults if neither is available
        let shotPlayerId: string | undefined = undefined;
        
        // Check if playerId was explicitly passed (even if it's an empty string, we want to know)
        if (playerId !== undefined && playerId !== null && playerId !== "") {
          shotPlayerId = playerId;
        } else if (pendingPlayer?.playerId) {
          shotPlayerId = pendingPlayer.playerId;
        }

        // Only use default fallback if no player was explicitly selected
        // This ensures we respect the user's selection
        if (!shotPlayerId) {
          const isDoubles =
            (match.matchType as string) === "doubles" ||
            (match.matchType as string) === "mixed_doubles";
          if (isDoubles) {
            // For doubles, default to first player on the side (not server)
            shotPlayerId =
              player === "side1"
                ? match.participants?.[0]?._id?.toString()
                : match.participants?.[2]?._id?.toString();
          } else {
            // For singles, there's only one player per side
            shotPlayerId =
              player === "side1"
                ? match.participants?.[0]?._id?.toString()
                : match.participants?.[1]?._id?.toString();
          }
        }

        // Ensure shotPlayerId is a string
        if (shotPlayerId) {
          shotPlayerId = typeof shotPlayerId === 'string' ? shotPlayerId : String(shotPlayerId);
          let serverId: string | null = null;

          const currentServer = get().currentServer;

          if (currentServer) {
            const isDoubles = (match.matchType as string) === "doubles" || (match.matchType as string) === "mixed_doubles";
            
            if (isDoubles) {
              // For doubles, map rotation key to participant index correctly
              // "side1_main" -> participants[0]
              // "side1_partner" -> participants[1]
              // "side2_main" -> participants[2]
              // "side2_partner" -> participants[3]
              if (currentServer === "side1_main") {
                serverId = match.participants?.[0]?._id?.toString();
              } else if (currentServer === "side1_partner") {
                serverId = match.participants?.[1]?._id?.toString();
              } else if (currentServer === "side2_main") {
                serverId = match.participants?.[2]?._id?.toString();
              } else if (currentServer === "side2_partner") {
                serverId = match.participants?.[3]?._id?.toString();
              }
            } else {
              // For singles, map side to participant index
              if (currentServer === "side1") {
                serverId = match.participants?.[0]?._id?.toString();
              } else if (currentServer === "side2") {
                serverId = match.participants?.[1]?._id?.toString();
              }
            }
          }

          requestBody.shotData = {
            side: player,
            player: shotPlayerId,
            stroke: shotType || null, // null in simple mode
            serveType: shotLocationData?.serveType || null,
            server: serverId,
            originX: shotLocationData?.originX,
            originY: shotLocationData?.originY,
            landingX: shotLocationData?.landingX,
            landingY: shotLocationData?.landingY,
          };
        }
      }

      set({ isUpdatingScore: true });
      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/score`,
          requestBody
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);

          // if game winner, either complete match or advance to next game
          if (gameWinnerSide) {
            const newSide1Sets = data.match.finalScore?.side1Sets ?? 0;
            const newSide2Sets = data.match.finalScore?.side2Sets ?? 0;

            if (match.matchType !== "singles") {
              const newRotation = flipDoublesRotationForNextGame(
                match.serverConfig?.serverOrder || []
              );
              if (match.serverConfig) {
                match.serverConfig.serverOrder = newRotation;
              }
            }

            const matchCompleted = await checkAndCompleteMatch(
              newSide1Sets,
              newSide2Sets,
              match
            );

            if (!matchCompleted) {
              const nextGameNum = currentGame + 1;

              set({
                currentGame: nextGameNum,
                side1Score: 0,
                side2Score: 0,
                currentServer: data.match.currentServer as ServerKey,
                side1Sets: newSide1Sets,
                side2Sets: newSide2Sets,
              });

              toast.success(
                `Game ${currentGame} won! Starting Game ${nextGameNum}`
              );
            }
          } else {
            set({
              side1Score: newP1,
              side2Score: newP2,
              currentServer: data.match.currentServer as ServerKey,
            });
          }
        }
      } catch (err) {
        console.error("updateScore error", err);
        toast.error("❌ Failed to update score");
      } finally {
        set({ isUpdatingScore: false });
      }
    },

    subtractPoint: async (player) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) return;

      const { isMatchActive, status, currentGame } = get();

      // Block updates for completed matches - check both match prop (server data) and hook state
      if (match.status === "completed" || status === "completed") {
        console.warn("Attempted to subtract point on completed match", { matchId: match._id, matchStatus: match.status, hookStatus: status });
        toast.error("⛔ Match is completed!");
        return;
      }

      // Auto-start match if scheduled (not yet started)
      if (!isMatchActive && status === "scheduled") {
        try {
          await get().toggleMatch();
          // Wait a bit for the toggle to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to auto-start match:", error);
          toast.error("Failed to start the match");
          return;
        }
      } else if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }

      set({ isUndoing: true });
      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/score`,
          {
            action: "subtract",
            side: player,
            gameNumber: currentGame,
          }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);

          // update local score from returned match
          const game = data.match.games.find(
            (g: any) => g.gameNumber === currentGame
          );
          if (game) {
            set({
              side1Score: game.side1Score,
              side2Score: game.side2Score,
              currentServer: data.match.currentServer as ServerKey,
            });
          }
        }
      } catch (err) {
        console.error("subtractPoint error", err);
        toast.error("❌ Failed to subtract point");
      } finally {
        set({ isUndoing: false });
      }
    },

    // toggle match start/pause
    toggleMatch: async () => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) return;

      const currentStatus = get().status;

      if (currentStatus === "completed") {
        toast.error("Match is completed! Reset to restart.");
        return;
      }

      const nextStatus: MatchStatus =
        currentStatus === "in_progress" ? "scheduled" : "in_progress";

      set({ isStartingMatch: true });
      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/status`,
          { status: nextStatus }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          set({
            status: nextStatus as MatchStatus,
            isMatchActive: nextStatus === "in_progress",
          });

          if (nextStatus === "in_progress") {
            toast.success("🏁 Match started!");

            // Show server dialog if no server config exists
            if (!match.serverConfig?.firstServer) {
              setTimeout(() => {
                useMatchStore.getState().setServerDialogOpen(true);
              }, 500);
            }
          } else {
            toast.success("⏸️ Match paused");
          }
        }
      } catch (err) {
        console.error("toggleMatch error", err);
        toast.error("Failed to update match status");
      } finally {
        set({ isStartingMatch: false });
      }
    },

    // swap player sides (data-based swap)
    swapSides: async () => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) return;

      set({ isUpdatingScore: true });
      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/swap`
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          // Update local state to reflect the swapped server
          get().setInitialMatch(data.match as IndividualMatch);
          toast.success("Players swapped!");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to swap players");
      } finally {
        set({ isUpdatingScore: false });
      }
    },
  };
});
