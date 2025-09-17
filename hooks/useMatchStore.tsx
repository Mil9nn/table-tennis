// /hooks/useMatchStore.ts
import { create } from "zustand";
import { toast } from "sonner";

/**
 * NOTE: This store normalizes incoming match documents (from /api/matches/:id)
 * into a canonical shape the UI expects so LiveScorer doesn't need to care
 * about whether the backend sent `players`, `participants`, `player1Score` or `side1Score` etc.
 */

type PlayerKey = "player1" | "player2" | null;

type TeamPlayer = { name: string; role?: string; id?: string };

type NormalTeam = {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  players: TeamPlayer[]; // normalized as objects
};

type NormalGame = {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winner?: string | null; // "player1" | "player2" | "team1" | "team2" | null
  currentPlayers?: { side1?: string; side2?: string };
  shots?: any[];
};

type NormalMatch = {
  _id: string;
  matchCategory: "individual" | "team";
  matchType: string;
  numberOfSets: number;
  city?: string;
  venue?: string;
  status?: string;
  scorer?: any;
  participants: string[]; // normalized participants (strings)
  team1?: NormalTeam | null;
  team2?: NormalTeam | null;
  games: NormalGame[];
  ties?: any[]; // keep as-is for team-tie-based formats
  finalScore: { side1Sets: number; side2Sets: number };
  winner?: string | null; // "player1" | "player2" | "team1" | "team2"
  createdAt?: string;
  updatedAt?: string;
};

interface MatchStore {
  // normalized match
  match: NormalMatch | null;
  setMatch: (m: NormalMatch | null) => void;

  // UI/dialog state
  loading: boolean;
  updating: boolean;
  shotDialogOpen: boolean;
  pendingPlayer: PlayerKey;

  // current active game state
  currentPlayers: { side1: string; side2: string };
  teamMatchOrder: string[]; // "A vs X" strings for display
  currentRound: number;

  // current in-game score (cached)
  player1Score: number;
  player2Score: number;
  currentGame: number;
  currentServer: PlayerKey;
  isDeuce: boolean;
  serveCount: number;
  isMatchActive: boolean;

  // actions
  setIsMatchActive: (active: boolean) => void;
  setShotDialogOpen: (open: boolean) => void;
  setPendingPlayer: (p: PlayerKey) => void;

  fetchMatch: (matchId: string) => Promise<void>;
  initializeTeamMatch: () => void;
  getTeamMatchOrder: () => string[];
  getCurrentPlayingPair: () => { side1: string; side2: string };

  getPlayerName: (player: PlayerKey) => string;
  getDetailedPlayerInfo: (player: PlayerKey) => { name: string; isTeam: boolean; players?: TeamPlayer[] };

  updateServingLogic: (p1Score: number, p2Score: number) => void;
  checkGameWon: (p1: number, p2: number) => PlayerKey | null;
  updateScore: (player: PlayerKey, increment: number, shotType?: string) => Promise<void>;
  resetGame: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  // Helper: normalize incoming team object (team may have players as strings or objects)
  const normalizeTeam = (team: any): NormalTeam | null => {
    if (!team) return null;
    const playersRaw = Array.isArray(team.players) ? team.players : [];
    const players: TeamPlayer[] = playersRaw
      .map((p: any) => {
        if (!p) return null;
        if (typeof p === "string") return { name: p };
        // p might be { name, role } or { username, fullName }
        return { name: p.name || p.username || p.fullName || String(p._id || ""), role: p.role || "" };
      })
      .filter(Boolean);
    return {
      id: team._id || team.id || null,
      name: team.name || null,
      city: team.city || null,
      players,
    };
  };

