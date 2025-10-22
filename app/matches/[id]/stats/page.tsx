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
  PieChart,
  Pie,
} from "recharts";
import Link from "next/link";
import { Shot } from "@/types/shot.type";
import { axiosInstance } from "@/lib/axiosInstance";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";

interface PlayerStatsData {
  name: string;
  strokes: Record<string, number>;
}

// --- Shared colors ---
const COLORS = {
  winners: "#10B981",
  errors: "#EF4444",
  serve: "#4ADE80",
  receive: "#60A5FA",
  strokes: [
    "#F59E0B",
    "#8B5CF6",
    "#14B8A6",
    "#6366F1",
    "#EC4899",
    "#10B981",
    "#EF4444",
    "#3B82F6",
  ],
};

// --- Compute stats from shots ---
function computeStats(shots: Shot[]) {
  const shotTypes: Record<string, number> = {};

  (shots || []).forEach((s) => {
    if (!s) return;
    if (s.stroke) {
      shotTypes[s.stroke] = (shotTypes[s.stroke] || 0) + 1;
    }
  });

  return { shotTypes };
}

function computePlayerStats(shots: Shot[]): Record<string, PlayerStatsData> {
  const playerStats: Record<string, PlayerStatsData> = {};

  (shots || []).forEach((s) => {
    if (!s || !s.player) return;

    const playerId = s.player._id || s.player.toString();
    const playerName = s.player.fullName || s.player.username || "Unknown";

    if (!playerStats[playerId]) {
      playerStats[playerId] = {
        name: playerName,
        strokes: {},
      };
    }

    if (s.stroke) {
      playerStats[playerId].strokes[s.stroke] =
        (playerStats[playerId].strokes[s.stroke] || 0) + 1;
    }
  });

  return playerStats;
}


function computeServeStats(games: any[]) {
  const serveStats: Record<
    string,
    { servePoints: number; receivePoints: number; totalServes: number }
  > = {};

  (games || []).forEach((g) => {
    (g.shots || []).forEach((shot: any) => {
      const winnerId = shot.player?.toString();
      const serverId = shot.server?.toString();
      if (!winnerId || !serverId) return;

      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }
      serveStats[serverId].totalServes += 1;

      if (winnerId === serverId) {
        serveStats[serverId].servePoints += 1;
      } else {
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

// Custom label for pie chart
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  if (percent < 0.05) return null; // Don't show label for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Format stroke names for display
const formatStrokeName = (stroke: string) => {
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [loading, setLoading] = useState(true);

  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  useEffect(() => {
    if (!matchId) return;
    const category = match?.matchCategory;
    fetchMatch(matchId, category!);
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
    side2Name = match.team2?.name || "Team 2";
  } else {
    side2Name = "Unknown";
  }

  // --- Match-level stats ---
  let shots: Shot[] = [];
  let serveData: { player: string; Serve: number; Receive: number }[] = [];
  let shotTypes: Record<string, number> = {};
  let playerStats: Record<string, PlayerStatsData> = {};

  if (isIndividualMatch(match)) {
    const allGames = match.games || [];
    shots = allGames.flatMap((g) => g.shots || []);

    ({ shotTypes } = computeStats(shots));
    playerStats = computePlayerStats(shots);

    const serveStats = computeServeStats(allGames);
    serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = match.participants?.find(
        (p) => p._id.toString() === playerId
      );
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });
  } else if (isTeamMatch(match)) {
    const subMatches = match.subMatches || [];
    const allGames = subMatches.flatMap((sm) => sm.games || []);
    shots = allGames.flatMap((g) => g.shots || []);

    ({ shotTypes } = computeStats(shots));
    playerStats = computePlayerStats(shots);

    const serveStats = computeServeStats(allGames);
    serveData = Object.entries(serveStats).map(([teamKey, s]) => {
      const team =
        teamKey === "team1"
          ? match.team1
          : teamKey === "team2"
          ? match.team2
          : null;
      return {
        player: team?.name || "Unknown Team",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });
  }

  // Shot Distribution (overall)
  const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
    name: formatStrokeName(type),
    value,
  }));

  // Prepare pie chart data for each player
  const playerPieData = Object.entries(playerStats).map(([playerId, stats]) => {
    const pieData = Object.entries(stats.strokes).map(([stroke, count]) => ({
      name: formatStrokeName(stroke),
      value: count
    }));
    return {
      playerId,
      playerName: stats.name,
      data: pieData,
    };
  });

  return (
    <div className="p-4 space-y-10 mx-auto">
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
          <h3 className="text-lg font-semibold text-indigo-500">
            {side1Name} vs {side2Name}
          </h3>
          {isIndividualMatch(match) && (
            <p className="text-gray-500 text-sm">
              Games:{" "}
              {match.games
                ?.map(
                  (g: any, i: number) =>
                    `G${i + 1}: ${g.side1Score}-${g.side2Score}`
                )
                .join(" | ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Serve vs Receive */}
        <Card>
          <CardHeader>
            <CardTitle>Serve vs Receive Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
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
            </div>
          </CardContent>
        </Card>

        {/* Overall Shot Distribution */}
        {strokeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Shot Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Player-Specific Shot Distribution (Pie Charts) */}
      {playerPieData.length > 0 && (
        <>
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">
              Individual Player Statistics
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {playerPieData.map((player, idx) => (
              <section
                key={player.playerId}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition"
              >
                <header className=" px-4 py-3">
                  <h2 className="text-lg font-semibold text-indigo-900">
                    {player.playerName}'s shot distribution
                  </h2>
                </header>

                <div className="h-96 p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={player.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {player.data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS.strokes[index % COLORS.strokes.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
