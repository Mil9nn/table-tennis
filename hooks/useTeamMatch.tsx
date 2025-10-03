// hooks/useTeamMatch.ts
import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import type { TeamMatch, MatchStatus } from "@/types/match.type";

interface TeamMatchState {
  match: TeamMatch | null;
  currentSubMatchIndex: number;
  team1Wins: number;
  team2Wins: number;
  isMatchActive: boolean;
  status: MatchStatus;
  isStartingMatch: boolean;

  setInitialMatch: (match: TeamMatch) => void;
  initializeSubMatches: () => Promise<void>;
  moveToNextSubMatch: () => void;
}

export const useTeamMatch = create<TeamMatchState>((set, get) => ({
  match: null,
  currentSubMatchIndex: 0,
  team1Wins: 0,
  team2Wins: 0,
  isMatchActive: false,
  status: "scheduled",
  isStartingMatch: false,

  setInitialMatch: (match: TeamMatch) => {
    set({
      match,
      currentSubMatchIndex: 0,
      team1Wins: match.finalScore?.team1Matches ?? 0,
      team2Wins: match.finalScore?.team2Matches ?? 0,
      status: match.status || "scheduled",
      isMatchActive: match.status === "in_progress",
    });
  },

  initializeSubMatches: async () => {
    const { match } = get();
    if (!match) return;

    try {
      set({ isStartingMatch: true });
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/initialize`
      );
      if (data.match) {
        set({
          match: data.match,
          status: "in_progress",
          isMatchActive: true,
          currentSubMatchIndex: 0,
          team1Wins: 0,
          team2Wins: 0,
        });
        toast.success("✅ Team match initialized!");
      }
    } catch (err) {
      toast.error("Failed to initialize team match");
    } finally {
      set({ isStartingMatch: false });
    }
  },

  moveToNextSubMatch: () => {
    const { match, currentSubMatchIndex } = get();
    if (!match) return;

    const nextIndex = currentSubMatchIndex + 1;
    if (nextIndex >= (match.subMatches?.length ?? 0)) {
      toast.info("All submatches completed");
      return;
    }

    set({ currentSubMatchIndex: nextIndex });
    toast.success(`➡️ Moving to SubMatch ${nextIndex + 1}`);
  },
}));