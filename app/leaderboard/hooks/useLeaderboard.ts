import { useState, useEffect, useCallback, useRef } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import type { PlayerStats, TeamStats, LeaderboardType } from "../types";
import type { LeaderboardFilters } from "@/lib/leaderboard/filterUtils";

const ITEMS_PER_PAGE = 15;

interface UseLeaderboardReturn {
  leaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buildQueryParams = useCallback(
    (skip: number, filters?: Partial<LeaderboardFilters>) => {
      const params = new URLSearchParams();
      
      // For Individual tab, add type filter if provided (not "all")
      // For Teams tab, don't add type param
      if (activeTab === "individual" && filters?.type && filters.type !== "all") {
        params.append("type", filters.type);
      }
      
      // Pagination
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("skip", skip.toString());
      
      // Add filters if provided
      if (filters) {
        if (filters.gender) params.append("gender", filters.gender);
        if (filters.handedness) params.append("handedness", filters.handedness);
        if (filters.timeRange) params.append("timeRange", filters.timeRange);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.tournamentId) params.append("tournamentId", filters.tournamentId);
        if (filters.tournamentSeason) params.append("tournamentSeason", filters.tournamentSeason.toString());
        if (filters.matchFormat) params.append("matchFormat", filters.matchFormat);
        if (filters.eventCategory) params.append("eventCategory", filters.eventCategory);
      }
      
      return params.toString();
    },
    [activeTab]
  );

  const fetchData = useCallback(
    async (pageNum: number, append = false) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller and request ID for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const currentRequestId = ++requestIdRef.current;

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
            `/leaderboard/teams?limit=${ITEMS_PER_PAGE}&skip=${skip}`,
            { signal: abortController.signal }
          );

          // Ignore if this is not the latest request
          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          if (append) {
            setTeamLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
          } else {
            setTeamLeaderboard(data.leaderboard || []);
          }
          setHasMore(data.pagination?.hasMore || false);
        } else if (activeTab === "individual") {
          // Use filtered endpoint for individual leaderboard
          const queryParams = buildQueryParams(skip, options?.filters);
          const { data } = await axiosInstance.get(
            `/leaderboard/filtered?${queryParams}`,
            { signal: abortController.signal }
          );

          // Ignore if this is not the latest request
          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          if (append) {
            setLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
          } else {
            setLeaderboard(data.leaderboard || []);
          }
          setHasMore(data.pagination?.hasMore || false);
        }
      } catch (error: any) {
        // Ignore abort/cancel errors (axios uses ERR_CANCELED for AbortController)
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError') {
          return;
        }

        // Ignore if this is not the latest request
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.error("Error fetching leaderboard:", error);
        if (activeTab === "teams") {
          if (!append) setTeamLeaderboard([]);
        } else {
          if (!append) setLeaderboard([]);
        }
        setHasMore(false);
      } finally {
        // Only update loading state if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
          }
        }
      }
    },
    [activeTab, options?.filters, buildQueryParams]
  );

  useEffect(() => {
    // Cancel any in-flight requests when filters or tab change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset state when tab or filters change
    setLeaderboard([]);
    setTeamLeaderboard([]);
    setPage(0);
    setHasMore(true);
    fetchData(0, false);
  }, [activeTab, options?.filters, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchData]);

  return { leaderboard, teamLeaderboard, loading, loadingMore, hasMore, fetchMore };
}
