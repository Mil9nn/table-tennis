// hooks/useTeamMatch.tsx
import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  TeamMatch,
  SubMatch,
  MatchStatus,
  PlayerKey,
} from "@/types/match.type";
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
    side: "team1" | "team2",
    increment: number,
    shotType?: string,
    playerId?: string
  ) => Promise<void>;
  subtractPoint: (side: PlayerKey) => Promise<void>;
  toggleSubMatch: () => Promise<void>;
  resetSubMatch: () => Promise<void>;
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

  updateSubMatchScore: async (side, increment, shotType, playerId) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      toast.error("No submatch selected!");
      return;
    }

    const {
      currentSubMatchIndex,
      team1Score,
      team2Score,
      currentGame,
      isSubMatchActive,
      status,
    } = get();

    if (status === "completed") {
      toast.error("Match is completed!");
      return;
    }

    if (!isSubMatchActive) {
      toast.error("Start the submatch first");
      return;
    }

    const newT1 = side === "team1" ? team1Score + increment : team1Score;
    const newT2 = side === "team2" ? team2Score + increment : team2Score;

    if (newT1 < 0 || newT2 < 0) return;

    const isGameWon =
      (newT1 >= 11 || newT2 >= 11) && Math.abs(newT1 - newT2) >= 2;

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
        server: null, // Will be set by backend
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

        if (isGameWon) {
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

    const { currentSubMatchIndex, currentGame, isSubMatchActive, status } =
      get();

    if (status === "completed") {
      toast.error("Match is completed!");
      return;
    }

    if (!isSubMatchActive) {
      toast.error("Start the submatch first");
      return;
    }

    set({ isUndoing: true })
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

  resetSubMatch: async () => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    // Implement reset logic if needed
    toast.info("Reset functionality not yet implemented");
  },
}));
