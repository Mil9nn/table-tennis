"use client";

import React, { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import Link from "next/link";
import {
  Search,
  Trophy,
  TrendingUp,
  Award,
  Timer,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndividualMatch } from "@/types/match.type";
import { Button } from "@/components/ui/button";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";

interface TournamentGroup {
  tournament: {
    _id: string;
    name: string;
    format: string;
    status: string;
  };
  matches: IndividualMatch[];
  completedCount: number;
  totalCount: number;
  winner: { name: string; profileImage?: string } | null;
}

export default function TournamentMatchesPage() {
  const [matches, setMatches] = useState<IndividualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/matches/individual?context=tournament"
        );
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching tournament matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const searchLower = search.trim().toLowerCase();
      if (!searchLower && filterType === "all" && filterStatus === "all")
        return true;

      const playerMatch = match.participants?.some((p) =>
        p?.fullName?.toLowerCase().includes(searchLower)
      );
      const tournamentMatch = match.tournament?.name
        ?.toLowerCase()
        .includes(searchLower);
      const nameMatch = !searchLower || playerMatch || tournamentMatch;
      const typeMatch = filterType === "all" || match.matchType === filterType;
      const statusMatch =
        filterStatus === "all" || match.status === filterStatus;

      return nameMatch && typeMatch && statusMatch;
    });
  }, [matches, search, filterType, filterStatus]);

  const tournamentGroups: TournamentGroup[] = useMemo(() => {
    const grouped: Record<string, TournamentGroup> = {};

    filteredMatches.forEach((match) => {
      const tournamentId = match.tournament?._id || "unknown";

      if (!grouped[tournamentId]) {
        grouped[tournamentId] = {
          tournament: match.tournament || {
            _id: "",
            name: "Tournament",
            format: "",
            status: "",
          },
          matches: [],
          completedCount: 0,
          totalCount: 0,
          winner: null,
        };
      }

      grouped[tournamentId].matches.push(match);
      grouped[tournamentId].totalCount++;
      if (match.status === "completed") grouped[tournamentId].completedCount++;
    });

    const statusPriority: Record<string, number> = {
      in_progress: 0,
      upcoming: 1,
      draft: 2,
      scheduled: 2,
      completed: 3,
      cancelled: 4,
    };

    return Object.values(grouped).sort((a, b) => {
      return (
        (statusPriority[a.tournament.status] ?? 5) -
        (statusPriority[b.tournament.status] ?? 5)
      );
    });
  }, [filteredMatches]);

  const getTournamentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Award className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "upcoming":
        return <Timer className="w-5 h-5 text-orange-500" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTournamentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-100";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "upcoming":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "draft":
        return "bg-gray-50 text-gray-700 border-gray-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-[#6878E1] p-4 space-y-4">
        <div>
          <div>
            <div className="w-full flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-2xl font-bold text-white">Tournaments</h1>
              <Button className="bg-white text-zinc-800 hover:bg-blue-400">
                <Link
                  href="/tournaments/create"
                  className="text-sm flex items-center gap-1"
                >
                  <Plus
                    strokeWidth={5}
                    className="bg-[#6878E1] text-white p-1 rounded-full"
                  />
                  New Tournament
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-70">
            <Search className="absolute left-4 top-2.5 size-4" />
            <Input
              placeholder="Search tournament or player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-2 bg-[#F7F8FE] text-sm rounded-full"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-white h-11 text-sm rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
                <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-11 bg-white text-sm rounded-lg">
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
      </header>

      {/* Content */}
      {loading ? (
        <TournamentsSkeleton />
      ) : tournamentGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-100">
          <h3 className="text-lg font-medium text-slate-800 mb-1">
            No Tournament Matches
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            There are no tournament matches to display right now.
          </p>
        </div>
      ) : (
        <div className="">
          {tournamentGroups.map((group) => {
            const completedPct = group.totalCount
              ? Math.round((group.completedCount / group.totalCount) * 100)
              : 0;

            return (
              <article
                key={group.tournament._id}
                className="bg-white border border-gray-100 shadow-sm overflow-hidden"
              >
                <header>
                  <button className="w-full p-4 flex items-center gap-4 justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                        {getTournamentStatusIcon(group.tournament.status)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {group.tournament.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {group.tournament.format?.replace(/_/g, " ") || "—"}
                        </p>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 ml-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getTournamentStatusBadge(
                            group.tournament.status
                          )}`}
                        >
                          {group.tournament.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs bg-gray-50 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {group.totalCount} matches
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end text-right mr-2 md:flex">
                        <span className="text-xs text-slate-500">
                          {group.completedCount} / {group.totalCount}
                        </span>
                        <span className="text-xs text-slate-400">
                          completed
                        </span>
                      </div>

                      <div className="hidden md:block w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${completedPct}%` }}
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
                        />
                      </div>

                      <Link
                        href={`/tournaments/${group.tournament._id}`}
                        className="
                          relative
                          p-2 rounded-full bg-white border border-gray-100 shadow-sm
                          cursor-pointer
                          inline-flex items-center justify-center
                          transition-all
                          hover:bg-slate-100
                          active:scale-95
                          overflow-visible
                        "
                      >
                        {/* Ring pulse on click */}
                        <span
                          className="
                            absolute inset-0 rounded-full
                            ring-0 ring-blue-400
                            transition-all duration-300
                            active:ring-4 active:opacity-30
                          "
                        />
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </button>
                </header>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
