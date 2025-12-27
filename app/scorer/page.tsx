"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, Trophy } from "lucide-react";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { EmptyState } from "../tournaments/components/EmptyState";
import ScorerHeaderHero, {
  type ScorerFilterState,
} from "./components/ScorerHeaderHero";
import ScorerCard from "./components/ScorerCard";

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
  scorers?: any[];
  currentPhase?: "round_robin" | "knockout" | "transition";
  hybridConfig?: {
    roundRobinUseGroups?: boolean;
  };
}

export default function ScorerDashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ScorerFilterState>({
    query: "",
    status: "all",
    format: "all",
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

        const { data } = await axiosInstance.get(
          `/scorer/tournaments?${params.toString()}`
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

  if (loading && tournaments.length === 0) {
    return (
      <TournamentErrorBoundary>
        <div className="min-h-screen bg-lb-white">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#3c6e71]" />
          </div>
        </div>
      </TournamentErrorBoundary>
    );
  }

  return (
    <TournamentErrorBoundary>
      <div className="min-h-screen bg-lb-white">
        <ScorerHeaderHero filters={filters} onFiltersChange={setFilters} />

        {tournaments.length === 0 ? (
          <div className="py-4 px-4">
            <EmptyState
              icon={Trophy}
              title="No tournaments assigned"
              description="You haven't been assigned as a scorer for any tournaments yet."
            />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-px bg-[#d9d9d9] p-1">
              {tournaments.map((t) => (
                <ScorerCard key={t._id} tournament={t} />
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
