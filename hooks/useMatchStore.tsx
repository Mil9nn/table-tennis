import { create } from "zustand";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  NormalizedMatch,
  Participant,
  Team,
  TeamPlayer,
  TeamMatch,
  IndividualMatch,
} from "@/types/match.type";

interface MatchStore {
  match: NormalizedMatch | null;
  setMatch: (m: NormalizedMatch | null) => void;

  loading: boolean;
  updating: boolean;

  shotDialogOpen: boolean;
  setShotDialogOpen: (open: boolean) => void;

  pendingPlayer: { side: "side1" | "side2"; playerId?: string } | null;
  setPendingPlayer: (
    p: { side: "side1" | "side2"; playerId?: string } | null
  ) => void;

  fetchMatch: (matchId: string, category: "individual" | "team") => Promise<void>;
  fetchIndividualMatch: (matchId: string) => Promise<void>;
  fetchTeamMatch: (matchId: string) => Promise<void>;
  fetchingMatch: boolean;

  setupDialogOpen: boolean;
  setSetupDialogOpen: (open: boolean) => void;

  serverDialogOpen: boolean;
  setServerDialogOpen: (open: boolean) => void;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  function normalizeParticipants(raw: any[]): Participant[] {
    return (raw || []).map((p: any) => ({
      _id: String(p._id),
      username: p.username,
      fullName: p.fullName,
    }));
  }

  const normalizeTeam = (team: any): Team | null => {
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

  const normalizeMatch = (raw: any): NormalizedMatch => {
    const participants = normalizeParticipants(raw.participants);

    return {
      _id: String(raw._id || raw.id),
      matchCategory: "individual",
      matchType: raw.matchType,
      numberOfSets: Number(raw.numberOfSets ?? 3),
      participants,
      scorer: raw.scorer,
      city: raw.city,
      venue: raw.venue,
      status: raw.status,
      currentGame: raw.currentGame ?? 1,
      games: (Array.isArray(raw.games) ? raw.games : []).map(
        (g: any, idx: number) => ({
          gameNumber: g.gameNumber ?? idx + 1,
          side1Score: g.side1Score ?? 0,
          side2Score: g.side2Score ?? 0,
          winnerSide: g.winnerSide ?? null,
          completed: g.completed ?? false,
          expedite: g.expedite ?? false,
          shots: g.shots ?? [],
          duration: g.duration,
          startTime: g.startTime,
          endTime: g.endTime,
        })
      ),
      finalScore: {
        side1Sets: raw.finalScore?.side1Sets ?? 0,
        side2Sets: raw.finalScore?.side2Sets ?? 0,
      },
      winnerSide: raw.winnerSide ?? null,
      matchDuration: raw.matchDuration,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    } as IndividualMatch;
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
    setupDialogOpen: false,
    setSetupDialogOpen: (open) => set({ setupDialogOpen: open }),

    serverDialogOpen: false,
    setServerDialogOpen: (open) => set({ serverDialogOpen: open }),

    fetchIndividualMatch: async (id: string) => {
      set({ fetchingMatch: true });
      try {
        const res = await axiosInstance.get(`/matches/individual/${id}`);
        const normalizedMatch = normalizeMatch({
          ...(res.data.match || res.data), // support both shapes
          matchCategory: "individual",
        });
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
      set({ fetchingMatch: true });
      try {
        const res = await axiosInstance.get(`/matches/team/${id}`);
        const normalizedMatch = normalizeMatch({
          ...(res.data.match || res.data), // support both shapes
          matchCategory: "team",
        });
        set({ match: normalizedMatch, loading: false });
      } catch (err) {
        console.error("Error fetching team match:", err);
        set({ loading: false, match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },

    // 🚀 No fallback anymore
    fetchMatch: async (id: string, category: "individual" | "team") => {
      if (category === "individual") {
        await get().fetchIndividualMatch(id);
      } else if (category === "team") {
        await get().fetchTeamMatch(id);
      }
    },
  };
});