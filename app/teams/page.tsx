"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trophy, Edit2, Trash, Search, Users, MapPin } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isAxiosError } from "axios";

type Team = {
  _id: string;
  name: string;
  city?: string;
  record?: { wins: number; losses: number };
  captain?: { _id: string; username: string; fullName?: string; profileImage?: string };
  players: {
    user: { _id: string; username: string; fullName?: string; profileImage?: string };
    assignment?: string;
  }[];
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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
    } catch (err: unknown) {
      console.error("Delete failed", err);
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete team");
      }
    }
  };

  const myTeams = useMemo(() => {
    if (!user) return [];
    return teams.filter((team) => {
      const isCaptain = team.captain?._id === user._id;
      const isPlayer = team.players.some((p) => p.user._id === user._id);
      return isCaptain || isPlayer;
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
        <Card 
          className="border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => setSelectedTeam(team)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                {team.city && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{team.city}</span>
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/teams/${team._id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-600"
                    onClick={() => deleteTeam(team._id)}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Players</span>
              </div>
              <span className="font-medium">{team.players?.length || 0}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Record</span>
              </div>
              <span className="font-medium">
                {team.record
                  ? `${team.record.wins}W - ${team.record.losses}L`
                  : "0W - 0L"}
              </span>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Captain</p>
              <p className="text-sm font-medium">
                {team.captain?.fullName || team.captain?.username || "-"}
              </p>
            </div>

            {isOwner && (
              <div className="pt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Link href={`/teams/${team._id}/assign`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Assign Positions
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={selectedTeam?._id === team._id} onOpenChange={(open) => !open && setSelectedTeam(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{team.name}</DialogTitle>
              {team.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{team.city}</span>
                </div>
              )}
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">
                    {team.players?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">
                    {team.record
                      ? `${team.record.wins}-${team.record.losses}`
                      : "0-0"}
                  </p>
                  <p className="text-sm text-muted-foreground">W-L Record</p>
                </div>
              </div>

              {/* Captain */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Team Captain</h3>
                <Link 
                  href={`/profile/${team.captain?._id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  {team.captain?.profileImage ? (
                    <Image
                      src={team.captain.profileImage}
                      alt={team.captain.fullName || team.captain.username}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {(team.captain?.fullName?.[0] || team.captain?.username?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {team.captain?.fullName || team.captain?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{team.captain?.username}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Players */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Team Roster</h3>
                <div className="space-y-2">
                  {team.players.length > 0 ? (
                    team.players.map((p) => (
                      <Link
                        key={p.user._id}
                        href={`/profile/${p.user._id}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {p.user.profileImage ? (
                            <Image
                              src={p.user.profileImage}
                              alt={p.user.fullName || p.user.username}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                              {(p.user.fullName?.[0] || p.user.username?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {p.user.fullName || p.user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{p.user.username}
                            </p>
                          </div>
                        </div>
                        {p.assignment && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            {p.assignment}
                          </span>
                        )}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No players yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
        <Button variant="default">
          <Link href="/teams/create" className="text-sm hover:underline flex items-center gap-1">
            <Plus strokeWidth={3} />
            New Team
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="my-teams" className="w-full">
        <TabsList
          className="grid w-full max-w-md h-fit mx-auto mb-6"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <TabsTrigger className="p-2" value="my-teams">My Teams</TabsTrigger>
          <TabsTrigger className="p-2" value="all-teams">All Teams</TabsTrigger>
        </TabsList>

        <div className="space-y-3 mb-6">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 border-2 border-gray-500 text-sm rounded-full"
            />
          </div>

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