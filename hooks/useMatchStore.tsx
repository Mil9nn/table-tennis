import { create } from "zustand";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";

export type PlayerKey = "player1" | "player2" | null;

type TeamPlayer = { name: string; role?: string; id?: string };

type NormalTeam = {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  players: TeamPlayer[];
  assignments: Record<string, string>;
};

type NormalGame = {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winner?: string | null;
  currentPlayers?: { side1?: string; side2?: string };
  shots?: any[];
};

export type NormalMatch = {
  _id: string;
  matchCategory: "individual" | "team";
  matchType: string;
  numberOfSets: number;
  setsPerTie?: number;
  city?: string;
  venue?: string;
  status?: string;
  scorer?: any;
  participants: { _id?: string; username?: string; fullName?: string; name: string }[];
  team1?: NormalTeam | null;
  team2?: NormalTeam | null;
  games: NormalGame[];
  ties?: any[];
  finalScore: {
    side1Sets: number;
    side2Sets: number;
    side1Ties?: number;
    side2Ties?: number;
  };
  winner?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

interface MatchStore {
  match: NormalMatch | null;
  setMatch: (m: NormalMatch | null) => void;

  loading: boolean;
  updating: boolean;

  // ShotSelector state
  shotDialogOpen: boolean;
  pendingPlayer: { side: "player1" | "player2"; playerId: string } | null;
  setShotDialogOpen: (open: boolean) => void;
  setPendingPlayer: (p: PlayerKey) => void;

  // Shared API
  fetchMatch: (matchId: string) => Promise<void>;
  fetchIndividualMatch: (matchId: string) => Promise<void>;
  fetchTeamMatch: (matchId: string) => Promise<void>;
  fetchingMatch: boolean; // to avoid duplicate fetches
}

export const useMatchStore = create<MatchStore>((set, get) => {
  const normalizeTeam = (team: any): NormalTeam | null => {
    if (!team) return null;

    const playersRaw = Array.isArray(team.players) ? team.players : [];
    const players: TeamPlayer[] = playersRaw
      .map((p: any) => {
        if (!p) return null;

        if (p.user && typeof p.user === "object") {
          return {
            name: p.user.fullName || p.user.username || String(p.user._id),
            role: p.role || "",
            id: String(p.user._id),
          };
        }
        if (typeof p.user === "string") {
          return { name: p.user, role: p.role || "", id: p.user };
        }
        if (typeof p === "string") return { name: p };

        return {
          name: p.name || p.username || p.fullName || String(p._id || ""),
          role: p.role || "",
        };
      })
      .filter(Boolean) as TeamPlayer[];

    return {
      id: team._id || team.id || null,
      name: team.name || null,
      city: team.city || null,
      players,
      assignments: team.assignments
        ? Object.fromEntries(Object.entries(team.assignments))
        : {},
    };
  };

  const normalizeMatch = (raw: any): NormalMatch => {
    let participants: string[] = [];
    if (Array.isArray(raw.participants) && raw.participants.length) {
      participants = raw.participants
        .map((p: any) => {
          if (!p) return null;
          if (typeof p === "string") return { _id: p, name: p }; // fallback
          return {
            _id: p._id ?? p.id ?? p, // keep ObjectId
            username: p.username,
            fullName: p.fullName,
            name: p.name ?? p.username ?? p.fullName ?? String(p._id ?? p),
          };
        })
        .filter(Boolean);
    } else if (raw.players) {
      participants = [
        raw.players.player1?.name || raw.players.player1,
        raw.players.player2?.name || raw.players.player2,
        raw.players.player3?.name || raw.players.player3,
        raw.players.player4?.name || raw.players.player4,
      ].filter(Boolean) as string[];
    }

    const team1 = normalizeTeam(raw.team1);
    const team2 = normalizeTeam(raw.team2);

    const games: NormalGame[] = (Array.isArray(raw.games) ? raw.games : []).map(
      (g: any) => ({
        ...g,
        gameNumber: g.gameNumber ?? (g._id ? Number(g._id) : 0),
        side1Score: g.side1Score ?? g.player1Score ?? 0,
        side2Score: g.side2Score ?? g.player2Score ?? 0,
        winner: g.winner ?? null,
        currentPlayers: g.currentPlayers || {},
        shots: g.shots ?? [],
      })
    );

    return {
      _id: raw._id || raw.id,
      matchCategory: raw.matchCategory,
      matchType: raw.matchType,
      numberOfSets: Number(raw.numberOfSets ?? 3),
      setsPerTie: Number(raw.setsPerTie ?? 0),
      city: raw.city,
      venue: raw.venue,
      status: raw.status,
      scorer: raw.scorer,
      participants,
      team1,
      team2,
      games,
      ties: raw.ties || [],
      finalScore: {
        side1Sets: raw.finalScore?.side1Sets ?? 0,
        side2Sets: raw.finalScore?.side2Sets ?? 0,
        side1Ties: raw.finalScore?.side1Ties ?? 0,
        side2Ties: raw.finalScore?.side2Ties ?? 0,
      },
      winner: raw.winner ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  };

  return {
    match: null,
    setMatch: (m) => set({ match: m }),

    loading: false,
    updating: false,
    fetchingMatch: false,

    shotDialogOpen: false,
    pendingPlayer: null,
    setShotDialogOpen: (open) => set({ shotDialogOpen: open }),
    setPendingPlayer: (p) => set({ pendingPlayer: p }),

    fetchIndividualMatch: async (id: string) => {
      set({ fetchingMatch: true })
      try {
        const res = await axiosInstance.get(`/matches/individual/${id}`);
        const normalizedMatch = normalizeMatch(res.data.match);
        normalizedMatch.matchCategory = "individual";
        set({ match: normalizedMatch, loading: false });
      } catch (err) {
        console.error("Error fetching individual match:", err);
        set({ loading: false, match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },

    fetchTeamMatch: async (id: string) => {
      set({ loading: true });
      try {
        const res = await axiosInstance.get(`/matches/team/${id}`);
        const normalizedMatch = normalizeMatch(res.data.match);
        normalizedMatch.matchCategory = "team";
        set({ match: normalizedMatch, loading: false });
      } catch (err) {
        console.error("Error fetching team match:", err);
        set({ loading: false, match: null });
        throw err;
      }
    },

    fetchMatch: async (id: string) => {
      try {
        await get().fetchIndividualMatch(id);
      } catch {
        try {
          await get().fetchTeamMatch(id);
        } catch {
          toast.error("❌ Match not found");
          set({ match: null, loading: false });
        }
      }
    },
  };
});
