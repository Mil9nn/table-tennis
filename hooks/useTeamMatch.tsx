// hooks/useTeamMatch.ts
import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import type {
  TeamMatch,
  MatchStatus,
  SubMatch,
} from "@/types/match.type";

interface TeamMatchState {
  // Match data
  match: TeamMatch | null;
  currentSubMatchIndex: number;
  
  // Current submatch scores
  side1Score: number;
  side2Score: number;
  
  // Overall match scores
  team1Wins: number;
  team2Wins: number;
  
  // Current submatch sets
  side1Sets: number;
  side2Sets: number;
  
  // State flags
  isMatchActive: boolean;
  status: MatchStatus;
  currentServer: string | null;
  currentGame: number;
  
  // Loading states
  isUpdatingScore: boolean;
  isStartingMatch: boolean;
  
  // Actions
  setInitialMatch: (match: TeamMatch) => void;
  initializeSubMatches: () => Promise<void>;
  addPoint: (payload: {
    side: "side1" | "side2";
    playerId?: string;
    shotData?: any;
  }) => Promise<void>;
  subtractPoint: (side: "side1" | "side2") => Promise<void>;
  resetCurrentGame: (fullReset?: boolean) => Promise<void>;
  toggleMatch: () => Promise<void>;
  moveToNextSubMatch: () => void;
}

