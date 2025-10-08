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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trophy, Loader2, Edit2, Trash, Search } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";

type Team = {
  _id: string;
  name: string;
  city?: string;
  record?: { wins: number; losses: number };
  captain?: { username: string; fullName?: string };
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

  // Filter + Sort logic (memoized for performance)
  const filteredTeams = useMemo(() => {
    let filtered = teams;

    // Filter by search
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

    // Filter by city
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
  }, [teams, search, cityFilter, sortBy]);

  const cities = Array.from(new Set(teams.map((t) => t.city).filter(Boolean)));

  return (
    <div className="p-4 space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Teams</h1>
        <Link href="/teams/create">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New Team
          </Button>
        </Link>
      </div>

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

      {loading ? <TeamListSkeleton /> : <div>
        {filteredTeams.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTeams.map((t) => (
              <Card
                key={t._id}
                className="border rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-2 flex flex-row justify-between items-center">
                  <CardTitle className="text-base font-medium">
                    {t.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Link href={`/teams/${t._id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-red-600"
                      onClick={() => deleteTeam(t._id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Captain</span>
                    <span className="text-foreground font-medium">
                      {t.captain?.fullName || t.captain?.username || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Players</span>
                    <span className="text-foreground font-medium">
                      {t.players?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Record</span>
                    <span className="text-foreground font-medium">
                      {t.record
                        ? `${t.record.wins}W - ${t.record.losses}L`
                        : "0W - 0L"}
                    </span>
                  </div>

                  <div className="border-t pt-2 space-y-1 max-h-18 overflow-y-auto">
                    {t.players.length ? (
                      t.players.map((p) => (
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
                      <p className="text-xs text-muted-foreground italic">
                        No players yet
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Link href={`/teams/${t._id}/assign`} className="flex-1">
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
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center italic">
            No teams found.
          </p>
        )}
      </div>}
    </div>
  );
}
