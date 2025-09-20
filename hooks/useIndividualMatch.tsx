// /hooks/useIndividualMatch.ts
import { create } from "zustand";
import { toast } from "sonner";
import { useMatchStore } from "@/hooks/useMatchStore";

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

  setIsMatchActive: (active: boolean) => void;
  resetGame: () => void;
  updateScore: (
    player: PlayerKey,
    increment: number,
    shotType?: string
  ) => Promise<void>;
  subtractPoint: (player: PlayerKey) => Promise<void>;
  toggleMatch: () => void;
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

    // doubles / mixed_doubles
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

    setIsMatchActive: (active) => set({ isMatchActive: active }),

    resetGame: () => {
      set({
        player1Score: 0,
        player2Score: 0,
        currentServer: "player1",
      });
      toast.success("Game reset");
    },

    updateScore: async (player, increment, shotType) => {
      const match = useMatchStore.getState().match;
      const pendingPlayer = useMatchStore.getState().pendingPlayer; // ✅ new
      if (!match) {
        console.warn("updateScore called but match is null");
        return;
      }

      const { player1Score, player2Score, currentGame } = get();
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
        player1Score: newP1,
        player2Score: newP2,
        side1Score: newP1,
        side2Score: newP2,
        gameWinner,
      };

      if (shotType && increment > 0) {
        requestBody.shotData = {
          side: player === "player1" ? "side1" : "side2",
          player: pendingPlayer?.playerId, // ✅ exact playerId from PlayerCard
          shotType,
          result: "winner",
        };
      }

      try {
        const url = `/api/matches/individual/${match._id}/score`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          console.error("score update failed", resp.status, text);
          throw new Error(`HTTP ${resp.status}: ${text}`);
        }

        const data = await resp.json();

        // refresh store with updated match
        try {
          const fetcher = useMatchStore.getState().fetchIndividualMatch;
          if (typeof fetcher === "function") {
            await fetcher(match._id);
          } else if (data?.match) {
            useMatchStore.getState().setMatch(data.match);
          }
        } catch (e) {
          if (data?.match) {
            useMatchStore.getState().setMatch(data.match);
          }
        }

        // local state update
        set({ player1Score: newP1, player2Score: newP2 });
        const nextServer = computeNextServer(match, newP1, newP2);
        set({ currentServer: nextServer });

        if (gameWinner) {
          toast.success(
            `Game ${currentGame} won by ${
              gameWinner === "side1"
                ? match.participants?.[0]?.fullName ?? "Player 1"
                : match.participants?.[1]?.fullName ?? "Player 2"
            }`
          );

          setTimeout(() => {
            set({
              currentGame: currentGame + 1,
              player1Score: 0,
              player2Score: 0,
              currentServer:
                match.matchType === "doubles" ||
                match.matchType === "mixed_doubles"
                  ? (() => {
                      const rotation: ServerKey[] = [
                        "player1_main",
                        "player2_main",
                        "player1_partner",
                        "player2_partner",
                      ];
                      const idx = rotation.indexOf(nextServer as ServerKey);
                      return rotation[(idx + 1) % rotation.length];
                    })()
                  : "player1",
            });
          }, 700);
        }
      } catch (err) {
        console.error("updateScore error", err);
        toast.error("Failed to update score");
      }
    },

    subtractPoint: async (player) => {
      await get().updateScore(player, -1);
    },

    toggleMatch: () => {
      const { isMatchActive } = get();
      set({ isMatchActive: !isMatchActive });
      toast.success(isMatchActive ? "Match paused" : "🏁 Match started!");
    },
  };
});