  // normalize raw match document from backend to canonical NormalMatch
  const normalizeMatch = (raw: any): NormalMatch => {
    // participants: prefer raw.participants array, fallback to old raw.players object
    let participants: string[] = [];
    if (Array.isArray(raw.participants) && raw.participants.length) {
      participants = raw.participants.map((p: any) => {
        if (!p) return "";
        if (typeof p === "string") return p;
        // could be object with name/username
        return p.name || p.username || p.fullName || String(p._id || "");
      }).filter(Boolean);
    } else if (raw.players) {
      // legacy players object { player1: { name }, player2: ... }
      const p1 = raw.players.player1?.name || raw.players.player1 || null;
      const p2 = raw.players.player2?.name || raw.players.player2 || null;
      const p3 = raw.players.player3?.name || raw.players.player3 || null;
      const p4 = raw.players.player4?.name || raw.players.player4 || null;
      participants = [p1, p2, p3, p4].filter(Boolean) as string[];
    }

    const team1 = normalizeTeam(raw.team1);
    const team2 = normalizeTeam(raw.team2);

    // normalize games
    const games: NormalGame[] = (Array.isArray(raw.games) ? raw.games : []).map((g: any) => {
      const side1Score = (g.side1Score ?? g.player1Score ?? g.player1Score ?? 0) as number;
      const side2Score = (g.side2Score ?? g.player2Score ?? g.player2Score ?? 0) as number;
      // winner might be 'player1'/'player2' or 'team1'/'team2' — leave it as-is but adapt for UI
      const winner = g.winner ?? null;
      // currentPlayers: try different shapes
      let currentPlayers = { side1: "", side2: "" };
      if (g.currentPlayers) {
        currentPlayers.side1 = (g.currentPlayers.player1 ?? g.currentPlayers.side1 ?? (g.currentPlayers.team1 && g.currentPlayers.team1[0]) ?? "") as string;
        currentPlayers.side2 = (g.currentPlayers.player2 ?? g.currentPlayers.side2 ?? (g.currentPlayers.team2 && g.currentPlayers.team2[0]) ?? "") as string;
      }
      return {
        ...g,
        gameNumber: g.gameNumber ?? (g._id ? Number(g._id) : 0),
        side1Score,
        side2Score,
        winner,
        currentPlayers,
        shots: g.shots ?? [],
      } as NormalGame;
    });

    const finalScore = {
      side1Sets: raw.finalScore?.side1Sets ?? raw.finalScore?.player1Sets ?? 0,
      side2Sets: raw.finalScore?.side2Sets ?? raw.finalScore?.player2Sets ?? 0,
    };

    const normalized: NormalMatch = {
      _id: raw._id || raw.id,
      matchCategory: raw.matchCategory,
      matchType: raw.matchType,
      numberOfSets: Number(raw.numberOfSets ?? 3),
      city: raw.city,
      venue: raw.venue,
      status: raw.status,
      scorer: raw.scorer,
      participants,
      team1,
      team2,
      games,
      ties: raw.ties || [],
      finalScore,
      winner: raw.winner ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    };

    return normalized;
  };

  // build team match order strings (A vs X etc) using normalized teams
  const buildTeamMatchOrder = (match: NormalMatch): string[] => {
    if (!match) return [];
    const t1 = match.team1?.players ?? [];
    const t2 = match.team2?.players ?? [];

    const safeName = (p?: TeamPlayer, fallback?: string) => (p?.name || fallback || "");

    switch (match.matchType) {
      case "five_singles":
        return [
          `${safeName(t1[0], "A")} vs ${safeName(t2[0], "X")}`,
          `${safeName(t1[1], "B")} vs ${safeName(t2[1], "Y")}`,
          `${safeName(t1[2], "C")} vs ${safeName(t2[2], "Z")}`,
          `${safeName(t1[0], "A")} vs ${safeName(t2[1], "Y")}`,
          `${safeName(t1[1], "B")} vs ${safeName(t2[0], "X")}`,
        ];
      case "single_double_single":
      case "sds":
      case "single_double_single": {
        return [
          `${safeName(t1[0], "A")} vs ${safeName(t2[0], "X")}`,
          `${safeName(t1[0], "A")}/${safeName(t1[1], "B")} vs ${safeName(t2[0], "X")}/${safeName(t2[1], "Y")}`,
          `${safeName(t1[1], "B")} vs ${safeName(t2[1], "Y")}`,
        ];
      }
      case "three_singles":
        return [
          `${safeName(t1[0], "A")} vs ${safeName(t2[0], "X")}`,
          `${safeName(t1[1], "B")} vs ${safeName(t2[1], "Y")}`,
          `${safeName(t1[2], "C")} vs ${safeName(t2[2], "Z")}`,
        ];
      default:
        return [];
    }
  };

