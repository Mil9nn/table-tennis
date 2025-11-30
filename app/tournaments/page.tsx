"use client";

import React, { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import Link from "next/link";
import {
  Search,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Plus,
  ChevronRight,
  Award,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDateShort } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category: string;
  matchType: string;
  startDate: string;
  endDate?: string;
  status: string;
  city: string;
  venue?: string;
  participants: any[];
  organizer: any;
  maxParticipants?: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data } = await axiosInstance.get("/tournaments");
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((tournament) => {
    const searchLower = search.trim().toLowerCase();
    const nameMatch =
      !searchLower ||
      tournament.name.toLowerCase().includes(searchLower) ||
      tournament.city.toLowerCase().includes(searchLower);
    const statusMatch =
      filterStatus === "all" || tournament.status === filterStatus;
    const formatMatch =
      filterFormat === "all" || tournament.format === filterFormat;

    return nameMatch && statusMatch && formatMatch;
  });

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
          <div className="w-full flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-white">All Tournaments</h1>
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

        {/* Filters */}
        <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-70">
            <Search className="absolute left-4 top-2.5 size-4" />
            <Input
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-2 bg-[#F7F8FE] text-sm rounded-full"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-40 bg-white h-11 text-sm rounded-lg">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="knockout">Knockout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-11 bg-white text-sm rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-100">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-100">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">
              No Tournaments Found
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {search || filterStatus !== "all" || filterFormat !== "all"
                ? "Try adjusting your filters"
                : "Create your first tournament to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament._id}
                className="bg-white border border-gray-100 hover:border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <Link
                  href={`/tournaments/${tournament._id}`}
                  className="flex items-center justify-between w-full gap-4"
                >
                  {/* LEFT SECTION */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                        {tournament.name}
                      </h3>
                      {/* Status Badges */}
                      <div className="flex items-end gap-1 shrink-0">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium border ${getTournamentStatusBadge(
                            tournament.status
                          )}`}
                        >
                          {tournament.status.replace(/_/g, " ")}
                        </span>

                        <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-100">
                          {tournament.format.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* INLINE ROW */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-600 flex-wrap">
                      <span>{formatDateShort(tournament.startDate)}</span>
                      <span className="text-slate-400">•</span>
                      <span>{tournament.city}</span>
                      <span className="text-slate-400">•</span>
                      <span>
                        {tournament.participants.length}
                        {tournament.maxParticipants &&
                          ` / ${tournament.maxParticipants}`}{" "}
                        players
                      </span>
                    </div>
                  </div>

                  {/* ARROW */}
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
