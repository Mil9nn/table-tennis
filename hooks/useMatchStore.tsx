import { toast } from "sonner";
import { create } from "zustand";

type Player = "player1" | "player2" | null;

interface Match {
  _id: string;
  matchCategory: string;
  matchType: string;
  numberOfSets: number;
  city: string;
  status: string;
  players?: {
    player1?: { name: string };
    player2?: { name: string };
    player3?: { name: string };
    player4?: { name: string };
  };
  team1?: {
    name: string;
    players: Array<{ name: string; role: string }>;
  };
  team2?: {
    name: string;
    players: Array<{ name: string; role: string }>;
  };
  games: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner?: string;
    shots: Array<any>;
  }>;
  finalScore?: {
    player1Sets: number;
    player2Sets: number;
  };
  winner?: string;
}

interface MatchStore {
  shotDialogOpen: boolean;
  pendingPlayer: Player;

  match: Match | null;
  setMatch: (match: Match | null) => void;

  loading: boolean;

  updating: boolean;
  player1Score: number;
  player2Score: number;
  currentGame: number;
  currentServer: Player;
  isDeuce: boolean;
  serveCount: number;

  isMatchActive: boolean;

  setIsMatchActive: (active: boolean) => void;

  setShotDialogOpen: (open: boolean) => void;
  setPendingPlayer: (player: Player) => void;
  updateServingLogic: (player1Score: number, player2Score: number) => void;
  fetchMatch: () => Promise<void>;
  checkGameWon: (player1Score: number, player2Score: number) => Player;
  getPlayerName: (player: Player) => string;
  updateScore: (
    player: Player,
    increment: number,
    shotType?: string
  ) => Promise<void>;
  resetGame: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  match: null,
  setMatch: (match) => set({ match }),

  loading: false,

  shotDialogOpen: false,
  pendingPlayer: null,

  player1Score: 0,
  player2Score: 0,
  currentGame: 1,
  currentServer: "player1",
  isDeuce: false,
  serveCount: 0,

  isMatchActive: false,
  updating: false,

  setIsMatchActive: (active) => set({ isMatchActive: active }),

  setShotDialogOpen: (open) => set({ shotDialogOpen: open }),
  setPendingPlayer: (player) => set({ pendingPlayer: player }),

  updateServingLogic: (p1Score, p2Score) => {
    const totalPoints = p1Score + p2Score;
    const deuce = p1Score >= 10 && p2Score >= 10;

    set({ isDeuce: deuce });

    if (deuce) {
      set({
        currentServer: totalPoints % 2 === 0 ? "player1" : "player2",
        serveCount: 0,
      });
    } else {
      const serveCycle = Math.floor(totalPoints / 2);
      set({
        currentServer: serveCycle % 2 === 0 ? "player1" : "player2",
        serveCount: totalPoints % 2,
      });
    }
  },

  fetchMatch: async (matchId) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch match");
      }

      const data = await response.json();
      set({ match: data.match });

      // Initialize current game scores
      const games = data.match.games || [];
      if (games.length > 0) {
        const latestGame = games[games.length - 1];

        // Only set scores if the game is not completed
        if (!latestGame.winner) {
          set({ currentGame: latestGame.gameNumber });
          set({ player1Score: latestGame.player1Score });
          set({ player2Score: latestGame.player2Score });
          get().updateServingLogic(
            latestGame.player1Score,
            latestGame.player2Score
          );
        } else {
          // If latest game is completed, prepare for next game
          const nextGameNumber = latestGame.gameNumber + 1;
          set({ currentGame: nextGameNumber });
          set({ player1Score: 0 });
          set({ player2Score: 0 });
          set({ currentServer: "player1" });
          set({ serveCount: 0 });
          set({ isDeuce: false });
        }

        // Set match as active if it's in progress
        if (data.match.status === "in_progress") {
          set({ isMatchActive: true });
        }
      } else {
        // No games yet, start fresh
        set({ currentGame: 1 });
        set({ player1Score: 0 });
        set({ player2Score: 0 });
        set({ currentServer: "player1" });
        set({ serveCount: 0 });
        set({ isDeuce: false });
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      toast.error("Failed to load match");
    } finally {
        set({ loading: false });
    }
  },

  checkGameWon: (p1Score, p2Score) => {
    if ((p1Score >= 11 || p2Score >= 11) && Math.abs(p1Score - p2Score) >= 2) {
      return p1Score > p2Score ? "player1" : "player2";
    }
    return null;
  },

  getPlayerName: (player) => {
    const match = get().match;
    if (!match) return player === "player1" ? "Player 1" : "Player 2";

    if (match.matchCategory === "individual") {
      if (match.matchType === "singles") {
        return player === "player1"
          ? match.players?.player1?.name || "Player 1"
          : match.players?.player2?.name || "Player 2";
      } else {
        // Doubles or Mixed Doubles
        return player === "player1"
          ? `${match.players?.player1?.name || "P1A"} / ${
              match.players?.player2?.name || "P1B"
            }`
          : `${match.players?.player3?.name || "P2A"} / ${
              match.players?.player4?.name || "P2B"
            }`;
      }
    } else {
      return player === "player1"
        ? match.team1?.name || "Team 1"
        : match.team2?.name || "Team 2";
    }
  },

  updateScore: async (player, increment, shotType) => {
    const {
      updating,
      player1Score,
      player2Score,
      currentGame,
      match,
      checkGameWon,
      updateServingLogic,
      getPlayerName,
    } = get();
    if (updating || !match) return;

    set({ updating: true });

    const newPlayer1Score =
      player === "player1" ? player1Score + increment : player1Score;
    const newPlayer2Score =
      player === "player2" ? player2Score + increment : player2Score;

    if (newPlayer1Score < 0 || newPlayer2Score < 0) {
      set({ updating: false });
      return;
    }

    const gameWinner = checkGameWon(newPlayer1Score, newPlayer2Score);

    try {
      const response = await fetch(`/api/matches/${match._id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameNumber: currentGame,
          player1Score: newPlayer1Score,
          player2Score: newPlayer2Score,
          shotData:
            shotType && increment > 0
              ? { player, shotType, result: "winner" }
              : null,
          gameWinner,
        }),
      });

      if (!response.ok) throw new Error("Failed to update score");

      const data = await response.json();
      set({
        match: data.match,
        player1Score: newPlayer1Score,
        player2Score: newPlayer2Score,
      });

      updateServingLogic(newPlayer1Score, newPlayer2Score);

      if (gameWinner) {
        if (data.match.status === "completed") {
          toast.success(
            `🏆 Match completed! Winner: ${
              data.match.winner === "player1"
                ? getPlayerName("player1")
                : getPlayerName("player2")
            }`
          );
          set({ isMatchActive: false });
        } else {
          toast.success(
            `🎾 Game ${currentGame} won by ${
              gameWinner === "player1"
                ? getPlayerName("player1")
                : getPlayerName("player2")
            }`
          );

          setTimeout(() => {
            set({
              currentGame: currentGame + 1,
              player1Score: 0,
              player2Score: 0,
              currentServer: "player1",
              serveCount: 0,
              isDeuce: false,
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error updating score:", err);
      toast.error("Failed to update score");
    } finally {
      set({ updating: false });
    }
  },


  // Reset game scores and states
  resetGame: () => {
    set({ player1Score: 0 });
    set({ player2Score: 0 });
    set({ currentServer: "player1" });
    set({ serveCount: 0 });
    set({ isDeuce: false });
      toast.success("Game scores reset");
    },
}));
