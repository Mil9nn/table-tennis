 "use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { isIndividualMatch, isTeamMatch, Participant } from "@/types/match.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerStatsData {
  name: string;
  strokes: Record<string, number>;
}

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

const getShotColor = (strokeName: string): string => {
  const strokeKey = strokeName.toLowerCase().replace(/\s+/g, "_");
  return SHOT_TYPE_COLORS[strokeKey] || "#94A3B8";
};

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

function computeServeStats(games: any[], matchCategory: string) {

  const serveStats: Record<
    string,
    { servePoints: number; receivePoints: number; totalServes: number }
  > = {};

  (games || []).forEach((g) => {
    (g.shots || []).forEach((shot: any) => {
      let pointWinnerId: string | null = null;
      if (typeof shot.player === "string") {
        pointWinnerId = shot.player;
      } else if (shot.player?._id) {
        pointWinnerId = shot.player._id.toString();
      } else if (shot.player) {
        pointWinnerId = shot.player.toString();
      }

      let serverId: string | null = null;
      if (typeof shot.server === "string") {
        serverId = shot.server;
      } else if (shot.server?._id) {
        serverId = shot.server._id.toString();
      } else if (shot.server) {
        serverId = shot.server.toString();
      }

      if (!pointWinnerId || !serverId) return;

      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }

      if (!serveStats[pointWinnerId]) {
        serveStats[pointWinnerId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }

      serveStats[serverId].totalServes += 1;

      const isServerWinner = pointWinnerId === serverId;

      if (isServerWinner) {
        serveStats[serverId].servePoints += 1;
      } else {
        serveStats[pointWinnerId].receivePoints += 1;
      }
    });
  });

  return serveStats;
}

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

    const searchParams = new URLSearchParams(window.location.search);
    const category =
      (searchParams.get("category") as "individual" | "team") || "individual";

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

  // INDIVIDUAL MATCH STATS
  if (isIndividualMatch(match)) {
    const isSingles = match.matchType === "singles";
    const isDoubles = match.matchType === "doubles" || match.matchType === "mixed_doubles";

    const side1Name = isSingles
      ? match.participants?.[0]?.fullName || match.participants?.[0]?.username || "Player 1"
      : isDoubles
      ? "Side 1"
      : "Player 1";

    const side2Name = isSingles
      ? match.participants?.[1]?.fullName || "Player 2"
      : isDoubles
      ? "Side 2"
      : "Player 2";

    const allGames = match.games || [];
    const shots = allGames.flatMap((g) => g.shots || []);
    const allParticipants = match.participants || [];

    const { shotTypes } = computeStats(shots);
    const playerStats = computePlayerStats(shots);
    const serveStats = computeServeStats(allGames, match.matchCategory);

    const serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find((p) => p._id.toString() === playerId);
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(([playerId, stats]) => {
      const pieData = Object.entries(stats.strokes).map(([stroke, count]) => ({
        name: formatStrokeName(stroke),
        value: count,
      }));
      return {
        playerId,
        playerName: stats.name,
        data: pieData,
      };
    });

    return (
      <div className="p-4 space-y-10 mx-auto">
        <Link
          href={`/matches/${matchId}?category=${match.matchCategory}`}
          className="flex items-center gap-2 text-sm shadow-sm hover:shadow-md w-fit rounded-full px-3 py-1 text-blue-800 transition-all"
        >
          <ArrowLeftCircle />
          <span className="font-semibold">Go back</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Match Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-indigo-500">
              {side1Name} vs {side2Name}
            </h3>
            <p className="text-gray-500 text-sm">
              Games:{" "}
              {match.games
                ?.map((g: any, i: number) => `G${i + 1}: ${g.side1Score}-${g.side2Score}`)
                .join(" | ")}
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
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
                          <Cell key={i} fill={getShotColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {playerPieData.length > 0 && (
          <>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Individual Player Statistics</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {playerPieData.map((player) => (
                <section
                  key={player.playerId}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition"
                >
                  <header className="px-4 py-3">
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
                            <Cell key={`cell-${index}`} fill={getShotColor(entry.name)} />
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

  // TEAM MATCH STATS
  if (isTeamMatch(match)) {
    const subMatches = match.subMatches || [];

    // Get unique players
    const uniquePlayersMap = new Map();
    subMatches.forEach((sm) => {
      const team1Players = Array.isArray(sm.playerTeam1) ? sm.playerTeam1 : [sm.playerTeam1];
      const team2Players = Array.isArray(sm.playerTeam2) ? sm.playerTeam2 : [sm.playerTeam2];

      [...team1Players, ...team2Players].forEach((p: any) => {
        if (p && p._id) {
          uniquePlayersMap.set(p._id.toString(), p);
        }
      });
    });

    const allUniqueParticipants = Array.from(uniquePlayersMap.values());

    // Overall stats
    const allGames = subMatches.flatMap((sm) => sm.games || []);
    const allShots = allGames.flatMap((g) => g.shots || []);
    const { shotTypes } = computeStats(allShots);
    const playerStats = computePlayerStats(allShots);
    const serveStats = computeServeStats(allGames, match.matchCategory);

    const overallServeData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allUniqueParticipants.find((p: any) => p._id?.toString() === playerId);
      return {
        player: player?.fullName || player?.username || "Unknown Player",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const overallStrokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(([playerId, stats]) => {
      const pieData = Object.entries(stats.strokes).map(([stroke, count]) => ({
        name: formatStrokeName(stroke),
        value: count,
      }));
      return {
        playerId,
        playerName: stats.name,
        data: pieData,
      };
    });

    // Per-submatch breakdown
    const subMatchBreakdowns = subMatches.map((sm, idx) => {
      const games = sm.games || [];
      const shots = games.flatMap((g) => g.shots || []);
      const { shotTypes: smShotTypes } = computeStats(shots);
      const smPlayerStats = computePlayerStats(shots);
      const smServeStats = computeServeStats(games, "team");

      const team1Players = Array.isArray(sm.playerTeam1) ? sm.playerTeam1 : [sm.playerTeam1];
      const team2Players = Array.isArray(sm.playerTeam2) ? sm.playerTeam2 : [sm.playerTeam2];
      const smParticipants = [...team1Players, ...team2Players];

      const team1Names = team1Players.map((p: any) => p?.fullName || p?.username || "TBD").join(" & ");
      const team2Names = team2Players.map((p: any) => p?.fullName || p?.username || "TBD").join(" & ");

      return {
        subMatchIndex: idx,
        matchNumber: sm.matchNumber,
        matchType: sm.matchType,
        team1Names,
        team2Names,
        status: sm.status,
        finalScore: sm.finalScore,
        winnerSide: sm.winnerSide,
        shots,
        shotTypes: smShotTypes,
        playerStats: smPlayerStats,
        serveStats: smServeStats,
        participants: smParticipants,
      };
    });

    return (
      <div className="p-4 space-y-10 mx-auto max-w-7xl">
        <Link
          href={`/matches/${matchId}?category=team`}
          className="flex items-center gap-2 text-sm shadow-sm hover:shadow-md w-fit rounded-full px-3 py-1 text-blue-800 transition-all"
        >
          <ArrowLeftCircle />
          <span className="font-semibold">Go back</span>
        </Link>

        {/* Match Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Team Match Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-indigo-500">
              {match.team1.name} vs {match.team2.name}
            </h3>
            <div className="flex justify-center gap-8 text-3xl font-bold">
              <span className="text-emerald-600">{match.finalScore.team1Matches}</span>
              <span className="text-gray-400">-</span>
              <span className="text-rose-600">{match.finalScore.team2Matches}</span>
            </div>
            <p className="text-sm text-gray-500">
              {match.matchFormat.replace(/_/g, " ")} • {subMatches.length} matches
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <TabsTrigger value="overall">Overall Stats</TabsTrigger>
            <TabsTrigger value="breakdown">Match Breakdown</TabsTrigger>
          </TabsList>

          {/* Overall Stats Tab */}
          <TabsContent value="overall" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {overallServeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Serve vs Receive Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overallServeData}>
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

              {overallStrokeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Shot Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overallStrokeData}>
                          <XAxis dataKey="name" />
                          <YAxis width={25} />
                          <Tooltip />
                          <Bar dataKey="value">
                            {overallStrokeData.map((entry, i) => (
                              <Cell key={i} fill={getShotColor(entry.name)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {playerPieData.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mt-10">Individual Player Statistics</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {playerPieData.map((player) => (
                    <Card key={player.playerId}>
                      <CardHeader>
                        <CardTitle className="text-lg">{player.playerName}'s Shot Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={player.data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomLabel}
                                outerRadius={100}
                                dataKey="value"
                              >
                                {player.data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getShotColor(entry.name)} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Match Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6 mt-6">
            {subMatchBreakdowns.map((breakdown) => {
              const serveData = Object.entries(breakdown.serveStats).map(([playerId, s]) => {
                const player = breakdown.participants.find((p: any) => p?._id?.toString() === playerId);
                return {
                  player: (player as Participant)?.fullName || (player as Participant)?.username || "Unknown",
                  Serve: s.servePoints,
                  Receive: s.receivePoints,
                };
              });

              const strokeData = Object.entries(breakdown.shotTypes).map(([type, value]) => ({
                name: formatStrokeName(type),
                value,
              }));

              const playerData = Object.entries(breakdown.playerStats).map(([playerId, stats]) => {
                const pieData = Object.entries(stats.strokes).map(([stroke, count]) => ({
                  name: formatStrokeName(stroke),
                  value: count,
                }));
                return {
                  playerId,
                  playerName: stats.name,
                  data: pieData,
                };
              });

              return (
                <Card key={breakdown.subMatchIndex} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Match {breakdown.matchNumber}</Badge>
                          <Badge variant={breakdown.matchType === "singles" ? "default" : "secondary"}>
                            {breakdown.matchType === "singles" ? "Singles" : "Doubles"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {breakdown.team1Names} <span className="text-gray-400 mx-2">vs</span> {breakdown.team2Names}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {breakdown.status === "completed" && breakdown.finalScore && (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Score</p>
                              <p className="text-lg font-bold">
                                {breakdown.finalScore.team1Sets} - {breakdown.finalScore.team2Sets}
                              </p>
                            </div>
                            {breakdown.winnerSide && (
                              <Badge className="bg-green-100 text-green-700">
                                Winner: {breakdown.winnerSide === "team1" ? breakdown.team1Names : breakdown.team2Names}
                              </Badge>
                            )}
                          </>
                        )}
                        {breakdown.status !== "completed" && (
                          <Badge variant="secondary">{breakdown.status}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {breakdown.shots.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No shot data recorded for this match</p>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-2 gap-6">
                          {serveData.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Serve vs Receive</h4>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={serveData}>
                                    <XAxis dataKey="player" style={{ fontSize: "12px" }} />
                                    <YAxis width={25} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="Serve" fill={COLORS.serve} />
                                    <Bar dataKey="Receive" fill={COLORS.receive} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {strokeData.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Shot Distribution</h4>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={strokeData}>
                                    <XAxis dataKey="name" style={{ fontSize: "12px" }} />
                                    <YAxis width={25} />
                                    <Tooltip />
                                    <Bar dataKey="value">
                                      {strokeData.map((entry, i) => (
                                        <Cell key={i} fill={getShotColor(entry.name)} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>

                        {playerData.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Player Shot Breakdown</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                              {playerData.map((player) => (
                                <div key={player.playerId} className="border rounded-lg p-4">
                                  <h5 className="text-sm font-medium mb-2">{player.playerName}</h5>
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={player.data}
                                          cx="50%"
                                          cy="50%"
                                          labelLine={false}
                                          label={renderCustomLabel}
                                          outerRadius={80}
                                          dataKey="value"
                                        >
                                          {player.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getShotColor(entry.name)} />
                                          ))}
                                        </Pie>
                                        <Tooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}