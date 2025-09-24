import { create } from "zustand";
import { toast } from "sonner";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { checkGameWon, getNextServer } from "@/components/live-scorer/individual/helpers";
import { IndividualMatch, MatchStatus, IndividualGame } from "@/types/match.type";

export type PlayerKey = "side1" | "side2" | null;
type ServerKey =
  | "side1"
  | "side2"
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner";

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
    playerId?: string
  ) => Promise<void>;
  subtractPoint: (player: PlayerKey) => Promise<void>;
  toggleMatch: () => Promise<void>;
}

export const useIndividualMatch = create<IndividualMatchState>((set, get) => {
  // compute next server based on match type + current score
  const computeNextServer = (match: IndividualMatch, p1: number, p2: number): ServerKey => {
    if (!match) return "side1_main";

    const isDoubles =
      match.matchType === "doubles" || match.matchType === "mixed_doubles";
    const serverResult = getNextServer(p1, p2, isDoubles);

    return serverResult.server as ServerKey;
  };

  return {
    // initial UI state
    side1Score: 0,
    side2Score: 0,
    currentServer: "side1",
    currentGame: 1,
    isMatchActive: false,
    side1Sets: 0,
    side2Sets: 0,
    status: "scheduled" as MatchStatus,
    isStartingMatch: false,

    // initialize state from server match payload
    setInitialMatch: (match) => {
      if (!match) return;

      const currentGameNum = match.currentGame ?? 1;

      let currentGameObj = match.games?.find(
        (g: IndividualGame) => g.gameNumber === currentGameNum && !g.winnerSide && !g.completed
      );

      if (!currentGameObj) {
        currentGameObj = match.games?.find(
          (g: IndividualGame) => g.gameNumber === currentGameNum
        );
      }

      let p1: number, p2: number;
      if (
        currentGameObj &&
        !currentGameObj.winnerSide &&
        !currentGameObj.completed
      ) {
        p1 = currentGameObj.side1Score ?? 0;
        p2 = currentGameObj.side2Score ?? 0;
      } else {
        p1 = 0;
        p2 = 0;
      }

      const nextServer = computeNextServer(match, p1, p2);

      const actualStatus: MatchStatus = match.status;
      const isActive = actualStatus === "in_progress";

      set({
        match,
        side1Score: p1,
        side2Score: p2,
        currentGame: currentGameNum,
        currentServer: nextServer,
        side1Sets: match.finalScore?.side1Sets ?? 0,
        side2Sets: match.finalScore?.side2Sets ?? 0,
        status: actualStatus,
        isMatchActive: isActive,
      });
    },

    // reset game or whole match (server-side)
    resetGame: async (fullReset = false) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) return;

      const resetType = fullReset || match.status === "completed" ? "match" : "game";

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
            resetType === "match" ? "🔄 Match restarted" : "🔄 Game reset"
          );
        }
      } catch (err) {
        console.error("resetGame error", err);
        toast.error("Failed to reset game");
      }
    },

    // update score (and optionally send shot data)
    updateScore: async (player, increment, shotType, playerId) => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      const pendingPlayer = useMatchStore.getState().pendingPlayer;

      if (!match) return;

      const { side1Score, side2Score, currentGame, isMatchActive, status } =
        get();

      // Block updates for completed matches
      if (status === "completed") {
        toast.error("⛔ Match is completed! Reset to continue.");
        return;
      }

      if (!isMatchActive) {
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

      // Shot Data (if provided) — simplified logic (no rally tracking)
      if (shotType && increment > 0) {
        let shotPlayerId: string | undefined = playerId || pendingPlayer?.playerId;

        if (!shotPlayerId) {
          if (match.matchType === "doubles" || match.matchType === "mixed_doubles") {
            // conservative default: first player of side1 is index 0, side2 main at index 2
            const idx = player === "side1" ? 0 : 2;
            shotPlayerId = match.participants?.[idx]?._id;
          } else {
            const idx = player === "side1" ? 0 : 1;
            shotPlayerId = match.participants?.[idx]?._id;
          }
        }

        if (!shotPlayerId) {
          // last-resort fallback to any available participant id
          shotPlayerId = match.participants?.[0]?._id ?? match.participants?.[1]?._id;
        }

        const isError = shotType?.endsWith("_error");
        const outcome: "winner" | "error" | "let" = isError ? "error" : shotType === "let" ? "let" : "winner";
        const errorType: "net" | "long" | "serve" | null =
          shotType === "net_error" ? "net" :
          shotType === "long_error" ? "long" :
          shotType === "serve_error" ? "serve" : null;

        requestBody.shotData = {
          side: player,
          player: shotPlayerId,
          stroke: isError ? null : shotType,
          outcome,
          errorType,
        };
      }

      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/score`,
          requestBody
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);

          // if game winner, either complete match or advance to next game
          if (gameWinnerSide) {
            if (data.match.status === "completed") {
              set({
                status: "completed" as MatchStatus,
                side1Sets: data.match.finalScore?.side1Sets ?? 0,
                side2Sets: data.match.finalScore?.side2Sets ?? 0,
              });
              toast.success("🏆 MATCH COMPLETED!");
            } else {
              const nextGameNum = currentGame + 1;
              // compute next server from server's authoritative match if available
              const serverSource = (data.match as IndividualMatch) || match;
              const nextServer = computeNextServer(serverSource as IndividualMatch, 0, 0);

              set({
                currentGame: nextGameNum,
                side1Score: 0,
                side2Score: 0,
                currentServer: nextServer,
                side1Sets: data.match.finalScore?.side1Sets ?? 0,
                side2Sets: data.match.finalScore?.side2Sets ?? 0,
              });
              toast.success(`Game ${currentGame} won! Starting Game ${nextGameNum}`);
            }
          } else {
            // no game-winner, just update scores & server locally using authoritative match if provided
            const serverSource = (data.match as IndividualMatch) || match;
            const nextServer = computeNextServer(serverSource as IndividualMatch, newP1, newP2);
            set({
              side1Score: newP1,
              side2Score: newP2,
              currentServer: nextServer,
            });
          }
        }
      } catch (err) {
        console.error("updateScore error", err);
        toast.error("❌ Failed to update score");
      }
    },

    // subtract point (wrapper)
    subtractPoint: async (player) => {
      const { isMatchActive, status } = get();

      if (status === "completed") {
        toast.error("⛔ Match is completed!");
        return;
      }

      if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }

      await get().updateScore(player, -1);
    },

    // toggle match start/pause
    toggleMatch: async () => {
      const match = useMatchStore.getState().match as IndividualMatch | null;
      if (!match) return;

      const currentStatus = get().status;

      if (currentStatus === "completed") {
        toast.error("⛔ Match is completed! Reset to restart.");
        return;
      }

      const nextStatus: MatchStatus = currentStatus === "in_progress" ? "scheduled" : "in_progress";

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

          toast.success(
            nextStatus === "in_progress" ? "🏁 Match started!" : "⏸️ Match paused"
          );

          if (
            nextStatus === "in_progress" &&
            (match.matchType === "doubles" || match.matchType === "mixed_doubles")
          ) {
            useMatchStore.getState().setSetupDialogOpen(true);
          }
        }
      } catch (err) {
        console.error("toggleMatch error", err);
        toast.error("❌ Failed to update match status");
      } finally {
        set({ isStartingMatch: false });
      }
    },
  };
});