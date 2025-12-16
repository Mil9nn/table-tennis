// hooks/useTeamMatch.tsx
import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  TeamMatch,
  SubMatch,
  MatchStatus,
} from "@/types/match.type";
import { TeamSideKey } from "@/shared/match/teamMatchTypes";
import { isGameWon } from "@/shared/match/scoringRules";
import { useMatchStore } from "./useMatchStore";

interface TeamMatchState {
  currentSubMatchIndex: number;
  currentSubMatch: SubMatch | null;

  team1Score: number;
  team2Score: number;
  currentGame: number;
  team1Sets: number;
  team2Sets: number;

  currentServer: string | null;

  isMatchActive: boolean;
  isSubMatchActive: boolean;
  status: MatchStatus;

  isUpdatingTeamScore: boolean;
  isStartingSubMatch: boolean;
  isUndoing?: boolean;

  setInitialTeamMatch: (match: TeamMatch) => void;
  updateSubMatchScore: (
    side: TeamSideKey,
    increment: number,
    shotType?: string,
    playerId?: string,
    shotLocationData?: {
      originX: number;
      originY: number;
      landingX: number;
      landingY: number;
      serveType?: string | null;
    }
  ) => Promise<void>;
  subtractPoint: (side: TeamSideKey) => Promise<void>;
  toggleSubMatch: () => Promise<void>;
  resetSubMatch: (fullReset?: boolean) => Promise<void>;
  swapSides: () => Promise<void>;
}

/**
 * Helper to ensure submatch is active before scoring
 * Returns true if ready to score, false if not
 */
async function ensureSubMatchActive(
  get: () => TeamMatchState,
  status: MatchStatus,
  isSubMatchActive: boolean
): Promise<boolean> {
  if (status === "completed") {
    toast.error("Match is completed!");
    return false;
  }

  if (!isSubMatchActive && status === "scheduled") {
    try {
      await get().toggleSubMatch();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.error("Failed to auto-start submatch:", error);
      toast.error("Failed to start the submatch");
      return false;
    }
  } else if (!isSubMatchActive) {
    toast.error("Start the submatch first");
    return false;
  }

  return true;
}

