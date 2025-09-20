import { create } from "zustand";
import { toast } from "sonner";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";

export type PlayerKey = "player1" | "player2" | null;
type ServerKey =
  | "player1"
  | "player2"
  | "player1_main"
  | "player1_partner"
  | "player2_main"
  | "player2_partner";

interface IndividualMatchState {
  player1Score: number;
  player2Score: number;
  currentServer: ServerKey;
  currentGame: number;
  isMatchActive: boolean;
  side1Sets: number;
  side2Sets: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";

  setInitialMatch: (match: any) => void;
  resetGame: (fullReset?: boolean) => Promise<void>;
  updateScore: (
    player: PlayerKey,
    increment: number,
    shotType?: string
  ) => Promise<void>;
  subtractPoint: (player: PlayerKey) => Promise<void>;
  toggleMatch: () => Promise<void>;
}

export const useIndividualMatch = create<IndividualMatchState>((set, get) => {
  // helper: compute server for singles/doubles
  const computeNextServer = (
    match: ReturnType<typeof useMatchStore.getState>["match"],
    p1: number,
    p2: number
  ): ServerKey => {
    const total = p1 + p2;
    const deuce = p1 >= 10 && p2 >= 10;

    if (!match) return "player1";

    if (match.matchType === "singles") {
      if (deuce) {
        return total % 2 === 0 ? "player1" : "player2";
      }
      const serveCycle = Math.floor(total / 2);
      return serveCycle % 2 === 0 ? "player1" : "player2";
    }

    const rotation: ServerKey[] = [
      "player1_main",
      "player2_main",
      "player1_partner",
      "player2_partner",
    ];

    if (deuce) {
      return rotation[total % rotation.length];
    }

    const cycleIndex = Math.floor(total / 2) % rotation.length;
    return rotation[cycleIndex];
  };

  return {
    player1Score: 0,
    player2Score: 0,
    currentServer: "player1",
    currentGame: 1,
    isMatchActive: false,
    side1Sets: 0,
    side2Sets: 0,
    status: "scheduled",

    setInitialMatch: (match) => {
      if (!match) return;

      const currentGameNum = match.currentGame ?? 1;
      const idx = Math.max(0, currentGameNum - 1);
      const currentGameObj = match.games?.[idx] ?? null;

      const p1 = currentGameObj?.side1Score ?? 0;
      const p2 = currentGameObj?.side2Score ?? 0;

      const nextServer = computeNextServer(match, p1, p2);

      set({
        player1Score: p1,
        player2Score: p2,
        currentGame: currentGameNum,
        currentServer: nextServer,
        side1Sets: match.finalScore?.side1Sets ?? 0,
        side2Sets: match.finalScore?.side2Sets ?? 0,
        status: match.status,
        isMatchActive: match.status === "in_progress",
      });
    },

    resetGame: async (fullReset = false) => {
      const match = useMatchStore.getState().match;
      if (!match) return;

      const resetType =
        fullReset || match.status === "completed" ? "match" : "game";

      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/reset`,
          { resetType }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          get().setInitialMatch(data.match);
          toast.success(
            resetType === "match" ? "Match restarted" : "Game reset"
          );
        }
      } catch (err) {
        console.error("resetGame error", err);
        toast.error("Failed to reset game");
      }
    },

    updateScore: async (player, increment, shotType) => {
      const match = useMatchStore.getState().match;
      const pendingPlayer = useMatchStore.getState().pendingPlayer;

      if (!match) return;

      const { player1Score, player2Score, currentGame, isMatchActive } = get();
      if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }

      const newP1 =
        player === "player1" ? player1Score + increment : player1Score;
      const newP2 =
        player === "player2" ? player2Score + increment : player2Score;

      if (newP1 < 0 || newP2 < 0) return;

      const gameWinner =
        (newP1 >= 11 || newP2 >= 11) && Math.abs(newP1 - newP2) >= 2
          ? newP1 > newP2
            ? "side1"
            : "side2"
          : null;

      const requestBody: any = {
        gameNumber: currentGame,
        side1Score: newP1,
        side2Score: newP2,
        gameWinner,
      };

      if (shotType && increment > 0) {
        requestBody.shotData = {
          side: player === "player1" ? "side1" : "side2",
          player: pendingPlayer?.playerId,
          shotType,
          result: "winner",
        };
      }

      // optimistic update
      set({ player1Score: newP1, player2Score: newP2 });
      const nextServer = computeNextServer(match, newP1, newP2);
      set({ currentServer: nextServer });

      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/score`,
          requestBody
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          get().setInitialMatch(data.match);
        }
      } catch (err) {
        console.error("updateScore error", err);
        toast.error("Failed to update score");
        set({ player1Score, player2Score }); // rollback
      }
    },

    subtractPoint: async (player) => {
      const { isMatchActive } = get();
      if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }
      await get().updateScore(player, -1);
    },

    toggleMatch: async () => {
      const match = useMatchStore.getState().match;
      if (!match) return;

      const nextStatus =
        get().status === "in_progress" ? "scheduled" : "in_progress";

      try {
        const { data } = await axiosInstance.post(
          `/matches/individual/${match._id}/status`,
          { status: nextStatus }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);
          get().setInitialMatch(data.match);
          toast.success(
            nextStatus === "in_progress" ? "🏁 Match started!" : "Match paused"
          );
        }
      } catch (err) {
        console.error("toggleMatch error", err);
        toast.error("Failed to update match status");
      }
    },
  };
});