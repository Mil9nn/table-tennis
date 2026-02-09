"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";
import HeaderHero, { type FilterState } from "./components/HeaderHero";
import TournamentCard from "./components/TournamentCard";
import { Loader2 } from "lucide-react";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { EmptyState } from "./components/EmptyState";

const ITEMS_PER_PAGE = 10;

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category?: string;
  matchType?: string;
  startDate: string;
  endDate?: string;
  status: string;
  city: string;
  venue?: string;
  participants: any[];
  organizer?: any;
  maxParticipants?: number;
  standings?: Array<{
    participant: any;
    rank: number;
  }>;
  bracket?: {
    completed?: boolean;
    rounds?: Array<{
      roundNumber: number;
      matches?: Array<{
        participant1?: any;
        participant2?: any;
        winner?: string;
      }>;
    }>;
  };
  knockoutStatistics?: {
    outcome?: {
      champion?: {
        participantId: string;
        participantName: string;
      };
    };
  };
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    status: "all",
    format: "all",
    sort: "recent",
    dateFrom: "",
    dateTo: "",
  });

  // Intersection Observer ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch tournaments with pagination and filters
  const fetchTournaments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const skip = pageNum * ITEMS_PER_PAGE;

        // Build query params
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE.toString(),
          skip: skip.toString(),
        });

        if (filters.status && filters.status !== "all") {
          params.append("status", filters.status);
        }
        if (filters.format && filters.format !== "all") {
          params.append("format", filters.format);
        }
        if (filters.query) {
          params.append("search", filters.query);
        }
        if (filters.dateFrom) {
          params.append("dateFrom", filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append("dateTo", filters.dateTo);
        }

        // Add sort parameters
        if (filters.sort === "recent") {
          params.append("sortBy", "createdAt");
          params.append("sortOrder", "desc");
        } else if (filters.sort === "upcoming") {
          params.append("sortBy", "startDate");
          params.append("sortOrder", "asc");
        } else if (filters.sort === "name") {
          params.append("sortBy", "name");
          params.append("sortOrder", "asc");
        } else if (filters.sort === "participants") {
          params.append("sortBy", "startDate"); // Participants sorting requires aggregation, keeping date sort
          params.append("sortOrder", "desc");
        }

        const { data } = await axiosInstance.get(
          `/tournaments?${params.toString()}`
        );

        if (append) {
          setTournaments((prev) => [...prev, ...(data.tournaments || [])]);
        } else {
          setTournaments(data.tournaments || []);
        }

        setHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Initial fetch and refetch when filters change
  useEffect(() => {
    setPage(0);
    fetchTournaments(0, false);
  }, [filters, fetchTournaments]);

  // Load more when intersection observer triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTournaments(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadingMore, loading, hasMore, page, fetchTournaments]);

  // Server-side filtering is now handled, but we still do client-side sorting for participants
  // since server-side participant sorting requires aggregation
  const filtered = useMemo(() => {
    let list = [...tournaments];

    // Client-side sort only for participants (server doesn't support this efficiently)
    if (filters.sort === "participants") {
      list = list.sort(
        (a, b) => (b.participants?.length || 0) - (a.participants?.length || 0)
      );
    }

    return list;
  }, [tournaments, filters.sort]);

  const hasFilters = !!(
    filters.query ||
    filters.status !== "all" ||
    filters.format !== "all" ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <TournamentErrorBoundary>
      <div className="min-h-screen bg-lb-white">
        <HeaderHero filters={filters} onFiltersChange={setFilters} />

        {loading ? (
          <div className="py-4 px-4">
            <TournamentsSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-4 px-4">
            <EmptyState
              title="No tournaments found"
              description="Create a tournament to manage matches, rankings, and progression."
              actionLabel="Create tournament"
              actionHref="/tournaments/create"
            />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-px bg-[#d9d9d9] p-1">
              {filtered.map((t) => (
                <TournamentCard key={t._id} tournament={t} />
              ))}
            </section>

            {/* Intersection Observer Target */}
            <div
              ref={observerTarget}
              className="h-20 flex items-center justify-center py-8"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-[#3c6e71]">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm">Loading more tournaments...</span>
                </div>
              )}
              {!hasMore && tournaments.length > 0 && (
                <p className="text-sm text-[#353535]">
                  No more tournaments to load
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </TournamentErrorBoundary>
  );
}
