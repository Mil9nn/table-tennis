"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import MatchesList from "@/components/MatchesList";
import TeamMatchesList from "@/components/TeamMatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Plus, Search, Loader2 } from "lucide-react";
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
// removed shadcn button for native link-button styling

const ITEMS_PER_PAGE = 15;

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState("individual");

  // Individual - with pagination
  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>(
    []
  );
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualLoadingMore, setIndividualLoadingMore] = useState(false);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [individualPage, setIndividualPage] = useState(0);
  const [individualSearch, setIndividualSearch] = useState("");
  const [individualFilterType, setIndividualFilterType] = useState("all");
  const [individualFilterStatus, setIndividualFilterStatus] = useState("all");

  // Team - with pagination
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamLoadingMore, setTeamLoadingMore] = useState(false);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [teamPage, setTeamPage] = useState(0);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilterFormat, setTeamFilterFormat] = useState("all");
  const [teamFilterStatus, setTeamFilterStatus] = useState("all");

  // Intersection Observer refs
  const individualObserverTarget = useRef<HTMLDivElement>(null);
  const teamObserverTarget = useRef<HTMLDivElement>(null);

  // Fetch individual matches with pagination
  const fetchIndividualMatches = useCallback(async (page: number, append = false) => {
    try {
      if (append) {
        setIndividualLoadingMore(true);
      } else {
        setIndividualLoading(true);
      }

      const skip = page * ITEMS_PER_PAGE;
      const { data } = await axiosInstance.get(
        `/matches/individual?limit=${ITEMS_PER_PAGE}&skip=${skip}`
      );

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
  }, []);

  // Fetch team matches with pagination
  const fetchTeamMatches = useCallback(async (page: number, append = false) => {
    try {
      if (append) {
        setTeamLoadingMore(true);
      } else {
        setTeamLoading(true);
      }

      const skip = page * ITEMS_PER_PAGE;
      const { data } = await axiosInstance.get(
        `/matches/team?limit=${ITEMS_PER_PAGE}&skip=${skip}`
      );

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
  }, []);

  // Fetch individual matches only when individual tab is active
  useEffect(() => {
    if (activeTab === "individual" && individualMatches.length === 0) {
      fetchIndividualMatches(0, false);
    }
  }, [activeTab, fetchIndividualMatches, individualMatches.length]);

  // Fetch team matches only when team tab is active
  useEffect(() => {
    if (activeTab === "team" && teamMatches.length === 0) {
      fetchTeamMatches(0, false);
    }
  }, [activeTab, fetchTeamMatches, teamMatches.length]);

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

  const filteredIndividualMatches = useMemo(() => {
    return individualMatches.filter((match) => {
      const nameMatch = match.participants?.some((p) =>
        p?.fullName?.toLowerCase().includes(individualSearch.toLowerCase())
      );
      const typeMatch =
        individualFilterType === "all" ||
        match.matchType === individualFilterType;
      const statusMatch =
        individualFilterStatus === "all" ||
        match.status === individualFilterStatus;
      return nameMatch && typeMatch && statusMatch;
    });
  }, [individualMatches, individualSearch, individualFilterType, individualFilterStatus]);

  const filteredTeamMatches = useMemo(() => {
    return teamMatches.filter((match) => {
      const nameMatch =
        match.team1?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
        match.team2?.name?.toLowerCase().includes(teamSearch.toLowerCase());

      const formatMatch =
        teamFilterFormat === "all" || match.matchFormat === teamFilterFormat;

      const statusMatch =
        teamFilterStatus === "all" || match.status === teamFilterStatus;

      return nameMatch && formatMatch && statusMatch;
    });
  }, [teamMatches, teamSearch, teamFilterFormat, teamFilterStatus]);


  return (
    <div>
      {/* HEADER AREA — same as before */}
      <div className="p-4 bg-white border-b space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold tracking-tight text-neutral-900">Matches</h1>

          <Button asChild className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition">
            <Link href="/match/create">
              <Plus className="w-4 h-4" />
              New Match
            </Link>
          </Button>
        </div>

        {/* Filters */}
        {activeTab === "individual" && (
          <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
              <Input
                placeholder="Search by player name..."
                value={individualSearch}
                onChange={(e) => setIndividualSearch(e.target.value)}
                className="pl-8 bg-white h-10 text-sm rounded-full"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Select value={individualFilterType} onValueChange={setIndividualFilterType}>
                <SelectTrigger className="w-40 bg-white h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="singles">Singles</SelectItem>
                  <SelectItem value="doubles">Doubles</SelectItem>
                  <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                </SelectContent>
              </Select>

              <Select value={individualFilterStatus} onValueChange={setIndividualFilterStatus}>
                <SelectTrigger className="w-40 bg-white h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
              <Input
                placeholder="Search by team name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-8 bg-white h-10 text-sm rounded-full"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Select value={teamFilterFormat} onValueChange={setTeamFilterFormat}>
                <SelectTrigger className="w-48 bg-white h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="five_singles">Swaythling (5 Singles)</SelectItem>
                  <SelectItem value="single_double_single">Single-Double-Single</SelectItem>
                </SelectContent>
              </Select>

              <Select value={teamFilterStatus} onValueChange={setTeamFilterStatus}>
                <SelectTrigger className="w-40 bg-white h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="individual" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto h-fit rounded-none p-0" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <TabsTrigger className="p-2 rounded-none" value="individual">
            Individual Matches
          </TabsTrigger>
          <TabsTrigger className="p-2 rounded-none" value="team">
            Team Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          {individualLoading ? (
            <MatchesListSkeleton />
          ) : (
            <>
              <MatchesList matches={filteredIndividualMatches} />

              {/* Intersection Observer Target */}
              <div ref={individualObserverTarget} className="h-20 flex items-center justify-center">
                {individualLoadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more matches...</span>
                  </div>
                )}
                {!individualHasMore && individualMatches.length > 0 && (
                  <p className="text-sm text-gray-500">No more matches to load</p>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {teamLoading ? (
            <TeamMatchesListSkeleton />
          ) : (
            <>
              {filteredTeamMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <GroupsIcon 
                      sx={{ fontSize: 48, color: '#9ca3af' }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Team Matches Found
                  </h3>
                  <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                    {teamMatches.length === 0
                      ? "Get started by creating your first team match."
                      : "No matches match your current filters."}
                  </p>
                </div>
              ) : (
                <>
                  <TeamMatchesList matches={filteredTeamMatches} />

                  {/* Intersection Observer Target */}
                  <div ref={teamObserverTarget} className="h-20 flex items-center justify-center">
                    {teamLoadingMore && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm">Loading more matches...</span>
                      </div>
                    )}
                    {!teamHasMore && teamMatches.length > 0 && (
                      <p className="text-sm text-gray-500">No more matches to load</p>
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
