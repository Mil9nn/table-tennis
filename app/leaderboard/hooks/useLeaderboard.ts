import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import type { PlayerStats, TeamStats, TournamentPlayerStats, LeaderboardType } from "../types";
import type { LeaderboardFilters } from "@/lib/leaderboard/filterUtils";

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

interface UseLeaderboardOptions {
  filters?: Partial<LeaderboardFilters>;
}

export function useLeaderboard(
  activeTab: LeaderboardType,
  options?: UseLeaderboardOptions
): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamStats[]>([]);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<TournamentPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const buildQueryParams = useCallback(
    (skip: number, filters?: Partial<LeaderboardFilters>) => {
      const params = new URLSearchParams();
      
      // For Individual tab, add type filter if provided (not "all")
      // For Teams/Tournaments tabs, don't add type param
      if (activeTab === "individual" && filters?.type && filters.type !== "all") {
        params.append("type", filters.type);
      }
      
      // Pagination
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("skip", skip.toString());
      
      // Add filters if provided
      if (filters) {
        if (filters.gender) params.append("gender", filters.gender);
        if (filters.ageCategory) params.append("ageCategory", filters.ageCategory);
        if (filters.playerType) params.append("playerType", filters.playerType);
        if (filters.handedness) params.append("handedness", filters.handedness);
        if (filters.timeRange) params.append("timeRange", filters.timeRange);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.tournamentId) params.append("tournamentId", filters.tournamentId);
        if (filters.tournamentSeason) params.append("tournamentSeason", filters.tournamentSeason.toString());
        if (filters.matchFormat) params.append("matchFormat", filters.matchFormat);
        if (filters.eventCategory) params.append("eventCategory", filters.eventCategory);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }
      
      return params.toString();
    },
    [activeTab]
  );

  const fetchData = useCallback(
    async (pageNum: number, append = false) => {
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
        } else if (activeTab === "individual") {
          // Use filtered endpoint for individual leaderboard
          const queryParams = buildQueryParams(skip, options?.filters);
          const { data } = await axiosInstance.get(`/leaderboard/filtered?${queryParams}`);
          
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
    },
    [activeTab, options?.filters, buildQueryParams]
  );

  useEffect(() => {
    // Reset state when tab or filters change
    setLeaderboard([]);
    setTeamLeaderboard([]);
    setTournamentLeaderboard([]);
    setPage(0);
    setHasMore(true);
    fetchData(0, false);
  }, [activeTab, options?.filters, fetchData]);

  const fetchMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchData]);

  return { leaderboard, teamLeaderboard, tournamentLeaderboard, loading, loadingMore, hasMore, fetchMore };
}
