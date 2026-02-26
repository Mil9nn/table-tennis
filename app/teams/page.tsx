"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarFallbackStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit2,
  Trash,
  Search,
  MapPin,
  ArrowRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isAxiosError } from "axios";
import { useTeamsFilters } from "@/hooks/useFilters";
import { EmptyState } from "../tournaments/components/EmptyState";
import GroupsIcon from "@mui/icons-material/Groups";

type Team = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  record?: { wins: number; losses: number };
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  players: {
    user: {
      _id: string;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
    assignment?: string;
  }[];
};

const ITEMS_PER_PAGE = 15;

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState("my-teams");

  // All teams - with pagination
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Available cities for filter dropdown (populated from API results)
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [showFilters, setShowFilters] = useState(false);

  // Use the shared filters hook with debounced search
  const { filters, debouncedSearch, setFilter, clearAll, hasActiveFilters, buildQueryParams } = useTeamsFilters(300);

  const user = useAuthStore((state) => state.user);

  // Intersection Observer refs
  const myTeamsObserverTarget = useRef<HTMLDivElement>(null);
  const allTeamsObserverTarget = useRef<HTMLDivElement>(null);

  // Fetch teams with server-side filtering and pagination
  const fetchTeams = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const skip = pageNum * ITEMS_PER_PAGE;
        const params = buildQueryParams({ limit: ITEMS_PER_PAGE, skip });

        const res = await axiosInstance.get(`/teams?${params.toString()}`);

        const newTeams = res.data.teams || [];

        if (append) {
          setTeams((prev) => [...prev, ...newTeams]);
        } else {
          setTeams(newTeams);
        }

        // Collect cities for filter dropdown (only on first fetch)
        if (!append && newTeams.length > 0) {
          const cities = Array.from(
            new Set(newTeams.map((t: Team) => t.city).filter(Boolean))
          ) as string[];
          setAvailableCities((prev) => {
            const combined = new Set([...prev, ...cities]);
            return Array.from(combined);
          });
        }

        setHasMore(res.data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching teams", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQueryParams]
  );

  // Refetch when filters change (using debounced search)
  useEffect(() => {
    setPage(0);
    fetchTeams(0, false);
  }, [debouncedSearch, filters.city, filters.sortBy]);

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axiosInstance.delete(`/teams/${id}`);
      toast.success("Team deleted");
      // Reset and refetch from beginning
      setPage(0);
      fetchTeams(0, false);
    } catch (err: unknown) {
      console.error("Delete failed", err);
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete team");
      }
    }
  };

  // Load more teams when intersection observer triggers for all-teams tab
  useEffect(() => {
    if (activeTab !== "all-teams") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !loading &&
          hasMore &&
          activeTab === "all-teams"
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTeams(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (allTeamsObserverTarget.current) {
      observer.observe(allTeamsObserverTarget.current);
    }

    return () => {
      if (allTeamsObserverTarget.current) {
        observer.unobserve(allTeamsObserverTarget.current);
      }
    };
  }, [loadingMore, loading, hasMore, page, activeTab, fetchTeams]);

  // Load more teams when intersection observer triggers for my-teams tab
  useEffect(() => {
    if (activeTab !== "my-teams") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !loading &&
          hasMore &&
          activeTab === "my-teams"
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTeams(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (myTeamsObserverTarget.current) {
      observer.observe(myTeamsObserverTarget.current);
    }

    return () => {
      if (myTeamsObserverTarget.current) {
        observer.unobserve(myTeamsObserverTarget.current);
      }
    };
  }, [loadingMore, loading, hasMore, page, activeTab, fetchTeams]);

  // Filter for "My Teams" tab - teams where user is captain
  const myTeams = useMemo(() => {
    if (!user) return [];
    return teams.filter((team) => team.captain?._id === user._id);
  }, [teams, user]);

  const TeamCard = ({ team }: { team: Team }) => {
    const user = useAuthStore((state) => state.user);
    const isOwner = user && team.captain?._id === user._id;

    return (
      <Link
        href={`/teams/${team._id}`}
        className="group block border border-[#d9d9d9] bg-[#ffffff] p-4 transition-colors hover:bg-[#3c6e71] w-full text-left"
      >
          {/* Line 1: Logo + Team Name */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage
                src={team.logo}
                alt={team.name}
              />
              <AvatarFallback className="bg-[#d9d9d9] text-[#353535] text-xs font-semibold">
                {team.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-gray-800 group-hover:text-white transition-colors truncate">
                {team.name}
              </span>
            </div>
          </div>

          {/* Line 2: Meta info */}
          <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-white/70 transition-colors">
            <span>{team.players?.length || 0} players</span>
            {team.city && (
              <>
                <span>•</span>
                <span>{team.city}</span>
              </>
            )}
          </div>

          {/* Line 3: Captain */}
          {team.captain && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 group-hover:text-white/70 transition-colors">
              <span>Captain: <span className="font-semibold">{team.captain.fullName || team.captain.username}</span></span>
            </div>
          )}
        </Link>
    );
  };

  return (
    <section className="h-[calc(100vh-115px)] flex flex-col">
      <header className="bg-white text-gray-800 p-6 space-y-4 border-b border-gray-200">
        <h1 className="text-[11px] font-bold uppercase tracking-[0.2em]">Teams</h1>

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 size-4" />
            <Input
              placeholder="Search teams..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 text-sm focus:ring-1 focus:ring-indigo-200"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 border-gray-200 hover:bg-gray-100 text-gray-700 ${
              hasActiveFilters ? "bg-gray-100" : "bg-white"
            }`}
          >
            <Filter className="size-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 space-y-3 border border-gray-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-800">
                Filters
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-6 px-2 text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  className="size-6 hover:bg-gray-100 text-gray-600"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                  City
                </label>
                <Select
                  value={filters.city}
                  onValueChange={(val) => setFilter("city", val)}
                >
                  <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(val) => setFilter("sortBy", val)}
                >
                  <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="wins">Most Wins</SelectItem>
                    <SelectItem value="players">Most Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </header>

      <Tabs defaultValue="my-teams" onValueChange={setActiveTab} className="w-full">
        <TabsList
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "100%",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #d9d9d9",
            padding: 0,
            height: "auto",
          }}
        >
          <TabsTrigger
            value="my-teams"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              padding: "0.5rem",
              color: "#353535",
              letterSpacing: "-0.01em",
              borderRadius: "0px",
            }}
            className="data-[state=active]:bg-white data-[state=active]:text-[#353535] data-[state=inactive]:text-[#353535] hover:bg-[#f5f5f5]"
          >
            My Teams
          </TabsTrigger>
          <TabsTrigger
            value="all-teams"
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              padding: "0.5rem",
              color: "#353535",
              letterSpacing: "-0.01em",
              borderRadius: "0px",
            }}
            className="data-[state=active]:bg-white data-[state=active]:text-[#353535] data-[state=inactive]:text-[#353535] hover:bg-[#f5f5f5]"
          >
            All Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-teams" style={{ margin: 0 }}>
           {loading ? (
             <TeamListSkeleton />
           ) : myTeams.length ? (
             <>
               <section className="grid grid-cols-1 gap-px bg-[#d9d9d9] px-1">
                 {myTeams.map((team) => (
                   <TeamCard key={team._id} team={team} />
                 ))}
               </section>
              <div
                ref={myTeamsObserverTarget}
                style={{
                  height: "5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loadingMore && (
                  <div className="flex items-center gap-2" style={{ color: "#3c6e71" }}>
                    <Loader2 className="animate-spin" size={20} />
                    <span style={{ fontSize: "0.875rem" }}>Loading more...</span>
                  </div>
                )}
                {!hasMore && teams.length > 0 && (
                  <p style={{ fontSize: "0.875rem", color: "#d9d9d9" }}>
                    No more teams
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={GroupsIcon}
              title={
                !user
                  ? "Please log in"
                  : hasActiveFilters
                  ? "No teams found"
                  : "No teams yet"
              }
              description={
                !user
                  ? "Log in to see your teams."
                  : hasActiveFilters
                  ? "Try adjusting your filters."
                  : "You are not part of any teams yet."
              }
              actionLabel={!user ? undefined : "Create a team"}
              actionHref={!user ? undefined : "/teams/create"}
            />
          )}
        </TabsContent>

        <TabsContent value="all-teams" style={{ margin: 0 }}>
           {loading ? (
             <TeamListSkeleton />
           ) : teams.length ? (
             <>
               <section className="grid grid-cols-1 gap-px bg-[#d9d9d9] px-1">
                 {teams.map((team) => (
                   <TeamCard key={team._id} team={team} />
                 ))}
               </section>
              <div
                ref={allTeamsObserverTarget}
                style={{
                  height: "5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loadingMore && (
                  <div className="flex items-center gap-2" style={{ color: "#3c6e71" }}>
                    <Loader2 className="animate-spin" size={20} />
                    <span style={{ fontSize: "0.875rem" }}>Loading more...</span>
                  </div>
                )}
                {!hasMore && teams.length > 0 && (
                  <p style={{ fontSize: "0.875rem", color: "#d9d9d9" }}>
                    No more teams
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={GroupsIcon}
              title="No teams found"
              description={
                hasActiveFilters
                  ? "Try adjusting your filters."
                  : "Browse all teams to find one to join."
              }
              actionLabel="Explore teams"
              actionHref="/teams"
            />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
