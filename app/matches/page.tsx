"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  // team objects for team matches
  team1?: {
    name?: string;
    players?: TeamPlayer[];
  };
  team2?: {
    name?: string;
    players?: TeamPlayer[];
  };
  // finalScore might use different keys depending on schema version
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      // use GET to fetch matches (your API's GET route)
      const response = await axiosInstance.get("/matches");
      const data = response.data;
      setMatches(data.matches || []);
    } catch (err: any) {
      console.error("Error fetching matches:", err);
      setError(err?.message || "Failed to fetch matches");
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

  const getTypeLabel = (m?: Match) => {
    if (!m) return "";
    const map: Record<string, string> = {
      singles: "Singles",
      doubles: "Doubles",
      mixed_doubles: "Mixed Doubles",
      five_singles: "5 Singles",
      single_double_single: "Single-Double-Single (SDS)",
      extended_format: "Extended",
      three_singles: "3 Singles",
      custom: "Custom",
    };
    return map[m.matchType] ?? humanize(m.matchType);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <div className="text-red-600 font-medium">Failed to load matches</div>
          <div className="text-sm text-gray-600">{error}</div>
          <div>
            <Button onClick={fetchMatches}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first match to get started
            </p>
          </div>
          <Link href="/matches/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Match
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between mb-6">
        {/* Title + Stats */}
        <div>
          <h1 className="text-2xl font-bold">All Matches</h1>
          <p className="text-sm text-gray-500">
            Total Matches: 124 | Singles: 85 | Doubles: 39
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search player..."
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select className="border rounded-lg px-2 py-2 text-sm">
            <option>All Types</option>
            <option>Singles</option>
            <option>Doubles</option>
          </select>
          <select className="border rounded-lg px-2 py-2 text-sm">
            <option>All Status</option>
            <option>Completed</option>
            <option>Ongoing</option>
          </select>
        </div>
      </header>

      {/* Matches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => {
          const leftLabel =
            match.matchCategory === "individual"
              ? match.participants?.[0]?.fullName ||
                match.participants?.[0]?.username ||
                "Player 1"
              : match.team1?.name ?? "Team 1";

          const rightLabel =
            match.matchCategory === "individual"
              ? match.participants?.[1]?.fullName ||
                match.participants?.[1]?.username ||
                "Player 2"
              : match.team2?.name ?? "Team 2";

          // support both finalScore shapes
          const side1Sets =
            match.finalScore?.player1Sets ?? match.finalScore?.side1Sets ?? 0;
          const side2Sets =
            match.finalScore?.player2Sets ?? match.finalScore?.side2Sets ?? 0;

            console.log("Left Label:", leftLabel);
            console.log("Side 1 Sets:", side1Sets);

          return (
            <Card key={match._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {leftLabel} vs {rightLabel}
                  </CardTitle>
                  <Badge
                    className={`${getStatusColor(match.status)} text-white`}
                  >
                    {match.status ?? "unknown"}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(match.createdAt)}
                  </div>
                  <div>{match.city ?? "-"}</div>
                  <div className="capitalize">{getTypeLabel(match)}</div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Score Display */}
                <div className="flex justify-center items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {side1Sets}
                    </div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                  <div className="text-xl text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {side2Sets}
                    </div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center">
                  {(match.status === "scheduled" ||
                    match.status === "in_progress") && (
                    <Link href={`/matches/${match._id}/score`}>
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        {match.status === "scheduled" ? "Start" : "Continue"}
                      </Button>
                    </Link>
                  )}

                  <Link href={`/matches/${match._id}/stats`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Stats
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
