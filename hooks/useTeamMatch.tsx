import { create } from "zustand";
import { toast } from "sonner";
import { buildTeamOrder, getTeamMatchWinner } from "@/components/live-scorer/team/helpers";
import type { MatchStatus, TeamMatch } from "@/types/match.type";

interface TeamMatchState {
  match: TeamMatch | null;
  status: MatchStatus;

  currentTieIndex: number;
  matchesWonA: number;
  matchesWonB: number;
  isTeamActive: boolean;

  setInitialMatch: (match: TeamMatch) => void;
  toggleTeamMatch: () => void;
  resetTeamMatch: (full?: boolean) => void;
  addTieResult: (winner: "side1" | "side2") => void;
}

export const useTeamMatch = create<TeamMatchState>((set, get) => ({
  match: null,
  status: "scheduled",
  currentTieIndex: 0,
  matchesWonA: 0,
  matchesWonB: 0,
  isTeamActive: false,

  setInitialMatch: (match) => {
    set({
      match,
      status: match.status ?? "scheduled",
      currentTieIndex: 0,
      matchesWonA: match.finalScore?.side1Ties ?? 0,
      matchesWonB: match.finalScore?.side2Ties ?? 0,
      isTeamActive: false,
    });
  },

  toggleTeamMatch: () => {
    const { status } = get();
    if (status === "scheduled") {
      set({ status: "in_progress", isTeamActive: true });
      toast.success("Team match started");
    } else if (status === "in_progress") {
      set({ isTeamActive: false, status: "scheduled" });
      toast("Team match paused");
    } else {
      toast.error("Match already completed");
    }
  },

  resetTeamMatch: (full = false) => {
    if (full) {
      set({
        match: null,
        status: "scheduled",
        currentTieIndex: 0,
        matchesWonA: 0,
        matchesWonB: 0,
        isTeamActive: false,
      });
      toast.success("Team match fully reset");
    } else {
      set({
        currentTieIndex: 0,
        matchesWonA: 0,
        matchesWonB: 0,
        status: "scheduled",
        isTeamActive: false,
      });
      toast.success("Team match reset to start");
    }
  },

  addTieResult: (winner) => {
    const { match, currentTieIndex, matchesWonA, matchesWonB } = get();
    if (!match) return;

    const order = buildTeamOrder(match.matchType);
    if (!order[currentTieIndex]) {
      toast.error("No tie at this index");
      return;
    }

    let sideAWins = matchesWonA;
    let sideBWins = matchesWonB;

    if (winner === "side1") sideAWins++;
    if (winner === "side2") sideBWins++;

    const teamWinner = getTeamMatchWinner(sideAWins, sideBWins, order.length);

    if (teamWinner) {
      set({
        matchesWonA: sideAWins,
        matchesWonB: sideBWins,
        status: "completed",
        isTeamActive: false,
      });
      toast.success(
        teamWinner === "sideA" ? "Team A wins the match!" : "Team B wins the match!"
      );
    } else {
      set({
        matchesWonA: sideAWins,
        matchesWonB: sideBWins,
        currentTieIndex: currentTieIndex + 1,
      });
      toast.success(
        `Tie ${currentTieIndex + 1} finished — ${winner === "side1" ? "Team A" : "Team B"} won`
      );
    }
  },
}));