export const useTeamMatch = create<TeamMatchState>((set, get) => ({
  currentSubMatchIndex: 0,
  currentSubMatch: null,

  team1Score: 0,
  team2Score: 0,
  currentGame: 1,
  team1Sets: 0,
  team2Sets: 0,

  currentServer: null,

  isMatchActive: false,
  isSubMatchActive: false,
  status: "scheduled" as MatchStatus,

  isUpdatingTeamScore: false,
  isStartingSubMatch: false,
  isUndoing: false,

  setInitialTeamMatch: (match: TeamMatch) => {
    if (!match) return;

    const currentIndex = (match.currentSubMatch || 1) - 1;
    const subMatch = match.subMatches[currentIndex];

    if (!subMatch) {
      set({
        currentSubMatchIndex: 0,
        currentSubMatch: null,
        team1Score: 0,
        team2Score: 0,
        currentGame: 1,
        team1Sets: 0,
        team2Sets: 0,
        isSubMatchActive: false,
        status: match.status,
        currentServer: null,
      });
      return;
    }

    const currentGameNum = subMatch.games?.length || 0;
    const lastGame = subMatch.games?.[currentGameNum - 1];

    const isGameComplete = lastGame?.completed || lastGame?.winnerSide;
    const gameToUse = isGameComplete ? currentGameNum + 1 : currentGameNum || 1;

    const activeGame = isGameComplete ? null : lastGame;

    let serverToUse: string | null = null;

    if (subMatch.currentServer) {
      serverToUse = subMatch.currentServer;
    }

    set({
      currentSubMatchIndex: currentIndex,
      currentSubMatch: subMatch,
      team1Score: activeGame?.team1Score || 0,
      team2Score: activeGame?.team2Score || 0,
      currentGame: gameToUse,
      team1Sets: subMatch.finalScore?.team1Sets || 0,
      team2Sets: subMatch.finalScore?.team2Sets || 0,
      isSubMatchActive: subMatch.status === "in_progress",
      status: match.status,
      currentServer: serverToUse,
    });
  },

  updateSubMatchScore: async (
    side,
    increment,
    shotType,
    playerId,
    shotLocationData?: {
      originX: number;
      originY: number;
      landingX: number;
      landingY: number;
      serveType?: string | null;
    }
  ) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      toast.error("No submatch selected!");
      return;
    }

    const { team1Score, team2Score, currentGame, isSubMatchActive, status } = get();

    const canProceed = await ensureSubMatchActive(get, status, isSubMatchActive);
    if (!canProceed) return;

    const newT1 = side === "team1" ? team1Score + increment : team1Score;
    const newT2 = side === "team2" ? team2Score + increment : team2Score;

    if (newT1 < 0 || newT2 < 0) return;

    const gameWon = isGameWon(newT1, newT2);

    const requestBody: any = {
      gameNumber: currentGame,
      team1Score: newT1,
      team2Score: newT2,
    };

    if (increment > 0 && shotType && playerId) {
      requestBody.shotData = {
        side,
        player: playerId,
        stroke: shotType,
        serveType: shotLocationData?.serveType || null,
        server: null,
        originX: shotLocationData?.originX,
        originY: shotLocationData?.originY,
        landingX: shotLocationData?.landingX,
        landingY: shotLocationData?.landingY,
      };
    }

    set({ isUpdatingTeamScore: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/score`,
        requestBody
      );

      if (data?.match) {
        useMatchStore.getState().setMatch(data.match);
        get().setInitialTeamMatch(data.match);

        if (gameWon) {
          toast.success(`Game ${currentGame} won!`);
        }
      }
    } catch (err) {
      console.error("Score update error:", err);
      toast.error("Failed to update score");
    } finally {
      set({ isUpdatingTeamScore: false });
    }
  },

  subtractPoint: async (side) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      toast.error("No submatch selected!");
      return;
    }

    const { currentGame, isSubMatchActive, status } = get();

    const canProceed = await ensureSubMatchActive(get, status, isSubMatchActive);
    if (!canProceed) return;

    set({ isUndoing: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/score`,
        {
          action: "subtract",
          side,
          gameNumber: currentGame,
        }
      );

      if (data?.match) {
        useMatchStore.getState().setMatch(data.match);
        get().setInitialTeamMatch(data.match);
      }
    } catch (err) {
      console.error("Subtract point error:", err);
      toast.error("Failed to subtract point");
    } finally {
      set({ isUndoing: false });
    }
  },

  toggleSubMatch: async () => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      toast.error("No submatch selected!");
      return;
    }

    const { isSubMatchActive } = get();
    const nextStatus: MatchStatus = isSubMatchActive
      ? "scheduled"
      : "in_progress";

    set({ isStartingSubMatch: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/status`,
        { status: nextStatus }
      );

      if (data?.match) {
        useMatchStore.getState().setMatch(data.match);
        set({ isSubMatchActive: nextStatus === "in_progress" });

        if (nextStatus === "in_progress") {
          toast.success("SubMatch started!");
        } else {
          toast.success("SubMatch paused");
        }
      }
    } catch (err) {
      console.error("Toggle submatch error:", err);
      toast.error("Failed to toggle submatch");
    } finally {
      set({ isStartingSubMatch: false });
    }
  },

  resetSubMatch: async (fullReset = false) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) {
      toast.error("No match loaded");
      return;
    }

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      toast.error("No submatch selected!");
      return;
    }

    const resetType = fullReset || get().currentSubMatch?.status === "completed" ? "submatch" : "game";

    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/reset`,
        { resetType }
      );

      if (data?.match) {
        useMatchStore.getState().setMatch(data.match);
        get().setInitialTeamMatch(data.match);
        toast.success(
          resetType === "submatch" ? "Submatch restarted" : "Game reset"
        );
      }
    } catch (err: any) {
      console.error("resetSubMatch error", err);
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to reset submatch";
      toast.error(errorMessage);
    }
  },

  swapSides: async () => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    set({ isUpdatingTeamScore: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/swap`
      );

      if (data?.match) {
        useMatchStore.getState().setMatch(data.match);
        get().setInitialTeamMatch(data.match);
        toast.success("Teams swapped!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to swap teams");
    } finally {
      set({ isUpdatingTeamScore: false });
    }
  },
}));