  return ({
    match: null,
    setMatch: (match) => set({ match }),

    loading: false,
    updating: false,
    shotDialogOpen: false,
    pendingPlayer: null,

    currentPlayers: { side1: "", side2: "" },
    currentRound: 1,
    teamMatchOrder: [],

    player1Score: 0,
    player2Score: 0,
    currentGame: 1,
    currentServer: "player1",
    isDeuce: false,
    serveCount: 0,
    isMatchActive: false,

    setIsMatchActive: (active) => set({ isMatchActive: active }),
    setShotDialogOpen: (open) => set({ shotDialogOpen: open }),
    setPendingPlayer: (p) => set({ pendingPlayer: p }),

    updateServingLogic: (p1Score, p2Score) => {
      const match = get().match;
      const totalPoints = p1Score + p2Score;
      const deuce = p1Score >= 10 && p2Score >= 10;
      set({ isDeuce: deuce });

      if (deuce) {
        set({
          currentServer: (totalPoints % 2 === 0 ? "player1" : "player2"),
          serveCount: 0,
        });
      } else {
        const serveCycle = Math.floor(totalPoints / 2);
        // for simplicity, we keep alternating team server (you can implement rotation for doubles)
        set({
          currentServer: serveCycle % 2 === 0 ? "player1" : "player2",
          serveCount: totalPoints % 2,
        });
      }
    },

    // initialize team order and currentPlayers
    initializeTeamMatch: () => {
      const match = get().match;
      if (!match || match.matchCategory !== "team") return;
      const order = buildTeamMatchOrder(match);
      set({ teamMatchOrder: order, currentRound: 1 });
      const pair = get().getCurrentPlayingPair();
      set({ currentPlayers: pair });
    },

    getTeamMatchOrder: () => {
      const match = get().match;
      if (!match || match.matchCategory !== "team") return [];
      return buildTeamMatchOrder(match);
    },

    getCurrentPlayingPair: () => {
      const { match, currentGame, teamMatchOrder } = get();
      if (!match || match.matchCategory !== "team") {
        return { side1: "", side2: "" };
      }
      const idx = Math.max(0, currentGame - 1);
      const matchup = teamMatchOrder[idx] || "";
      const [left = "", right = ""] = matchup.split(" vs ").map(s => s.trim());
      return { side1: left, side2: right };
    },

    getPlayerName: (player) => {
      const match = get().match;
      if (!match) return player === "player1" ? "Player 1" : "Player 2";

      if (match.matchCategory === "individual") {
        if (match.matchType === "singles") {
          return player === "player1" ? (match.participants[0] || "Player 1") : (match.participants[1] || "Player 2");
        } else {
          // doubles/mixed: participants array should be [p1a, p1b, p2a, p2b]
          return player === "player1"
            ? `${match.participants[0] ?? "P1A"} / ${match.participants[1] ?? "P1B"}`
            : `${match.participants[2] ?? "P2A"} / ${match.participants[3] ?? "P2B"}`;
        }
      }

      // team match
      const { currentPlayers } = get();
      if (currentPlayers.side1 && currentPlayers.side2) {
        return player === "player1" ? currentPlayers.side1 : currentPlayers.side2;
      }
      return player === "player1" ? (match.team1?.name ?? "Team 1") : (match.team2?.name ?? "Team 2");
    },

    getDetailedPlayerInfo: (player) => {
      const match = get().match;
      if (!match) return { name: player === "player1" ? "Player 1" : "Player 2", isTeam: false };

      if (match.matchCategory === "individual") {
        return { name: get().getPlayerName(player), isTeam: false };
      }

      return {
        name: get().getPlayerName(player),
        isTeam: true,
        players: player === "player1" ? (match.team1?.players ?? []) : (match.team2?.players ?? [])
      };
    },

    fetchMatch: async (matchId: string) => {
      set({ loading: true });
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) throw new Error("Failed to fetch match");
        const data = await res.json();
        const normalized = normalizeMatch(data.match);
        // set normalized match
        set({
          match: normalized,
        });

        // initialize scores and game state based on games array
        const games = normalized.games || [];
        if (games.length > 0) {
          const last = games[games.length - 1];
          if (!last.winner) {
            set({
              currentGame: last.gameNumber,
              player1Score: last.side1Score,
              player2Score: last.side2Score,
              currentPlayers: last.currentPlayers ?? get().getCurrentPlayingPair()
            });
            get().updateServingLogic(last.side1Score, last.side2Score);
          } else {
            // last finished -> next game
            set({
              currentGame: last.gameNumber + 1,
              player1Score: 0,
              player2Score: 0,
              currentServer: "player1",
              serveCount: 0,
              isDeuce: false
            });
            if (normalized.matchCategory === "team") {
              const nextPair = get().getCurrentPlayingPair();
              set({ currentPlayers: nextPair });
            }
          }

          if (normalized.status === "in_progress") {
            set({ isMatchActive: true });
          }
        } else {
          // fresh match
          set({
            currentGame: 1,
            player1Score: 0,
            player2Score: 0,
            currentServer: "player1",
            serveCount: 0,
            isDeuce: false
          });
          if (normalized.matchCategory === "team") {
            const pair = get().getCurrentPlayingPair();
            set({ currentPlayers: pair });
          }
        }

        // initialize team match order if required
        if (normalized.matchCategory === "team") {
          const order = buildTeamMatchOrder(normalized);
          set({ teamMatchOrder: order, currentRound: 1 });
          const pair = get().getCurrentPlayingPair();
          set({ currentPlayers: pair });
        }
      } catch (err) {
        console.error("fetchMatch err", err);
        toast.error("Failed to load match");
      } finally {
        set({ loading: false });
      }
    },

