import { create } from "zustand";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { IndividualMatch, Participant, TeamMatch } from "@/types/match.type";
import { getSinglesParticipantIds } from "@/lib/match/singlesClient";

interface MatchStore {
  match: IndividualMatch | TeamMatch | null;
  setMatch: (m: IndividualMatch | TeamMatch | null) => void;

  updating: boolean;
  fetchingMatch: boolean;

  shotDialogOpen: boolean;
  setShotDialogOpen: (open: boolean) => void;

  pendingPlayer: { side: "side1" | "side2" | "team1" | "team2"; playerId?: string } | null;
  setPendingPlayer: (
    p: { side: "side1" | "side2" | "team1" | "team2"; playerId?: string } | null
  ) => void;

  setupDialogOpen: boolean;
  setSetupDialogOpen: (open: boolean) => void;

  serverDialogOpen: boolean;
  setServerDialogOpen: (open: boolean) => void;

  pendingShot: { shotType: string } | null;
  setPendingShot: (shot: { shotType: string } | null) => void;

  shotTrackingMode: "detailed" | "simple" | null;
  setShotTrackingMode: (mode: "detailed" | "simple" | null) => void;

  fetchMatch: (matchId: string, category: "individual" | "team") => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  function normalizeParticipants(raw: any[]): Participant[] {
    return (raw || []).map((p: any) => ({
      _id: String(p._id),
      username: p.username,
      fullName: p.fullName,
      profileImage: p.profileImage,
    }));
  }

  function normalizeScorer(raw: any): Participant | string | undefined {
    if (!raw) return undefined;
    if (typeof raw === "string") {
      // If it's just an ID string, return it as-is (match details page handles this)
      return raw;
    }
    // If it's a populated object, normalize it to Participant
    if (raw._id) {
      return {
        _id: String(raw._id),
        username: raw.username || "",
        fullName: raw.fullName,
        profileImage: raw.profileImage,
      };
    }
    return undefined;
  }

  function strId(v: unknown): string | undefined {
    if (v == null) return undefined;
    if (typeof v === "string") return v;
    if (typeof v === "object" && v && "_id" in (v as object)) {
      return String((v as { _id: unknown })._id);
    }
    return String(v);
  }

