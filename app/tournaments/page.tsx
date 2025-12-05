"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";
import HeaderHero from "./components/HeaderHero";
import FiltersBar, { type FilterState } from "./components/FiltersBar";
import TournamentCard from "./components/TournamentCard";
import EmptyState from "./components/EmptyState";
import { Loader2 } from "lucide-react";

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
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>({ query: "", status: "all", format: "all", sort: "recent" });

  // Intersection Observer ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch tournaments with pagination
  const fetchTournaments = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const skip = pageNum * ITEMS_PER_PAGE;
      const { data } = await axiosInstance.get(
        `/tournaments?limit=${ITEMS_PER_PAGE}&skip=${skip}`
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTournaments(0, false);
  }, [fetchTournaments]);

  // Load more when intersection observer triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !loading &&
          hasMore
        ) {
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

  const summary = useMemo(() => {
    const s = { total: tournaments.length, upcoming: 0, in_progress: 0, completed: 0 };
    for (const t of tournaments) {
      if (t.status === "upcoming") s.upcoming += 1;
      else if (t.status === "in_progress") s.in_progress += 1;
      else if (t.status === "completed") s.completed += 1;
    }
    return s;
  }, [tournaments]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = tournaments.filter((t) => {
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q);
      const matchesStatus = filters.status === "all" || t.status === filters.status;
      const matchesFormat = filters.format === "all" || t.format === filters.format;
      return matchesQuery && matchesStatus && matchesFormat;
    });

    switch (filters.sort) {
      case "upcoming":
        list = list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case "participants":
        list = list.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
        break;
      case "name":
        list = list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
      default:
        list = list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
    }

    return list;
  }, [tournaments, filters]);

  const hasFilters = !!(filters.query || filters.status !== "all" || filters.format !== "all");

  return (
    <div className="space-y-4">
      <HeaderHero summary={summary} />

      <FiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <div className="py-4">
          <TournamentsSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </section>

          {/* Intersection Observer Target */}
          <div ref={observerTarget} className="h-20 flex items-center justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm">Loading more tournaments...</span>
              </div>
            )}
            {!hasMore && tournaments.length > 0 && (
              <p className="text-sm text-gray-500">No more tournaments to load</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
