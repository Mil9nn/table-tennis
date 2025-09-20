"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Play, BarChart3, Calendar } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

type TeamPlayer = { name: string; role?: string; id?: string };

type Participant = {
  _id: string;
  username: string;
  fullName?: string;
};

type Match = {
  _id: string;
  matchCategory: "individual" | "team";
  matchType: string;
  status?: string;
  createdAt?: string;
  city?: string;
  participants?: Participant[];
  team1?: { name?: string; players?: TeamPlayer[] };
  team2?: { name?: string; players?: TeamPlayer[] };
  finalScore?: {
    player1Sets?: number;
    player2Sets?: number;
    side1Sets?: number;
    side2Sets?: number;
  };
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  // In app/matches/page.tsx, replace the fetchMatches function:
const fetchMatches = async () => {
  try {
    const [individualRes, teamRes] = await Promise.all([
      axiosInstance.get("/api/matches/individual"),
      axiosInstance.get("/api/matches/team")
    ]);

    const individualMatches = (individualRes.data.matches || []).map((m: any) => ({
      ...m,
      matchCategory: "individual"
    }));

    const teamMatches = (teamRes.data.matches || []).map((m: any) => ({
      ...m,
      matchCategory: "team"
    }));

    const allMatches = [...individualMatches, ...teamMatches]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setMatches(allMatches);
  } catch (err) {
    console.error("Error fetching matches", err);
  } finally {
    setLoading(false);
  }
};

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const humanize = (s?: string) =>
    (s || "")
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const getTypeLabel = (m: Match) => {
    const map: Record<string, string> = {
      singles: "Singles",
      doubles: "Doubles",
      mixed_doubles: "Mixed Doubles",
      five_singles: "5 Singles",
      single_double_single: "SDS",
      extended_format: "Extended",
      three_singles: "3 Singles",
      custom: "Custom",
    };
    return map[m.matchType] ?? humanize(m.matchType);
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "-";

  if (loading) {
    return <div className="p-8 text-center">Loading matches...</div>;
  }

  return (
    <div className="py-8">
      {/* Header */}
      <header className="px-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">All Matches</h1>
          <Link href="/matches/create">
            <Button className="cursor-pointer gap-2">
              <Plus className="w-4 h-4" />
              Create Match
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500">Manage and track your matches</p>
      </header>

      {/* Table */}
      <div className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Date</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => {
              const left =
                m.matchCategory === "individual"
                  ? m.participants?.[0]?.fullName ||
                    m.participants?.[0]?.username ||
                    "Player 1"
                  : m.team1?.name ?? "Team 1";

              const right =
                m.matchCategory === "individual"
                  ? m.participants?.[1]?.fullName ||
                    m.participants?.[1]?.username ||
                    "Player 2"
                  : m.team2?.name ?? "Team 2";

                const side1Sets = m.finalScore?.side1Sets ?? 0;
                const side2Sets = m.finalScore?.side2Sets ?? 0;


              return (
                <TableRow key={m._id} className="hover:bg-gray-50">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(m.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {left} <span className="text-gray-400">vs</span> {right}
                  </TableCell>
                  <TableCell>{m.city ?? "-"}</TableCell>
                  <TableCell>{getTypeLabel(m)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(
                        m.status
                      )} text-white text-xs rounded-full`}
                    >
                      {humanize(m.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {side1Sets} - {side2Sets}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {(m.status === "scheduled" ||
                      m.status === "in_progress") && (
                      <Link href={`/matches/${m._id}/score`}>
                        <Button size="sm" className="gap-1">
                          <Play className="w-3 h-3" />
                          {m.status === "scheduled" ? "Start" : "Continue"}
                        </Button>
                      </Link>
                    )}
                    <Link href={`/matches/${m._id}/stats`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Stats
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
