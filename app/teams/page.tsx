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
  Plus,
  Edit2,
  Trash,
  Search,
  MapPin,
  ChevronLeftCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isAxiosError } from "axios";

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
  
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const user = useAuthStore((state) => state.user);

  // Intersection Observer refs
  const myTeamsObserverTarget = useRef<HTMLDivElement>(null);
  const allTeamsObserverTarget = useRef<HTMLDivElement>(null);

  // Fetch teams with pagination
  const fetchTeams = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const skip = pageNum * ITEMS_PER_PAGE;
      const res = await axiosInstance.get(
        `/teams?limit=${ITEMS_PER_PAGE}&skip=${skip}`
      );
      
      if (append) {
        setTeams((prev) => [...prev, ...(res.data.teams || [])]);
      } else {
        setTeams(res.data.teams || []);
      }

      setHasMore(res.data.pagination?.hasMore || false);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch teams once on mount - both tabs use the same data
  // (my-teams filters client-side from all teams, so we need all teams anyway)
  useEffect(() => {
    if (teams.length === 0) {
      fetchTeams(0, false);
    }
  }, [fetchTeams, teams.length]);

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axiosInstance.delete(`/teams/${id}`);
      toast.success("Team deleted");
      // Reset and refetch from beginning
      setPage(0);
      setTeams([]);
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
  // We need to keep fetching until we have enough filtered results
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

  const myTeams = useMemo(() => {
    if (!user) return [];
    // Only show teams where the user is the captain (teams they created)
    return teams.filter((team) => {
      return team.captain?._id === user._id;
    });
  }, [teams, user]);

  const applyFilters = (teamList: Team[]) => {
    let filtered = teamList;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.captain?.username?.toLowerCase().includes(q) ||
          t.captain?.fullName?.toLowerCase().includes(q) ||
          t.players.some(
            (p) =>
              p.user.username.toLowerCase().includes(q) ||
              p.user.fullName?.toLowerCase().includes(q)
          )
      );
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((t) => t.city === cityFilter);
    }

    if (sortBy === "wins") {
      filtered = [...filtered].sort(
        (a, b) => (b.record?.wins || 0) - (a.record?.wins || 0)
      );
    } else if (sortBy === "players") {
      filtered = [...filtered].sort(
        (a, b) => (b.players?.length || 0) - (a.players?.length || 0)
      );
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filteredMyTeams = useMemo(
    () => applyFilters(myTeams),
    [myTeams, search, cityFilter, sortBy]
  );
  const filteredAllTeams = useMemo(
    () => applyFilters(teams),
    [teams, search, cityFilter, sortBy]
  );

  const cities = Array.from(new Set(teams.map((t) => t.city).filter(Boolean)));

  const TeamCard = ({ team }: { team: Team }) => {
    const user = useAuthStore((state) => state.user);
    const isOwner = user && team.captain?._id === user._id;

    return (
      <>
        <div
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => setSelectedTeam(team)}
        >
          {/* Team Logo */}
          <Image
            src={team.logo || "/imgs/logo.png"}
            alt={team.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-800 truncate">
                {team.name}
              </span>
              {team.city && (
                <span className="text-xs text-gray-400">• {team.city}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400">
                {team.players?.length || 0} players
              </span>
              <span className="text-xs text-gray-400">
                {team.record?.wins || 0}W - {team.record?.losses || 0}L
              </span>
            </div>
          </div>

          {/* Captain Avatar */}
          {team.captain?.profileImage ? (
            <Image
              src={team.captain.profileImage}
              alt={team.captain.fullName || team.captain.username || "Captain"}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
              {(team.captain?.fullName?.[0] || team.captain?.username?.[0] || "?").toUpperCase()}
            </div>
          )}

          <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
        </div>

        <Dialog
          open={selectedTeam?._id === team._id}
          onOpenChange={(open) => !open && setSelectedTeam(null)}
        >
          <DialogContent className="w-md max-h-[80vh] p-0 overflow-y-auto rounded-xl [&>button]:hidden">
            <DialogHeader className="gap-0">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#667eea]">
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeftCircle className="size-6 text-white" />
                </button>
                <DialogTitle className="text-white font-semibold text-base flex-1 text-center">
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
                          className="size-8 hover:bg-white/10 text-white"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-white/10 text-white hover:text-red-300"
                        onClick={() => deleteTeam(team._id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Info */}
              <div className="bg-gradient-to-b from-[#667eea] to-[#5a6fd6] px-4 pb-5 pt-2">
                <div className="flex flex-col items-center">
                  <Image
                    src={team.logo || "/imgs/logo.png"}
                    alt={team.name}
                    width={72}
                    height={72}
                    className="w-18 h-18 rounded-full object-cover border-3 border-white/20"
                  />
                  <h2 className="text-white font-bold text-xl mt-2">{team.name}</h2>
                  {team.city && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="size-3.5 text-white/60" />
                      <span className="text-white/80 text-sm">{team.city}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
                    <p className="text-lg text-white font-bold">
                      {team.players?.length || 0}
                    </p>
                    <p className="text-[10px] text-white/70 uppercase tracking-wide">Players</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
                    <p className="text-lg text-white font-bold">
                      {(team.record?.wins || 0) + (team.record?.losses || 0)}
                    </p>
                    <p className="text-[10px] text-white/70 uppercase tracking-wide">Matches</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
                    <p className="text-lg text-green-300 font-bold">
                      {team.record?.wins || 0}
                    </p>
                    <p className="text-[10px] text-white/70 uppercase tracking-wide">Wins</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
                    <p className="text-lg text-red-300 font-bold">
                      {team.record?.losses || 0}
                    </p>
                    <p className="text-[10px] text-white/70 uppercase tracking-wide">Losses</p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Players */}
            <div className="p-4 bg-[#F8F9FA]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
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
                      className="text-xs text-[#667eea] hover:text-[#5a6fd6] h-7 px-2"
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
                        className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {p.user.profileImage ? (
                            <Image
                              src={p.user.profileImage}
                              alt={p.user.fullName || p.user.username}
                              width={36}
                              height={36}
                              className={`w-9 h-9 rounded-full object-cover ${isCaptain ? "ring-2 ring-yellow-400" : ""}`}
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#5a6fd6] flex items-center justify-center text-white font-semibold text-sm ${isCaptain ? "ring-2 ring-yellow-400" : ""}`}>
                              {(p.user.fullName?.[0] || p.user.username?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-sm text-gray-800">
                                {p.user.fullName || p.user.username}
                              </p>
                              {isCaptain && (
                                <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                  C
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              @{p.user.username}
                            </p>
                          </div>
                        </div>
                        {p.assignment && (
                          <span className="text-[10px] font-medium py-1 px-2 rounded-full bg-[#667eea]/10 text-[#667eea]">
                            {p.assignment}
                          </span>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
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
    <section>
      <div className="p-4 bg-[#6878E1] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <Button className="bg-white text-zinc-800 hover:bg-blue-400">
            <Link
              href="/teams/create"
              className="text-sm flex items-center gap-1"
            >
              <Plus
                strokeWidth={5}
                className="bg-[#6878E1] text-white p-1 rounded-full"
              />
              New Team
            </Link>
          </Button>
        </div>

        <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 border-2 bg-[#F7F8FE] text-sm rounded-full"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city!}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-white">
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

      <Tabs defaultValue="my-teams" onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full rounded-none p-0 max-w-md h-fit mx-auto"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <TabsTrigger className="p-2 rounded-none" value="my-teams">
            My Teams
          </TabsTrigger>
          <TabsTrigger className="p-2 rounded-none" value="all-teams">
            All Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-teams">
          {loading ? (
            <TeamListSkeleton />
          ) : filteredMyTeams.length ? (
            <>
              <div className="divide-y divide-gray-100">
                {filteredMyTeams.map((team) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
              {/* Intersection Observer Target */}
              <div ref={myTeamsObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more teams...</span>
                  </div>
                )}
                {!hasMore && teams.length > 0 && (
                  <p className="text-sm text-gray-500">No more teams to load</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {!user
                  ? "Please log in to see your teams."
                  : search || cityFilter !== "all"
                  ? "No teams found matching your filters."
                  : "You are not part of any teams yet."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-teams">
          {loading ? (
            <TeamListSkeleton />
          ) : filteredAllTeams.length ? (
            <>
              <div className="divide-y divide-gray-100">
                {filteredAllTeams.map((team) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
              {/* Intersection Observer Target */}
              <div ref={allTeamsObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more teams...</span>
                  </div>
                )}
                {!hasMore && teams.length > 0 && (
                  <p className="text-sm text-gray-500">No more teams to load</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No teams found.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
