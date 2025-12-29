"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import MatchesList from "@/components/MatchesList";
import TeamMatchesList from "@/components/TeamMatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Plus, Search, Loader2, Filter, X, CalendarDays } from "lucide-react";
import GroupsIcon from "@mui/icons-material/Groups";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IndividualMatch, TeamMatch } from "@/types/match.type";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import TeamMatchesListSkeleton from "@/components/skeletons/TeamMatchesListSkeleton";
import Link from "next/link";
import { EmptyState } from "../tournaments/components/EmptyState";
import { Diversity3 } from "@mui/icons-material";
import { useIndividualMatchFilters, useTeamMatchFilters } from "@/hooks/useFilters";

const ITEMS_PER_PAGE = 15;

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState("individual");

  // Individual matches state
  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>([]);
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualLoadingMore, setIndividualLoadingMore] = useState(false);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [individualPage, setIndividualPage] = useState(0);

  // Team matches state
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamLoadingMore, setTeamLoadingMore] = useState(false);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [teamPage, setTeamPage] = useState(0);

  // Filter hooks with debounced search
  const individualFilters = useIndividualMatchFilters(300);
  const teamFilters = useTeamMatchFilters(300);

  // Show/hide filters
  const [showFilters, setShowFilters] = useState(false);

  // Intersection Observer refs
  const individualObserverTarget = useRef<HTMLDivElement>(null);
  const teamObserverTarget = useRef<HTMLDivElement>(null);

  // Fetch individual matches with server-side filtering
  const fetchIndividualMatches = useCallback(
    async (page: number, append = false) => {
      try {
        if (append) {
          setIndividualLoadingMore(true);
        } else {
          setIndividualLoading(true);
        }

        const skip = page * ITEMS_PER_PAGE;
        const params = individualFilters.buildQueryParams({ limit: ITEMS_PER_PAGE, skip });
        
        const { data } = await axiosInstance.get(`/matches/individual?${params.toString()}`);

        if (append) {
          setIndividualMatches((prev) => [...prev, ...(data.matches || [])]);
        } else {
          setIndividualMatches(data.matches || []);
        }

        setIndividualHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching individual matches:", err);
      } finally {
        setIndividualLoading(false);
        setIndividualLoadingMore(false);
      }
    },
    [individualFilters]
  );

  // Fetch team matches with server-side filtering
  const fetchTeamMatches = useCallback(
    async (page: number, append = false) => {
      try {
        if (append) {
          setTeamLoadingMore(true);
        } else {
          setTeamLoading(true);
        }

        const skip = page * ITEMS_PER_PAGE;
        const params = teamFilters.buildQueryParams({ limit: ITEMS_PER_PAGE, skip });

        const { data } = await axiosInstance.get(`/matches/team?${params.toString()}`);

        if (append) {
          setTeamMatches((prev) => [...prev, ...(data.matches || [])]);
        } else {
          setTeamMatches(data.matches || []);
        }

        setTeamHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching team matches:", err);
      } finally {
        setTeamLoading(false);
        setTeamLoadingMore(false);
      }
    },
    [teamFilters]
  );

  // Refetch individual matches when filters change (using debounced search)
  useEffect(() => {
    if (activeTab === "individual") {
      setIndividualPage(0);
      fetchIndividualMatches(0, false);
    }
  }, [
    activeTab,
    individualFilters.debouncedSearch,
    individualFilters.filters.type,
    individualFilters.filters.status,
    individualFilters.filters.dateFrom,
    individualFilters.filters.dateTo,
  ]);

  // Refetch team matches when filters change (using debounced search)
  useEffect(() => {
    if (activeTab === "team") {
      setTeamPage(0);
      fetchTeamMatches(0, false);
    }
  }, [
    activeTab,
    teamFilters.debouncedSearch,
    teamFilters.filters.format,
    teamFilters.filters.status,
    teamFilters.filters.dateFrom,
    teamFilters.filters.dateTo,
  ]);

  // Load more individual matches when intersection observer triggers
  useEffect(() => {
    if (activeTab !== "individual") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !individualLoadingMore &&
          !individualLoading &&
          individualHasMore &&
          activeTab === "individual"
        ) {
          const nextPage = individualPage + 1;
          setIndividualPage(nextPage);
          fetchIndividualMatches(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (individualObserverTarget.current) {
      observer.observe(individualObserverTarget.current);
    }

    return () => {
      if (individualObserverTarget.current) {
        observer.unobserve(individualObserverTarget.current);
      }
    };
  }, [
    individualLoadingMore,
    individualLoading,
    individualHasMore,
    individualPage,
    activeTab,
    fetchIndividualMatches,
  ]);

  // Load more team matches when intersection observer triggers
  useEffect(() => {
    if (activeTab !== "team") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !teamLoadingMore &&
          !teamLoading &&
          teamHasMore &&
          activeTab === "team"
        ) {
          const nextPage = teamPage + 1;
          setTeamPage(nextPage);
          fetchTeamMatches(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (teamObserverTarget.current) {
      observer.observe(teamObserverTarget.current);
    }

    return () => {
      if (teamObserverTarget.current) {
        observer.unobserve(teamObserverTarget.current);
      }
    };
  }, [
    teamLoadingMore,
    teamLoading,
    teamHasMore,
    teamPage,
    activeTab,
    fetchTeamMatches,
  ]);

  // Get current filters based on active tab
  const currentFilters = activeTab === "individual" ? individualFilters : teamFilters;

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <header className="bg-[#353535] text-lb-white p-6 space-y-4">
        <h1 className="text-[11px] font-bold uppercase tracking-[0.2em]">Matches</h1>

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-[#d9d9d9] size-4" />
            <Input
              placeholder={
                activeTab === "individual"
                  ? "Search by player name..."
                  : "Search by team name..."
              }
              value={
                activeTab === "individual"
                  ? individualFilters.filters.search
                  : teamFilters.filters.search
              }
              onChange={(e) =>
                activeTab === "individual"
                  ? individualFilters.setFilter("search", e.target.value)
                  : teamFilters.setFilter("search", e.target.value)
              }
              className="pl-9 bg-[#284b63] border-[#284b63] text-[#ffffff] placeholder:text-[#d9d9d9] text-sm focus:ring-1 focus:ring-[#3c6e71]"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 border-[#284b63] hover:bg-[#3c6e71] text-[#ffffff] ${
              currentFilters.hasActiveFilters ? "bg-[#3c6e71]" : "bg-[#284b63]"
            }`}
          >
            <Filter className="size-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-[#284b63] p-4 space-y-3 border border-[#3c6e71]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffffff]">Filters</h3>
              <div className="flex items-center gap-2">
                {currentFilters.hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (activeTab === "individual") {
                        individualFilters.clearAll();
                      } else {
                        teamFilters.clearAll();
                      }
                    }}
                    className="h-6 px-2 text-[10px] uppercase tracking-wider text-[#d9d9d9] hover:bg-[#3c6e71] hover:text-white"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  className="size-6 hover:bg-[#3c6e71] text-[#d9d9d9]"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {activeTab === "individual" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                      Type
                    </label>
                    <Select
                      value={individualFilters.filters.type}
                      onValueChange={(val) => individualFilters.setFilter("type", val)}
                    >
                      <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="singles">Singles</SelectItem>
                        <SelectItem value="doubles">Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                      Status
                    </label>
                    <Select
                      value={individualFilters.filters.status}
                      onValueChange={(val) => individualFilters.setFilter("status", val)}
                    >
                      <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="not_started">Scheduled</SelectItem>
                        <SelectItem value="in_progress">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <CalendarDays className="size-3" /> Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <Input
                      type="date"
                      value={individualFilters.filters.dateFrom}
                      onChange={(e) => individualFilters.setFilter("dateFrom", e.target.value)}
                      className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={individualFilters.filters.dateTo}
                      onChange={(e) => individualFilters.setFilter("dateTo", e.target.value)}
                      className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                      Format
                    </label>
                    <Select
                      value={teamFilters.filters.format}
                      onValueChange={(val) => teamFilters.setFilter("format", val)}
                    >
                      <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                        <SelectValue placeholder="Filter by format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="five_singles">Swaythling (5 Singles)</SelectItem>
                        <SelectItem value="single_double_single">Single-Double-Single</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                      Status
                    </label>
                    <Select
                      value={teamFilters.filters.status}
                      onValueChange={(val) => teamFilters.setFilter("status", val)}
                    >
                      <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="not_started">Scheduled</SelectItem>
                        <SelectItem value="in_progress">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <CalendarDays className="size-3" /> Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <Input
                      type="date"
                      value={teamFilters.filters.dateFrom}
                      onChange={(e) => teamFilters.setFilter("dateFrom", e.target.value)}
                      className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={teamFilters.filters.dateTo}
                      onChange={(e) => teamFilters.setFilter("dateTo", e.target.value)}
                      className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <Tabs
        defaultValue="individual"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "100%",
            backgroundColor: "#ffffff",
            padding: 0,
            borderRadius: "0px",
            height: "auto",
          }}
        >
          <TabsTrigger
            value="individual"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              padding: "0.5rem",
              letterSpacing: "-0.01em",
              borderRadius: "0px",
            }}
            className="data-[state=active]:bg-white data-[state=active]:text-[#353535] data-[state=inactive]:text-[#353535] hover:bg-[#f5f5f5]"
          >
            Individual
          </TabsTrigger>
          <TabsTrigger
            value="team"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              padding: "0.5rem",
              letterSpacing: "-0.01em",
              borderRadius: "0px",
            }}
            className="data-[state=active]:bg-white data-[state=active]:text-[#353535] data-[state=inactive]:text-[#353535] hover:bg-[#f5f5f5]"
          >
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="">
          {individualLoading ? (
            <MatchesListSkeleton />
          ) : (
            <>
              <MatchesList matches={individualMatches} />

              <div
                ref={individualObserverTarget}
                style={{
                  height: "5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {individualLoadingMore && (
                  <div
                    className="flex items-center gap-2"
                    style={{ color: "#3c6e71" }}
                  >
                    <Loader2 className="animate-spin" size={20} />
                    <span style={{ fontSize: "0.875rem" }}>
                      Loading more...
                    </span>
                  </div>
                )}
                {!individualHasMore && individualMatches.length > 0 && (
                  <p style={{ fontSize: "0.875rem", color: "#d9d9d9" }}>
                    No more matches
                  </p>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="team" style={{ margin: 0 }}>
          {teamLoading ? (
            <TeamMatchesListSkeleton />
          ) : (
            <>
              {teamMatches.length === 0 ? (
                <EmptyState
                  icon={Diversity3}
                  title="No team matches yet"
                  description="Create a team match to schedule games and track results."
                  actionLabel="Create team match"
                  actionHref="/match/create"
                />
              ) : (
                <>
                  <TeamMatchesList matches={teamMatches} />

                  <div
                    ref={teamObserverTarget}
                    style={{
                      height: "5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {teamLoadingMore && (
                      <div
                        className="flex items-center gap-2"
                        style={{ color: "#3c6e71" }}
                      >
                        <Loader2 className="animate-spin" size={20} />
                        <span style={{ fontSize: "0.875rem" }}>
                          Loading more...
                        </span>
                      </div>
                    )}
                    {!teamHasMore && teamMatches.length > 0 && (
                      <p style={{ fontSize: "0.875rem", color: "#d9d9d9" }}>
                        No more matches
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
