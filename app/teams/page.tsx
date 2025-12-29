"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit2,
  Trash,
  Search,
  MapPin,
  ChevronLeftCircle,
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

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
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
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            borderBottom: "1px solid #d9d9d9",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          className="hover:bg-[#f5f5f5] p-2"
          onClick={() => setSelectedTeam(team)}
        >
          <Image
            src={team.logo || "/imgs/logo.png"}
            alt={team.name}
            width={40}
            height={40}
            style={{ width: "2.5rem", height: "2.5rem", objectFit: "cover" }}
            className="rounded-full shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontWeight: "600",
                  fontSize: "0.9375rem",
                  color: "#353535",
                  letterSpacing: "-0.01em",
                }}
                className="truncate"
              >
                {team.name}
              </span>
              {team.city && (
                <span style={{ fontSize: "0.8125rem", color: "#d9d9d9" }}>
                  • {team.city}
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-3"
              style={{ marginTop: "0.25rem" }}
            >
              <span style={{ fontSize: "0.8125rem", color: "#d9d9d9" }}>
                {team.players?.length || 0} players
              </span>
              <span style={{ fontSize: "0.8125rem", color: "#d9d9d9" }}>
                {team.record?.wins || 0}W - {team.record?.losses || 0}L
              </span>
            </div>
          </div>

          {team.captain?.profileImage ? (
            <Image
              src={team.captain.profileImage}
              alt={team.captain.fullName || team.captain.username || "Captain"}
              width={28}
              height={28}
              style={{ width: "1.75rem", height: "1.75rem", objectFit: "cover" }}
              className="rounded-full shrink-0"
            />
          ) : (
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                backgroundColor: "#d9d9d9",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: "#353535",
              }}
              className="rounded-full flex items-center justify-center shrink-0"
            >
              {(
                team.captain?.fullName?.[0] ||
                team.captain?.username?.[0] ||
                "?"
              ).toUpperCase()}
            </div>
          )}

          <ArrowRight
            style={{ width: "1rem", height: "1rem", color: "#d9d9d9" }}
            className="shrink-0"
          />
        </div>

        <Dialog
          open={selectedTeam?._id === team._id}
          onOpenChange={(open) => !open && setSelectedTeam(null)}
        >
          <DialogContent className="w-md max-h-[80vh] p-0 overflow-y-auto rounded-xl [&>button]:hidden">
            <DialogHeader className="gap-0">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#3c6e71",
                }}
              >
                <button
                  onClick={() => setSelectedTeam(null)}
                  style={{ padding: "0.25rem", transition: "background-color 0.15s" }}
                  className="hover:bg-white/10 rounded-full"
                >
                  <ChevronLeftCircle
                    style={{ width: "1.5rem", height: "1.5rem", color: "#ffffff" }}
                  />
                </button>
                <DialogTitle
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "1rem",
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  Team Details
                </DialogTitle>
                <div>
                  {isOwner && (
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/teams/${team._id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          style={{
                            width: "2rem",
                            height: "2rem",
                            color: "#ffffff",
                          }}
                          className="hover:bg-white/10"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        style={{
                          width: "2rem",
                          height: "2rem",
                          color: "#ffffff",
                        }}
                        className="hover:bg-white/10"
                        onClick={() => deleteTeam(team._id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(to bottom, #3c6e71, #284b63)",
                  padding: "0.5rem 1rem 1.25rem",
                }}
              >
                <div className="flex flex-col items-center">
                  <Image
                    src={team.logo || "/imgs/logo.png"}
                    alt={team.name}
                    width={72}
                    height={72}
                    style={{
                      width: "4.5rem",
                      height: "4.5rem",
                      objectFit: "cover",
                      border: "3px solid rgba(255,255,255,0.2)",
                    }}
                    className="rounded-full"
                  />
                  <h2
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "1.25rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {team.name}
                  </h2>
                  {team.city && (
                    <div
                      className="flex items-center gap-1.5"
                      style={{ marginTop: "0.25rem" }}
                    >
                      <MapPin
                        style={{
                          width: "0.875rem",
                          height: "0.875rem",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      />
                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                        {team.city}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "0.5rem",
                    marginTop: "1rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      padding: "0.5rem 0.25rem",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "1.125rem", color: "#ffffff", fontWeight: "600" }}>
                      {team.players?.length || 0}
                    </p>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Players
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      padding: "0.5rem 0.25rem",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "1.125rem", color: "#ffffff", fontWeight: "600" }}>
                      {(team.record?.wins || 0) + (team.record?.losses || 0)}
                    </p>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Matches
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      padding: "0.5rem 0.25rem",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "1.125rem", color: "#ffffff", fontWeight: "600" }}>
                      {team.record?.wins || 0}
                    </p>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Wins
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      padding: "0.5rem 0.25rem",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "1.125rem", color: "#ffffff", fontWeight: "600" }}>
                      {team.record?.losses || 0}
                    </p>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Losses
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div style={{ padding: "1rem", backgroundColor: "#ffffff" }}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: "0.75rem" }}
              >
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#353535",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Squad ({team.players?.length || 0})
                </h3>
                {isOwner && (
                  <Link
                    href={`/teams/${team._id}/assign`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{
                        fontSize: "0.75rem",
                        color: "#3c6e71",
                        height: "1.75rem",
                        padding: "0 0.5rem",
                      }}
                      className="hover:text-[#284b63]"
                    >
                      Assign Positions
                    </Button>
                  </Link>
                )}
              </div>
              <div className="space-y-1.5">
                {team.players.length > 0 ? (
                  team.players.map((p) => {
                    const isCaptain = team.captain?._id === p.user._id;
                    return (
                      <Link
                        key={p.user._id}
                        href={`/profile/${p.user._id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.625rem 0.75rem",
                          backgroundColor: "#ffffff",
                          border: "1px solid #d9d9d9",
                          transition: "background-color 0.15s",
                        }}
                        className="hover:bg-[#f5f5f5]"
                      >
                        <div className="flex items-center gap-3">
                          {p.user.profileImage ? (
                            <Image
                              src={p.user.profileImage}
                              alt={p.user.fullName || p.user.username}
                              width={36}
                              height={36}
                              style={{
                                width: "2.25rem",
                                height: "2.25rem",
                                objectFit: "cover",
                                border: isCaptain ? "2px solid #3c6e71" : "none",
                              }}
                              className="rounded-full"
                            />
                          ) : (
                            <div
                              style={{
                                width: "2.25rem",
                                height: "2.25rem",
                                background: "linear-gradient(135deg, #3c6e71, #284b63)",
                                color: "#ffffff",
                                fontWeight: "600",
                                fontSize: "0.875rem",
                                border: isCaptain ? "2px solid #3c6e71" : "none",
                              }}
                              className="rounded-full flex items-center justify-center"
                            >
                              {(
                                p.user.fullName?.[0] ||
                                p.user.username?.[0] ||
                                "?"
                              ).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.875rem",
                                  color: "#353535",
                                }}
                              >
                                {p.user.fullName || p.user.username}
                              </p>
                              {isCaptain && (
                                <span
                                  style={{
                                    fontSize: "0.625rem",
                                    fontWeight: "600",
                                    backgroundColor: "#3c6e71",
                                    color: "#ffffff",
                                    padding: "0.125rem 0.375rem",
                                  }}
                                >
                                  C
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "#d9d9d9" }}>
                              @{p.user.username}
                            </p>
                          </div>
                        </div>
                        {p.assignment && (
                          <span
                            style={{
                              fontSize: "0.625rem",
                              fontWeight: "500",
                              padding: "0.25rem 0.5rem",
                              backgroundColor: "rgba(60,110,113,0.1)",
                              color: "#3c6e71",
                            }}
                          >
                            {p.assignment}
                          </span>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#d9d9d9",
                      textAlign: "center",
                      padding: "1.5rem",
                    }}
                  >
                    No players yet
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <section style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <header className="bg-[#353535] text-[#ffffff] p-6 space-y-4">
        <h1 className="text-[11px] font-bold uppercase tracking-[0.2em]">Teams</h1>

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-[#d9d9d9] size-4" />
            <Input
              placeholder="Search teams..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 bg-[#284b63] border-[#284b63] text-[#ffffff] placeholder:text-[#d9d9d9] text-sm focus:ring-1 focus:ring-[#3c6e71]"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 border-[#284b63] hover:bg-[#3c6e71] text-[#ffffff] ${
              hasActiveFilters ? "bg-[#3c6e71]" : "bg-[#284b63]"
            }`}
          >
            <Filter className="size-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-[#284b63] p-4 space-y-3 border border-[#3c6e71]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffffff]">
                Filters
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                  City
                </label>
                <Select
                  value={filters.city}
                  onValueChange={(val) => setFilter("city", val)}
                >
                  <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
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
                <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(val) => setFilter("sortBy", val)}
                >
                  <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
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
              <div style={{ borderTop: "1px solid #d9d9d9" }}>
                {myTeams.map((team) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
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
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#d9d9d9" }}>
                {!user
                  ? "Please log in to see your teams."
                  : hasActiveFilters
                  ? "No teams found matching your filters."
                  : "You are not part of any teams yet."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-teams" style={{ margin: 0 }}>
          {loading ? (
            <TeamListSkeleton />
          ) : teams.length ? (
            <>
              <div style={{ borderTop: "1px solid #d9d9d9" }}>
                {teams.map((team) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
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
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d9d9d9",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              {hasActiveFilters
                ? "No teams found matching your filters."
                : "No teams found."}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