export const useTeamMatch = create<TeamMatchState>((set, get) => ({
  // Initial state
  match: null,
  currentSubMatchIndex: 0,
  side1Score: 0,
  side2Score: 0,
  team1Wins: 0,
  team2Wins: 0,
  side1Sets: 0,
  side2Sets: 0,
  isMatchActive: false,
  status: "scheduled",
  currentServer: null,
  currentGame: 1,
  isUpdatingScore: false,
  isStartingMatch: false,

  setInitialMatch: (match: TeamMatch) => {
    const currentSub = match.subMatches?.[0];
    const currentGame = currentSub?.games?.[currentSub.currentGame - 1];

    set({
      match,
      currentSubMatchIndex: 0,
      side1Score: currentGame?.team1Score ?? 0,
      side2Score: currentGame?.team2Score ?? 0,
      team1Wins: match.finalScore?.team1Matches ?? 0,
      team2Wins: match.finalScore?.team2Matches ?? 0,
      side1Sets: currentSub?.finalScore?.team1Sets ?? 0,
      side2Sets: currentSub?.finalScore?.team2Sets ?? 0,
      status: match.status || "scheduled",
      isMatchActive: match.status === "in_progress",
      currentGame: currentSub?.currentGame ?? 1,
    });
  },

  initializeSubMatches: async () => {
    const { match } = get();
    if (!match) return;

    try {
      set({ isStartingMatch: true });
      const { data } = await axiosInstance.post(
        `/api/matches/team/${match._id}/initialize`
      );

      set({
        match: data.match,
        status: "in_progress",
        isMatchActive: true,
      });

      toast.success(data.message || "Match initialized!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to initialize match");
      console.error(error);
    } finally {
      set({ isStartingMatch: false });
    }
  },

  addPoint: async ({ side, playerId, shotData }) => {
    const {
      match,
      currentSubMatchIndex,
      side1Score,
      side2Score,
      currentGame,
      isUpdatingScore,
    } = get();

    if (!match || isUpdatingScore) return;

    const currentSub = match.subMatches?.[currentSubMatchIndex];
    if (!currentSub || currentSub.completed) {
      toast.error("Current submatch is completed");
      return;
    }

    const newSide1Score = side === "side1" ? side1Score + 1 : side1Score;
    const newSide2Score = side === "side2" ? side2Score + 1 : side2Score;

    // Optimistic update
    set({
      side1Score: newSide1Score,
      side2Score: newSide2Score,
      isUpdatingScore: true,
    });

    try {
      const payload: any = {
        subMatchNumber: currentSub.subMatchNumber,
        gameNumber: currentGame,
        side1Score: newSide1Score,
        side2Score: newSide2Score,
      };

      // Add shot data if provided
      if (shotData && playerId) {
        payload.shot = {
          player: playerId,
          side,
          ...shotData,
        };
      }

      const { data } = await axiosInstance.post(
        `/api/matches/team/${match._id}/submatch`,
        payload
      );

      // Update from server response
      const updatedSub = data.match.subMatches[currentSubMatchIndex];
      const updatedGame = updatedSub.games[updatedSub.currentGame - 1];

      set({
        match: data.match,
        side1Score: updatedGame?.team1Score ?? 0,
        side2Score: updatedGame?.team2Score ?? 0,
        side1Sets: updatedSub.finalScore.team1Sets,
        side2Sets: updatedSub.finalScore.team2Sets,
        team1Wins: data.match.finalScore.team1Matches,
        team2Wins: data.match.finalScore.team2Matches,
        currentGame: updatedSub.currentGame,
        status: data.match.status,
      });

      // Auto-move to next submatch if current one completed
      if (updatedSub.completed && data.match.status !== "completed") {
        setTimeout(() => {
          get().moveToNextSubMatch();
        }, 2000);
      }
    } catch (error: any) {
      // Revert optimistic update
      set({ side1Score, side2Score });
      toast.error(error.response?.data?.error || "Failed to update score");
      console.error(error);
    } finally {
      set({ isUpdatingScore: false });
    }
  },

  subtractPoint: async (side: "side1" | "side2") => {
    const { match, currentSubMatchIndex, side1Score, side2Score, currentGame } =
      get();

    if (!match) return;

    const currentSub = match.subMatches?.[currentSubMatchIndex];
    if (!currentSub) return;

    const currentScore = side === "side1" ? side1Score : side2Score;
    if (currentScore <= 0) {
      toast.error("Score cannot go below 0");
      return;
    }

    const newSide1Score = side === "side1" ? side1Score - 1 : side1Score;
    const newSide2Score = side === "side2" ? side2Score - 1 : side2Score;

    set({ isUpdatingScore: true });

    try {
      const { data } = await axiosInstance.post(
        `/api/matches/team/${match._id}/submatch`,
        {
          subMatchNumber: currentSub.subMatchNumber,
          gameNumber: currentGame,
          side1Score: newSide1Score,
          side2Score: newSide2Score,
        }
      );

      const updatedSub = data.match.subMatches[currentSubMatchIndex];
      const updatedGame = updatedSub.games[currentGame - 1];

      set({
        match: data.match,
        side1Score: updatedGame?.team1Score ?? 0,
        side2Score: updatedGame?.team2Score ?? 0,
        side1Sets: updatedSub.finalScore.team1Sets,
        side2Sets: updatedSub.finalScore.team2Sets,
      });

      toast.success("Point removed");
    } catch (error: any) {
      toast.error("Failed to subtract point");
      console.error(error);
    } finally {
      set({ isUpdatingScore: false });
    }
  },

  resetCurrentGame: async (fullReset = false) => {
    const { match, currentSubMatchIndex } = get();
    if (!match) return;

    if (fullReset) {
      // Reset entire match
      try {
        const { data } = await axiosInstance.put(
          `/api/matches/team/${match._id}`,
          {
            status: "scheduled",
            subMatches: [],
            finalScore: { team1Matches: 0, team2Matches: 0 },
          }
        );

        set({
          match: data.match,
          currentSubMatchIndex: 0,
          side1Score: 0,
          side2Score: 0,
          team1Wins: 0,
          team2Wins: 0,
          side1Sets: 0,
          side2Sets: 0,
          status: "scheduled",
          isMatchActive: false,
          currentGame: 1,
        });

        toast.success("Match reset successfully");
      } catch (error) {
        toast.error("Failed to reset match");
        console.error(error);
      }
    } else {
      // Reset current game only
      set({
        side1Score: 0,
        side2Score: 0,
      });
      toast.success("Current game reset");
    }
  },

  toggleMatch: async () => {
    const { match, isMatchActive } = get();
    if (!match) return;

    // If starting and no submatches, initialize first
    if (!isMatchActive && (!match.subMatches || match.subMatches.length === 0)) {
      await get().initializeSubMatches();
      return;
    }

    try {
      const newStatus = isMatchActive ? "scheduled" : "in_progress";
      await axiosInstance.put(`/api/matches/team/${match._id}`, {
        status: newStatus,
      });

      set({
        isMatchActive: !isMatchActive,
        status: newStatus,
      });

      toast.success(isMatchActive ? "Match paused" : "Match started");
    } catch (error) {
      toast.error("Failed to toggle match");
      console.error(error);
    }
  },

  moveToNextSubMatch: () => {
    const { match, currentSubMatchIndex } = get();
    if (!match) return;

    const nextIndex = currentSubMatchIndex + 1;
    if (nextIndex >= match.subMatches.length) {
      toast.info("All submatches completed");
      return;
    }

    const nextSub = match.subMatches[nextIndex];
    const nextGame = nextSub.games[0];

    set({
      currentSubMatchIndex: nextIndex,
      side1Score: nextGame?.team1Score ?? 0,
      side2Score: nextGame?.team2Score ?? 0,
      side1Sets: nextSub.finalScore.team1Sets,
      side2Sets: nextSub.finalScore.team2Sets,
      currentGame: 1,
    });

    toast.success(`Moving to ${nextSub.matchLabel}`);
  },
}));