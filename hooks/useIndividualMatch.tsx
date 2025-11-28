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
      match.matchType === "doubles" || match.matchType === "mixed_doubles";

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

        const winnerName =
          matchWinner === "side1"
            ? match.participants?.[0]?.fullName ||
              match.participants?.[0]?.username ||
              "Side 1"
            : match.participants?.[1]?.fullName ||
              match.participants?.[1]?.username ||
              "Side 2";

        toast.success(`🏆 MATCH COMPLETED! Winner: ${winnerName}`);
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

      const actualStatus: MatchStatus = match.status;

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
      }
    ) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      const pendingPlayer = useMatchStore.getState().pendingPlayer;

      if (!match) return;

      const { side1Score, side2Score, currentGame, isMatchActive, status } =
        get();

      // Block updates for completed matches
      if (status === "completed") {
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

      // Shot Data
      if (increment > 0) {
        let shotPlayerId = playerId || pendingPlayer?.playerId;

        if (!shotPlayerId) {
          const isDoubles =
            match.matchType === "doubles" ||
            match.matchType === "mixed_doubles";
          if (isDoubles) {
            shotPlayerId =
              player === "side1"
                ? match.participants?.[0]?._id
                : match.participants?.[2]?._id;
          } else {
            shotPlayerId =
              player === "side1"
                ? match.participants?.[0]?._id
                : match.participants?.[1]?._id;
          }
        }

        if (shotPlayerId) {
          let serverId: string | null = null;

          const currentServer = get().currentServer;

          if (currentServer) {
            if (currentServer.startsWith("side1")) {
              serverId = match.participants?.[0]?._id?.toString();
            } else if (currentServer.startsWith("side2")) {
              serverId =
                match.participants?.[
                  match.matchType === "singles" ? 1 : 2
                ]?._id?.toString();
            }
          }

          requestBody.shotData = {
            side: player,
            player: shotPlayerId,
            stroke: shotType,
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
      const { isMatchActive, status, currentGame, match } = get();

      if (status === "completed") {
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

      if (!match) return;

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
