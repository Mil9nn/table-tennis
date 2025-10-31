"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftCircle, Loader2, Share2, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";
import { Shot } from "@/types/shot.type";
import { axiosInstance } from "@/lib/axiosInstance";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch, isTeamMatch, Participant } from "@/types/match.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [isSharing, setIsSharing] = useState(false);

  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  useEffect(() => {
    if (!matchId) return;

    const searchParams = new URLSearchParams(window.location.search);
    const category =
      (searchParams.get("category") as "individual" | "team") || "individual";

    fetchMatch(matchId, category);
  }, [matchId, fetchMatch]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/matches/${matchId}?category=${match?.matchCategory}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Match Stats - ${match?.matchCategory === "individual" 
            ? `${match.participants?.[0]?.fullName} vs ${match.participants?.[1]?.fullName}`
            : `${(match as any).team1?.name} vs ${(match as any).team2?.name}`}`,
          url: shareUrl,
        });
        toast.success("Match shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Match link copied to clipboard!");
    }
  };

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

    // Game progression data
    const gameProgressionData = allGames.map((game, idx) => ({
      game: `G${idx + 1}`,
      [side1Name]: game.side1Score,
      [side2Name]: game.side2Score,
    }));

    return (
      <div className="p-4 space-y-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href={`/matches/${matchId}?category=${match.matchCategory}`}
            className="flex items-center gap-2 text-sm shadow-sm hover:shadow-md w-fit rounded-full px-3 py-1 text-blue-800 transition-all"
          >
            <ArrowLeftCircle />
            <span className="font-semibold">Go back</span>
          </Link>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="size-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Match Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-indigo-500">
              {side1Name} vs {side2Name}
            </h3>
            <div className="flex justify-center gap-8 text-3xl font-bold">
              <span className="text-emerald-600">{match.finalScore.side1Sets}</span>
              <span className="text-gray-400">-</span>
              <span className="text-rose-600">{match.finalScore.side2Sets}</span>
            </div>
            <p className="text-gray-500 text-sm">
              Total shots recorded: {shots.length}
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="games">Game-by-Game</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>

          {/* Overall Stats Tab */}
          <TabsContent value="overall" className="space-y-6 mt-6">
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

            {gameProgressionData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Score Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={gameProgressionData}>
                        <XAxis dataKey="game" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={side1Name}
                          stroke="#10B981"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey={side2Name}
                          stroke="#EF4444"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Game-by-Game Tab */}
          <TabsContent value="games" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Game Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {allGames.map((game, idx) => {
                    const gameShots = game.shots || [];
                    const gameStats = computeStats(gameShots);
                    const gamePlayerStats = computePlayerStats(gameShots);

                    const gameStrokeData = Object.entries(gameStats.shotTypes).map(
                      ([type, value]) => ({
                        name: formatStrokeName(type),
                        value,
                      })
                    );

                    return (
                      <AccordionItem key={idx} value={`game-${idx}`}>
                        <AccordionTrigger>
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-semibold">
                              Game {game.gameNumber}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-mono">
                                {game.side1Score} - {game.side2Score}
                              </span>
                              {game.winnerSide && (
                                <Badge variant="outline" className="text-xs rounded-full ring-2 ring-green-500 text-green-500">
                                  Winner:{" "}
                                  {game.winnerSide === "side1"
                                    ? side1Name
                                    : side2Name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Total shots</p>
                                <p className="text-xl font-bold">
                                  {gameShots.length}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Shot types used</p>
                                <p className="text-xl font-bold">
                                  {Object.keys(gameStats.shotTypes).length}
                                </p>
                              </div>
                            </div>

                            {gameStrokeData.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">
                                  Shot Distribution
                                </h4>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={gameStrokeData}>
                                      <XAxis
                                        dataKey="name"
                                        style={{ fontSize: "11px" }}
                                      />
                                      <YAxis width={25} />
                                      <Tooltip />
                                      <Bar dataKey="value">
                                        {gameStrokeData.map((entry, i) => (
                                          <Cell
                                            key={i}
                                            fill={getShotColor(entry.name)}
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {gameShots.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">
                                  Shot Sequence ({gameShots.length} shots)
                                </h4>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {gameShots.map((shot, shotIdx) => (
                                    <div
                                      key={shotIdx}
                                      className="text-xs flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                      <span className="font-mono text-gray-400">
                                        #{shotIdx + 1}
                                      </span>
                                      <span className="font-medium">
                                        {shot.player.fullName ||
                                          shot.player.username}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {formatStrokeName(shot.stroke || "")}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6 mt-6">
            {playerPieData.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {playerPieData.map((player) => {
                  const totalShots = Object.values(player.data).reduce(
                    (sum, item) => sum + item.value,
                    0
                  );

                  return (
                    <Card key={player.playerId}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {player.playerName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          Total shots: {totalShots}
                        </p>
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
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={getShotColor(entry.name)}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                wrapperStyle={{ fontSize: "11px" }}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Top 3 shots */}
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-semibold">Top Shots</h4>
                          {player.data
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 3)
                            .map((shot, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>{shot.name}</span>
                                <Badge variant="outline">{shot.value}</Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // TEAM MATCH STATS (similar enhancements)
  if (isTeamMatch(match)) {
    // ... (Team match stats with similar game-by-game breakdown)
    // The existing team match code with similar enhancements
    return <div>Team match stats (similar structure as individual)</div>;
  }

  return null;
}