    checkGameWon: (p1, p2) => {
      // standard 11 win by 2
      if ((p1 >= 11 || p2 >= 11) && Math.abs(p1 - p2) >= 2) {
        return p1 > p2 ? "player1" : "player2";
      }
      return null;
    },

    updateScore: async (player, increment, shotType) => {
      const {
        updating,
        player1Score,
        player2Score,
        currentGame,
        currentPlayers,
        match,
        checkGameWon,
        updateServingLogic
      } = get();

      if (updating || !match) return;
      set({ updating: true });

      const newP1 = player === "player1" ? player1Score + increment : player1Score;
      const newP2 = player === "player2" ? player2Score + increment : player2Score;
      if (newP1 < 0 || newP2 < 0) {
        set({ updating: false });
        return;
      }

      const gameWinner = checkGameWon(newP1, newP2);

      try {
        // Build a request body that includes both shapes for the backend
        // (ensures compatibility with whichever route expects player1/player2 or side1/side2)
        const requestBody: any = {
          gameNumber: currentGame,
          player1Score: newP1,
          player2Score: newP2,
          side1Score: newP1,
          side2Score: newP2,
          gameWinner, // could be null
        };

        if (match.matchCategory === "team") {
          // include which players from the teams are playing (readable names)
          requestBody.currentPlayers = {
            player1: currentPlayers.side1,
            player2: currentPlayers.side2,
          };
        }

        if (shotType && increment > 0) {
          requestBody.shotData = {
            side: player === "player1" ? "side1" : "side2",
            player: player === "player1" ? currentPlayers.side1 : currentPlayers.side2,
            shotType,
            result: "winner",
          };
        }

        const resp = await fetch(`/api/matches/${match._id}/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!resp.ok) throw new Error("Failed to update score");
        const data = await resp.json();

        // normalize returned match if backend returns a full match doc
        const normalizedReturned = data.match ? normalizeMatch(data.match) : get().match;

        set({
          match: normalizedReturned,
          player1Score: newP1,
          player2Score: newP2
        });

        updateServingLogic(newP1, newP2);

        if (gameWinner) {
          if (normalizedReturned.status === "completed") {
            toast.success(`🏆 Match completed! Winner: ${normalizedReturned.winner === "team1" ? (normalizedReturned.team1?.name || "Team1") : (normalizedReturned.winner === "team2" ? (normalizedReturned.team2?.name || "Team2") : (gameWinner === "player1" ? get().getPlayerName("player1") : get().getPlayerName("player2")))}`);
            set({ isMatchActive: false });
          } else {
            toast.success(`Game ${currentGame} won by ${gameWinner === "player1" ? get().getPlayerName("player1") : get().getPlayerName("player2")}`);
            // advance to next game after a small pause
            setTimeout(() => {
              const nextGame = currentGame + 1;
              set({
                currentGame: nextGame,
                player1Score: 0,
                player2Score: 0,
                currentServer: "player1",
                serveCount: 0,
                isDeuce: false,
              });
              // move team pair forward
              if (match.matchCategory === "team") {
                const nextPair = get().getCurrentPlayingPair();
                set({ currentPlayers: nextPair });
              }
            }, 700);
          }
        }
      } catch (err) {
        console.error("updateScore err", err);
        toast.error("Failed to update score");
      } finally {
        set({ updating: false });
      }
    },

    resetGame: () => {
      set({
        player1Score: 0,
        player2Score: 0,
        currentServer: "player1",
        serveCount: 0,
        isDeuce: false
      });
      toast.success("Game reset");
    }
  } as MatchStore);
});
