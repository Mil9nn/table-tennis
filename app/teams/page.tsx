"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trophy, Edit2, Trash, Search } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { useAuthStore } from "@/hooks/useAuthStore";

type Team = {
  _id: string;
  name: string;
  city?: string;
  record?: { wins: number; losses: number };
  captain?: { _id: string; username: string; fullName?: string };
  players: {
    user: { _id: string; username: string; fullName?: string };
    assignment?: string;
  }[];
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  
  const user = useAuthStore((state) => state.user);

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get("/teams");
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axiosInstance.delete(`/teams/${id}`);
      toast.success("Team deleted");
      fetchTeams();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete team");
    }
  };

  // Filter: My Teams (where user is captain or player)
  const myTeams = useMemo(() => {
    if (!user) return [];
    
    return teams.filter((team) => {
      const isCaptain = team.captain?._id === user._id;
      const isPlayer = team.players.some((p) => p.user._id === user._id);
      return isCaptain || isPlayer;
    });
  }, [teams, user]);

  // Apply search, city filter, and sort to a list
  const applyFilters = (teamList: Team[]) => {
    let filtered = teamList;

    // Search
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

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((t) => t.city === cityFilter);
    }

    // Sort
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

  const filteredMyTeams = useMemo(() => applyFilters(myTeams), [myTeams, search, cityFilter, sortBy]);
  const filteredAllTeams = useMemo(() => applyFilters(teams), [teams, search, cityFilter, sortBy]);

  const cities = Array.from(new Set(teams.map((t) => t.city).filter(Boolean)));

  // Team Card Component (reusable)
  const TeamCard = ({ team }: { team: Team }) => (
    <Card className="border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-medium">{team.name}</CardTitle>
        <div className="flex gap-1">
          <Link href={`/teams/${team._id}/edit`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit2 className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-red-600"
            onClick={() => deleteTeam(team._id)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Captain</span>
          <span className="text-foreground font-medium">
            {team.captain?.fullName || team.captain?.username || "-"}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Players</span>
          <span className="text-foreground font-medium">
            {team.players?.length || 0}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Record</span>
          <span className="text-foreground font-medium">
            {team.record ? `${team.record.wins}W - ${team.record.losses}L` : "0W - 0L"}
          </span>
        </div>

        <div className="border-t pt-2 space-y-1 max-h-18 overflow-y-auto">
          {team.players.length ? (
            team.players.map((p) => (
              <div
                key={p.user._id}
                className="flex justify-between text-xs items-center"
              >
                <span className="truncate text-muted-foreground">
                  {p.user.fullName || p.user.username}
                </span>
                {p.assignment && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {p.assignment}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No players yet</p>
          )}
        </div>

        <div className="pt-2 flex gap-2">
          <Link href={`/teams/${team._id}/assign`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Assign
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="flex-1">
            <Trophy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Teams</h1>
        <Link href="/teams/create">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New Team
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-teams" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <TabsTrigger value="my-teams">My Teams</TabsTrigger>
          <TabsTrigger value="all-teams">All Teams</TabsTrigger>
        </TabsList>

        {/* Search and Filters (shared) */}
        <div className="space-y-3 mb-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by team, captain, or player..."
              className="pl-8 rounded-full border-2 border-black/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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

        {/* My Teams Tab */}
        <TabsContent value="my-teams">
          {loading ? (
            <TeamListSkeleton />
          ) : filteredMyTeams.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMyTeams.map((team) => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground italic">
                {!user
                  ? "Please log in to see your teams."
                  : search || cityFilter !== "all"
                  ? "No teams found matching your filters."
                  : "You are not part of any teams yet."}
              </p>
              {user && !search && cityFilter === "all" && (
                <Link href="/teams/create">
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Create Your First Team
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        {/* All Teams Tab */}
        <TabsContent value="all-teams">
          {loading ? (
            <TeamListSkeleton />
          ) : filteredAllTeams.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAllTeams.map((team) => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center italic py-12">
              No teams found.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}