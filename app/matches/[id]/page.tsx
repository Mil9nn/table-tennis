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

// const COLORS = {
//   serve: "#4ADE80",
//   receive: "#60A5FA",
//   strokes: [
//     "#F59E0B",
//     "#8B5CF6",
//     "#14B8A6",
//     "#6366F1",
//     "#EC4899",
//     "#10B981",
//     "#EF4444",
//     "#3B82F6",
//   ],
// };

const SHOT_TYPE_COLORS: Record<string, string> = {
  forehand_drive: "#F59E0B",
  backhand_drive: "#FBBF24",
  forehand_topspin: "#8B5CF6",
  backhand_topspin: "#A78BFA",
  forehand_loop: "#14B8A6",
  backhand_loop: "#2DD4BF",
  forehand_smash: "#EF4444",
  backhand_smash: "#F87171",
  forehand_push: "#6366F1",
  backhand_push: "#818CF8",
  forehand_chop: "#EC4899",
  backhand_chop: "#F472B6",
  forehand_flick: "#10B981",
  backhand_flick: "#34D399",
  forehand_block: "#3B82F6",
  backhand_block: "#60A5FA",
  forehand_drop: "#F97316",
  backhand_drop: "#FB923C",
};

const COLORS = {
  serve: "#4ADE80",
  receive: "#60A5FA",
};

// Helper function to get color for a shot type
const getShotColor = (strokeName: string): string => {
  const strokeKey = strokeName.toLowerCase().replace(/\s+/g, "_");
  return SHOT_TYPE_COLORS[strokeKey] || "#94A3B8";
};

// Compute stats from shots
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

// ✅ FIXED: Compute serve stats correctly for both individual and team matches
function computeServeStats(games: any[], matchCategory: string) {
  console.log("🔍 computeServeStats called with:", {
    gamesCount: games?.length,
    matchCategory,
    firstGame: games?.[0],
  });

  const serveStats: Record<
    string,
    { servePoints: number; receivePoints: number; totalServes: number }
  > = {};

  (games || []).forEach((g, gameIdx) => {
    console.log(`\n📊 Processing Game ${gameIdx + 1}:`, {
      shotsCount: g.shots?.length,
    });

    (g.shots || []).forEach((shot: any, shotIdx: number) => {
      console.log(`\n  🎯 Shot ${shotIdx + 1}:`, {
        rawShot: shot,
        player: shot.player,
        server: shot.server,
        playerType: typeof shot.player,
        serverType: typeof shot.server,
      });

      // The player who scored the point - try multiple ways to extract ID
      let pointWinnerId: string | null = null;
      if (typeof shot.player === 'string') {
        pointWinnerId = shot.player;
      } else if (shot.player?._id) {
        pointWinnerId = shot.player._id.toString();
      } else if (shot.player) {
        pointWinnerId = shot.player.toString();
      }

      // The player who was serving - try multiple ways to extract ID
      let serverId: string | null = null;
      if (typeof shot.server === 'string') {
        serverId = shot.server;
      } else if (shot.server?._id) {
        serverId = shot.server._id.toString();
      } else if (shot.server) {
        serverId = shot.server.toString();
      }

      console.log(`  📍 Extracted IDs:`, {
        pointWinnerId,
        serverId,
        bothExist: !!(pointWinnerId && serverId),
      });

      if (!pointWinnerId || !serverId) {
        console.log(`  ⚠️ Skipping shot - missing IDs`);
        return;
      }

      // Initialize stats for server
      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
        console.log(`  ✨ Created new stats for server: ${serverId}`);
      }

      // Initialize stats for point winner (they might be the receiver)
      if (!serveStats[pointWinnerId]) {
        serveStats[pointWinnerId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
        console.log(`  ✨ Created new stats for point winner: ${pointWinnerId}`);
      }

      // Count this as a serve
      serveStats[serverId].totalServes += 1;

      // Determine who won the point
      const isServerWinner = pointWinnerId === serverId;
      console.log(`  🏆 Point outcome:`, {
        isServerWinner,
        action: isServerWinner ? 'servePoints++' : 'receivePoints++',
      });

      if (isServerWinner) {
        // Server won the point
        serveStats[serverId].servePoints += 1;
      } else {
        // Receiver won the point
        serveStats[pointWinnerId].receivePoints += 1;
      }
    });
  });

  console.log("\n📈 Final serveStats:", serveStats);
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

  if (percent < 0.05) return null;

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

// Format stroke names
const formatStrokeName = (stroke: string) => {
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  useEffect(() => {
    if (!matchId) return;
    
    // Determine category from URL or default to individual
    const searchParams = new URLSearchParams(window.location.search);
    const category = (searchParams.get('category') as 'individual' | 'team') || 'individual';
    
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

  // Names
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

  // Match-level stats
  let shots: Shot[] = [];
  let serveData: { player: string; Serve: number; Receive: number }[] = [];
  let shotTypes: Record<string, number> = {};
  let playerStats: Record<string, PlayerStatsData> = {};

  // ✅ Get all participants for name lookup
  let allParticipants: any[] = [];

  if (isIndividualMatch(match)) {
    const allGames = match.games || [];
    shots = allGames.flatMap((g) => g.shots || []);
    allParticipants = match.participants || [];

    console.log("👥 Individual Match Participants:", {
      count: allParticipants.length,
      participants: allParticipants.map(p => ({
        id: p._id,
        name: p.fullName || p.username,
      })),
    });

    ({ shotTypes } = computeStats(shots));
    playerStats = computePlayerStats(shots);

    // ✅ Compute serve stats correctly
    const serveStats = computeServeStats(allGames, match.matchCategory);
    console.log("\n🎾 Mapping serve stats to player names:", {
      serveStatsKeys: Object.keys(serveStats),
      allParticipantIds: allParticipants.map(p => p._id.toString()),
    });

    serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find(
        (p) => p._id.toString() === playerId
      );
      
      console.log(`  🔗 Mapping ${playerId}:`, {
        found: !!player,
        playerName: player?.fullName || player?.username,
        stats: s,
      });

      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    console.log("\n📊 Final serveData for chart:", serveData);
  } else if (isTeamMatch(match)) {
    const subMatches = match.subMatches || [];
    const allGames = subMatches.flatMap((sm) => sm.games || []);
    shots = allGames.flatMap((g) => g.shots || []);

    // ✅ Get all participants from submatches
    allParticipants = [];
    subMatches.forEach((sm) => {
      if (sm.playerTeam1) allParticipants.push(sm.playerTeam1);
      if (sm.playerTeam2) allParticipants.push(sm.playerTeam2);
    });

    ({ shotTypes } = computeStats(shots));
    playerStats = computePlayerStats(shots);

    // ✅ Compute serve stats correctly for team matches
    const serveStats = computeServeStats(allGames, match.matchCategory);
    serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find(
        (p) => p._id?.toString() === playerId
      );
      return {
        player: player?.fullName || player?.username || "Unknown Player",
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
        {serveData.length > 0 && (
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
        )}

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
                      {strokeData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={getShotColor(entry.name)}
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
                            fill={getShotColor(entry.name)}
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