import { create } from "zustand";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { IndividualMatch, Participant, TeamMatch } from "@/types/match.type";

interface MatchStore {
  match: IndividualMatch | TeamMatch | null;
  setMatch: (m: IndividualMatch | TeamMatch | null) => void;

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

  // 👇 Modified to include matchType
  fetchMatch: (
    matchId: string,
    matchType?: "individual" | "team"
  ) => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  function normalizeParticipants(raw: any[]): Participant[] {
    return (raw || []).map((p: any) => ({
      _id: String(p._id),
      username: p.username,
      fullName: p.fullName,
    }));
  }

  const normalizeMatch = (raw: any): IndividualMatch | TeamMatch => {
    if (raw.matchCategory === "team") {
      return {
        _id: String(raw._id),
        matchCategory: "team",
        format: raw.format,
        numberOfSetsPerSubMatch: raw.numberOfSetsPerSubMatch ?? 3,
        team1: {
          _id: String(raw.team1._id),
          name: raw.team1.name,
          players: normalizeParticipants(raw.team1.players || []),
          logo: raw.team1.logo,
        },
        team2: {
          _id: String(raw.team2._id),
          name: raw.team2.name,
          players: normalizeParticipants(raw.team2.players || []),
          logo: raw.team2.logo,
        },
        scorer: raw.scorer,
        subMatches: raw.subMatches || [],
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };
    }

    // otherwise individual
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
      currentServer: raw.currentServer ?? null,
      serverConfig: raw.serverConfig ?? null,
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

    // ✅ Now supports both individual and team matches
    fetchMatch: async (id, matchType) => {
      set({ fetchingMatch: true });
      try {
        const res = await axiosInstance.get(`/matches/${matchType}/${id}`);
        const normalizedMatch = normalizeMatch(res.data.match || res.data);
        set({ match: normalizedMatch, loading: false });
      } catch (err: any) {
        console.error(
          `Error fetching ${matchType} match:`,
          err.response?.data || err
        );
        toast.error(`Failed to load ${matchType} match`);
        set({ loading: false, match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },
  };
});
