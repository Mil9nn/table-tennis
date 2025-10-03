import { create } from "zustand";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { IndividualMatch, Participant } from "@/types/match.type";

interface MatchStore {
  match: IndividualMatch | null;
  setMatch: (m: IndividualMatch | null) => void;

  loading: boolean;
  updating: boolean;
  fetchingMatch: boolean;

  shotDialogOpen: boolean;
  setShotDialogOpen: (open: boolean) => void;

  pendingPlayer: { side: "side1" | "side2"; playerId?: string } | null;
  setPendingPlayer: (
    p: { side: "side1" | "side2"; playerId?: string } | null
  ) => void;

  setupDialogOpen: boolean;
  setSetupDialogOpen: (open: boolean) => void;

  serverDialogOpen: boolean;
  setServerDialogOpen: (open: boolean) => void;

  fetchMatch: (matchId: string) => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  function normalizeParticipants(raw: any[]): Participant[] {
    return (raw || []).map((p: any) => ({
      _id: String(p._id),
      username: p.username,
      fullName: p.fullName,
    }));
  }

  const normalizeMatch = (raw: any): IndividualMatch => {
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
    };
  };

  return {
    match: null,
    setMatch: (m) => set({ match: m }),

    loading: false,
    updating: false,
    fetchingMatch: false,

    shotDialogOpen: false,
    setShotDialogOpen: (open) => set({ shotDialogOpen: open }),

    pendingPlayer: null,
    setPendingPlayer: (p) => set({ pendingPlayer: p }),

    setupDialogOpen: false,
    setSetupDialogOpen: (open) => set({ setupDialogOpen: open }),

    serverDialogOpen: false,
    setServerDialogOpen: (open) => set({ serverDialogOpen: open }),

    // ✅ Only supports individual matches now
    fetchMatch: async (id: string) => {
      set({ fetchingMatch: true });
      try {
        const res = await axiosInstance.get(`/matches/individual/${id}`);
        const normalizedMatch = normalizeMatch(res.data.match || res.data);
        set({ match: normalizedMatch, loading: false });
      } catch (err) {
        console.error("Error fetching match:", err);
        set({ loading: false, match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },
  };
});