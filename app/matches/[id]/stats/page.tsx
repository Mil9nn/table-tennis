"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import Link from "next/link";
import { Shot } from "@/types/shot.type";
import { axiosInstance } from "@/lib/axiosInstance";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";

// --- Shared colors ---
const COLORS = {
  winners: "#10B981",
  errors: "#EF4444",
  serve: "#4ADE80",
  receive: "#60A5FA",
  strokes: ["#F59E0B", "#8B5CF6", "#14B8A6", "#6366F1", "#EC4899"],
};

// --- Compute stats from shots ---
function computeStats(shots: Shot[]) {
  const winners = { side1: 0, side2: 0 };
  const errors = { side1: 0, side2: 0 };
  const errorBreakdown = { net: 0, long: 0, serve: 0 };
  const shotTypes: Record<string, number> = {};

  (shots || []).forEach((s) => {
    if (!s) return;
    const side = s.side;

    if (s.outcome === "winner") winners[side]++;
    else if (s.outcome === "error") {
      errors[side]++;
      if (s.errorType) errorBreakdown[s.errorType]++;
    }

    if (s.stroke) {
      shotTypes[s.stroke] = (shotTypes[s.stroke] || 0) + 1;
    }
  });

  return { winners, errors, errorBreakdown, shotTypes };
}

function computeServeStats(games: any[]) {
  const serveStats: Record<
    string,
    { servePoints: number; receivePoints: number; totalServes: number }
  > = {};

  (games || []).forEach((g) => {
    (g.shots || []).forEach((shot: any, idx: number, arr: any[]) => {
      // rally ends when outcome is "winner" or "error"
      const isRallyEnd = shot.outcome === "winner" || shot.outcome === "error";
      if (!isRallyEnd) return;

      const winnerId = shot.player?.toString();
      const serverId = shot.server?.toString();
      if (!winnerId || !serverId) return;

      // initialize server
      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }
      serveStats[serverId].totalServes += 1;

      if (winnerId === serverId) {
        // point won on serve
        serveStats[serverId].servePoints += 1;
      } else {
        // point won on receive
        if (!serveStats[winnerId]) {
          serveStats[winnerId] = {
            servePoints: 0,
            receivePoints: 0,
            totalServes: 0,
          };
        }
        serveStats[winnerId].receivePoints += 1;
      }
    });
  });

  return serveStats;
}

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [loading, setLoading] = useState(true);

  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  useEffect(() => {
    if (!matchId) return;
    const category = match?.matchCategory;
    fetchMatch(matchId, category);
  }, [matchId, fetchMatch]);

  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-4" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-8 text-center">Match not found</div>
    );
  }

  // --- Names ---
  const isSingles =
    match.matchCategory === "individual" && match.participants?.length === 2;
  const isDoubles =
    match.matchCategory === "individual" && match.participants?.length === 4;

  let side1Name: string;

  if (isIndividualMatch(match)) {
    side1Name = isSingles
      ? match.participants?.[0]?.fullName ||
        match.participants?.[0]?.username ||
        "Player 1"
      : isDoubles
      ? "Side 1"
      : "Player 1";
  } else {
    side1Name = match.team1?.name || "Team 1";
  }

  let side2Name: string;

  if (isIndividualMatch(match)) {
    const side2 = match.participants?.[1]?.fullName || "Player 2";
    side2Name = isSingles ? side2 : isDoubles ? "Side 2" : "Player 2";
  } else if (isTeamMatch(match)) {
    // ✅ Now TypeScript knows it's a TeamMatch
    side2Name = match.team2?.name || "Team 2";
  } else {
    side2Name = "Unknown";
  }

  // --- Match-level stats ---
  const shots = match.games?.flatMap((g: any) => g.shots || []) || [];
  const { winners, errors, shotTypes } = computeStats(shots);

  // ✅ Serve stats
  const serveStats = computeServeStats(match.games || []);
  const serveData = Object.entries(serveStats).map(([playerId, s]) => {
    const player = match.participants?.find(
      (p: any) => p._id.toString() === playerId
    );
    return {
      player: player?.fullName || player?.username || "Unknown",
      Serve: s.servePoints,
      Receive: s.receivePoints,
    };
  });

  // Winners vs Errors chart
  const winnerErrorData = [
    { name: side1Name, Winners: winners.side1, Errors: errors.side1 },
    { name: side2Name, Winners: winners.side2, Errors: errors.side2 },
  ];

  // Shot Distribution
  const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
    name: type,
    value,
  }));

  return (
    <div className="px-4 py-8 space-y-10 container mx-auto">
      {/* Go Back */}
      <Link
        href={`/matches/${matchId}`}
        className="flex items-center gap-2 text-sm shadow-sm hover:shadow-md w-fit rounded-full px-3 py-1 text-blue-800 transition-all"
      >
        <ArrowLeftCircle />
        <span className="font-semibold">Go back</span>
      </Link>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Match Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <h3 className="text-2xl font-bold text-indigo-600">
            {side1Name} vs {side2Name}
          </h3>
          <p className="text-gray-500 text-sm">
            Games:{" "}
            {match.games
              ?.map(
                (g: any, i: number) =>
                  `G${i + 1}: ${g.side1Score}-${g.side2Score}`
              )
              .join(" | ")}
          </p>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Key Match Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">
              {winners.side1 + winners.side2}
            </p>
            <p className="text-sm text-gray-500">Winners</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{errors.side1 + errors.side2}</p>
            <p className="text-sm text-gray-500">Errors</p>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Serve vs Receive */}
        <Card>
          <CardHeader>
            <CardTitle>Serve vs Receive Points</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serveData}>
                <XAxis dataKey="player" />
                <YAxis width={25} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Serve" fill={COLORS.serve} />
                <Bar dataKey="Receive" fill={COLORS.receive} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Winners vs Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Winners vs Errors</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winnerErrorData}>
                <XAxis dataKey="name" />
                <YAxis width={25} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Winners" fill={COLORS.winners} />
                <Bar dataKey="Errors" fill={COLORS.errors} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Shot Distribution */}
      {strokeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shot Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strokeData}>
                <XAxis dataKey="name" />
                <YAxis width={25} />
                <Tooltip />
                <Bar dataKey="value">
                  {strokeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS.strokes[i % COLORS.strokes.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
