import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import type { PlayerStats, TeamStats, TournamentPlayerStats, LeaderboardType } from "../types";

const ITEMS_PER_PAGE = 15;

interface UseLeaderboardReturn {
  leaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
  tournamentLeaderboard: TournamentPlayerStats[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  fetchMore: () => void;
}

export function useLeaderboard(activeTab: LeaderboardType): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamStats[]>([]);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<TournamentPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0);
      }

      const skip = pageNum * ITEMS_PER_PAGE;

      if (activeTab === "teams") {
        const { data } = await axiosInstance.get(
          `/leaderboard/teams?limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );
        if (append) {
          setTeamLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setTeamLeaderboard(data.leaderboard || []);
        }
        setHasMore(data.pagination?.hasMore || false);
      } else if (activeTab === "tournaments") {
        const { data } = await axiosInstance.get(
          `/leaderboard/tournaments?limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );
        if (append) {
          setTournamentLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setTournamentLeaderboard(data.leaderboard || []);
        }
        setHasMore(data.pagination?.hasMore || false);
      } else {
        const { data } = await axiosInstance.get(
          `/leaderboard/unified?type=${activeTab}&limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );
        if (append) {
          setLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setLeaderboard(data.leaderboard || []);
        }
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      if (activeTab === "teams") {
        if (!append) setTeamLeaderboard([]);
      } else if (activeTab === "tournaments") {
        if (!append) setTournamentLeaderboard([]);
      } else {
        if (!append) setLeaderboard([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // Reset state when tab changes
    setLeaderboard([]);
    setTeamLeaderboard([]);
    setTournamentLeaderboard([]);
    setPage(0);
    setHasMore(true);
    fetchData(0, false);
  }, [activeTab, fetchData]);

  const fetchMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchData]);

  return { leaderboard, teamLeaderboard, tournamentLeaderboard, loading, loadingMore, hasMore, fetchMore };
}