  const normalizeMatch = (raw: any): IndividualMatch | TeamMatch => {
    if (raw.matchCategory === "team") {

      return {
        _id: String(raw._id),
        matchCategory: "team",
        matchFormat: raw.matchFormat,
        numberOfGamesPerRubber: raw.numberOfGamesPerRubber ?? 3,
        team1: {
          _id: String(raw.team1._id),
          name: raw.team1.name,
          players: raw.team1.players || [],
          logo: raw.team1.logo,
          assignments: raw.team1.assignments || {},
          city: raw.team1.city || "",
          stats: raw.team1.stats || {},
        },
        team2: {
          _id: String(raw.team2._id),
          name: raw.team2.name,
          players: raw.team2.players || [],
          logo: raw.team2.logo,
          assignments: raw.team2.assignments || {},
          city: raw.team2.city || "",
          stats: raw.team2.stats || {},
        },
        city: raw.city,
        venue: raw.venue,
        scorer: normalizeScorer(raw.scorer),
        tournament: raw.tournament, // Include tournament field (may be ID or populated object)
        subMatches: raw.subMatches || [],
        currentSubMatch: raw.currentSubMatch || 1,
        status: raw.status,
        finalScore: raw.finalScore,
        shotTrackingMode: raw.shotTrackingMode ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };
    }

    // otherwise individual
    const participants = normalizeParticipants(raw.participants);
    const pair = getSinglesParticipantIds(participants);
    const setsByIdRaw =
      (raw.finalScore?.setsById && typeof raw.finalScore.setsById === "object"
        ? raw.finalScore.setsById
        : raw.finalScore?.setsByPlayerId) || {};
    const side1Sets =
      pair && setsByIdRaw
        ? Number((setsByIdRaw as Record<string, number>)[pair[0]] ?? 0)
        : Number(raw.finalScore?.side1Sets ?? 0);
    const side2Sets =
      pair && setsByIdRaw
        ? Number((setsByIdRaw as Record<string, number>)[pair[1]] ?? 0)
        : Number(raw.finalScore?.side2Sets ?? 0);
    return {
      _id: String(raw._id || raw.id),
      matchCategory: "individual",
      matchType: raw.matchType,
      numberOfSets: Number(raw.numberOfSets ?? 3),
      participants,
      scorer: normalizeScorer(raw.scorer),
      tournament: raw.tournament, // Include tournament field (may be ID or populated object)
      city: raw.city,
      venue: raw.venue,
      status: raw.status,
      currentGame: raw.currentGame ?? 1,
      games: (Array.isArray(raw.games) ? raw.games : []).map(
        (g: any, idx: number) => ({
          gameNumber: g.gameNumber ?? idx + 1,
          side1Score: g.side1Score ?? 0,
          side2Score: g.side2Score ?? 0,
          scores: g.scores,
          scoresByPlayerId: g.scoresByPlayerId,
          winner: strId(g.winner) ?? strId(g.winnerPlayerId),
          winnerPlayerId: strId(g.winnerPlayerId) ?? strId(g.winner),
          winnerSide: g.winnerSide ?? null,
          completed: (g.status ? g.status === "completed" : g.completed) ?? false,
          status: g.status ?? ((g.completed ?? false) ? "completed" : "in_progress"),
          shots: g.shots ?? [],
          duration: g.duration,
          startTime: g.startTime,
          endTime: g.endTime,
        })
      ),
      finalScore: {
        side1Sets,
        side2Sets,
        sets: raw.finalScore?.setsById ?? raw.finalScore?.sets ?? raw.finalScore?.setsByPlayerId,
        setsByPlayerId: raw.finalScore?.setsById ?? raw.finalScore?.setsByPlayerId,
      },
      winnerSide: raw.winnerSide ?? null,
      winner: strId(raw.winner) ?? strId(raw.winnerPlayerId),
      winnerPlayerId: strId(raw.winnerPlayerId) ?? strId(raw.winner),
      currentServerPlayerId: strId(raw.currentServerPlayerId),
      matchDuration: raw.matchDuration,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      currentServer: raw.currentServerPlayerId ?? raw.currentServer ?? null,
      serverConfig: raw.serverConfig ?? null,
      shotTrackingMode: raw.shotTrackingMode ?? null,
    };
  };

  return {
    match: null,
    setMatch: (m) => {
      // Normalize match data when setting to ensure consistent format
      const normalized = m ? normalizeMatch(m) : null;
      set({ match: normalized });
    },

    updating: false,
    fetchingMatch: false,

    shotDialogOpen: false,
    setShotDialogOpen: (open) => set({ shotDialogOpen: open }),

    pendingPlayer: null,
    setPendingPlayer: (p) => set({ pendingPlayer: p }),

    pendingShot: null,
    setPendingShot: (shot) => set({ pendingShot: shot }),

    setupDialogOpen: false,
    setSetupDialogOpen: (open) => set({ setupDialogOpen: open }),

    serverDialogOpen: false,
    setServerDialogOpen: (open) => set({ serverDialogOpen: open }),

    shotTrackingMode: null,
    setShotTrackingMode: (mode) => set({ shotTrackingMode: mode }),

    fetchMatch: async (id, category) => {
      set({ fetchingMatch: true });
      try {
        const res = await axiosInstance.get(`/matches/${category}/${id}`);
        const normalizedMatch = normalizeMatch(res.data.match || res.data);
        set({ 
          match: normalizedMatch,
          shotTrackingMode: normalizedMatch.shotTrackingMode || null,
        });
      } catch (err: any) {
        console.error(
          `Error fetching ${category} match:`,
          err.response?.data || err
        );
        toast.error(`Failed to load ${category} match`);
        set({ match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },
  };
});