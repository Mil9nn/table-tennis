"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  ArrowLeft,
  BarChart3,
  Trophy,
  TrendingUp,
  Target,
  Award,
  MoveLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";

import WhatshotIcon from "@mui/icons-material/Whatshot";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import GroupsIcon from "@mui/icons-material/Groups";
import { EmptyState } from "../components/EmptyState";

// Helper function to format tournament type for display
const formatTournamentType = (type: string | null | undefined): string => {
  if (!type) return "Non-Tournament";
  switch (type) {
    case "round_robin":
      return "Round Robin";
    case "knockout":
      return "Knockout";
    case "hybrid":
      return "Hybrid";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }
};

interface PlayerStatsPageProps {
  userId?: string;
}

const PlayerStatsPage = ({ userId }: PlayerStatsPageProps = {}) => {
  const router = useRouter();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Use userId prop if provided, otherwise use current user's profile
        const apiPath = userId ? `/profile/${userId}/player-stats` : `/profile/player-stats`;
        const response = await axiosInstance.get(apiPath);
        setStatsData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const singlesDoubles = statsData?.singlesDoubles || {
    singles: {},
    doubles: {},
  };
  const scoring = statsData?.scoring || {};
  const server = statsData?.server || {};
  const tables = statsData?.tables || {
    matchPerformance: [],
  };
  const charts = statsData?.charts || { pointsPerMatch: [] };

  const singlesStats = singlesDoubles.singles;
  const doublesStats = singlesDoubles.doubles;

  // Calculate win rates
  const singlesTotalMatches =
    (singlesStats.wins || 0) + (singlesStats.losses || 0);
  const doublesTotalMatches =
    (doublesStats.wins || 0) + (doublesStats.losses || 0);
  const singlesWinRate =
    singlesTotalMatches > 0
      ? (((singlesStats.wins || 0) / singlesTotalMatches) * 100).toFixed(1)
      : "0.0";
  const doublesWinRate =
    doublesTotalMatches > 0
      ? (((doublesStats.wins || 0) / doublesTotalMatches) * 100).toFixed(1)
      : "0.0";

  // Calculate avg points per match
  const totalMatches = singlesTotalMatches + doublesTotalMatches;
  const avgPointsPerMatch =
    totalMatches > 0
      ? ((scoring.totalPointsScored || 0) / totalMatches).toFixed(1)
      : "0.0";

  // Calculate best win streak from match performance
  let bestWinStreak = 0;
  let currentStreak = 0;
  if (tables.matchPerformance && tables.matchPerformance.length > 0) {
    const matchesChronological = [...tables.matchPerformance].reverse();
    matchesChronological.forEach((match: any) => {
      if (match.result === "Win") {
        currentStreak++;
        bestWinStreak = Math.max(bestWinStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto py-8">
        {/* Page Title */}
        <div className="mb-8 px-4">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Player Statistics
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-[#ffffff] border border-[#d9d9d9] p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-[#d9d9d9] w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : !statsData || tables.matchPerformance.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No statistics available."
            description="Player statistics will appear after matches are played!"
          />
        ) : (
          <div className="space-y-6">
            {/* Performance Highlights */}
            <div className="px-4">
              <div className="mb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                  Performance Highlights
                </h2>
              </div>
              <div className="bg-[#ffffff] p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-[#f8f9fa] rounded-lg">
                      <WhatshotIcon
                        className="text-[#3c6e71]"
                        sx={{ fontSize: 24 }}
                      />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-1">
                        Best Win Streak
                      </h3>
                      <p className="text-xl font-bold text-[#353535]">
                        {bestWinStreak}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="px-4">
              <div className="border-t border-[#e5e5e5] my-6"></div>
            </div>

            {/* A. Singles and Doubles Stats */}
            <div className="px-4">
              <div className="mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                  Singles & Doubles Performance
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Singles */}
                <div className="p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-4">
                    Singles
                  </h3>

                  <div className="space-y-4">
                    {/* Match Win Rate Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#3c6e71]">
                          Match Performance
                        </span>
                        <span className="text-xs text-[#3c6e71] font-semibold">
                          {singlesStats.wins || 0}W / {singlesStats.losses || 0}
                          L
                        </span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${singlesWinRate}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        {singlesWinRate}% win rate • {singlesTotalMatches}{" "}
                        matches
                      </p>
                    </div>

                    {/* Sets Win Rate Progress Bar */}
                    {(singlesStats.setsWon || 0) +
                      (singlesStats.setsLost || 0) >
                      0 && (
                      <div className="pl-3 border-l-2 border-[#d9d9d9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#3c6e71]">
                            Sets
                          </span>
                          <span className="text-xs text-zinc-500 font-semibold">
                            {singlesStats.setsWon || 0}W /{" "}
                            {singlesStats.setsLost || 0}L
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (singlesStats.setsWon || 0) +
                                  (singlesStats.setsLost || 0) >
                                0
                                  ? Math.round(
                                      ((singlesStats.setsWon || 0) /
                                        ((singlesStats.setsWon || 0) +
                                          (singlesStats.setsLost || 0))) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full bg-blue-500 opacity-70 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-zinc-500">
                          {(singlesStats.setsWon || 0) +
                            (singlesStats.setsLost || 0) >
                          0
                            ? Math.round(
                                ((singlesStats.setsWon || 0) /
                                  ((singlesStats.setsWon || 0) +
                                    (singlesStats.setsLost || 0))) *
                                  100
                              )
                            : 0}
                          % win rate •{" "}
                          {(singlesStats.setsWon || 0) +
                            (singlesStats.setsLost || 0)}{" "}
                          sets
                        </p>
                      </div>
                    )}

                    {/* Tournament breakdown */}
                    {singlesStats?.matchesByTournamentType &&
                      Object.keys(singlesStats.matchesByTournamentType).length >
                        0 && (
                        <div className="border-t border-[#d9d9d9] pt-4 mt-4">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                            Tournament Types
                          </p>
                          <div className="space-y-2">
                            {Object.entries(
                              singlesStats.matchesByTournamentType
                            ).map(([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-[#353535]">
                                  {formatTournamentType(type)}
                                </span>
                                <span className="font-semibold text-[#353535]">
                                  {count as number}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Doubles */}
                <div className="p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-4">
                    Doubles
                  </h3>

                  <div className="space-y-4">
                    {/* Match Win Rate Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#353535]">
                          Match Performance
                        </span>
                        <span className="text-xs text-[#3c6e71] font-semibold">
                          {doublesStats.wins || 0}W / {doublesStats.losses || 0}
                          L
                        </span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${doublesWinRate}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-purple-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        {doublesWinRate}% win rate • {doublesTotalMatches}{" "}
                        matches
                      </p>
                    </div>

                    {/* Sets Win Rate Progress Bar */}
                    {(doublesStats.setsWon || 0) +
                      (doublesStats.setsLost || 0) >
                      0 && (
                      <div className="pl-3 border-l-2 border-[#d9d9d9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#3c6e71]">
                            Sets
                          </span>
                          <span className="text-xs text-zinc-500 font-semibold">
                            {doublesStats.setsWon || 0}W /{" "}
                            {doublesStats.setsLost || 0}L
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (doublesStats.setsWon || 0) +
                                  (doublesStats.setsLost || 0) >
                                0
                                  ? Math.round(
                                      ((doublesStats.setsWon || 0) /
                                        ((doublesStats.setsWon || 0) +
                                          (doublesStats.setsLost || 0))) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="h-full bg-purple-500 opacity-70 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-zinc-500">
                          {(doublesStats.setsWon || 0) +
                            (doublesStats.setsLost || 0) >
                          0
                            ? Math.round(
                                ((doublesStats.setsWon || 0) /
                                  ((doublesStats.setsWon || 0) +
                                    (doublesStats.setsLost || 0))) *
                                  100
                              )
                            : 0}
                          % win rate •{" "}
                          {(doublesStats.setsWon || 0) +
                            (doublesStats.setsLost || 0)}{" "}
                          sets
                        </p>
                      </div>
                    )}

                    {/* Tournament breakdown */}
                    {doublesStats?.matchesByTournamentType &&
                      Object.keys(doublesStats.matchesByTournamentType).length >
                        0 && (
                        <div className="border-t border-[#d9d9d9] pt-4 mt-4">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                            Tournament Types
                          </p>
                          <div className="space-y-2">
                            {Object.entries(
                              doublesStats.matchesByTournamentType
                            ).map(([type, count]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="text-[#353535]">
                                  {formatTournamentType(type)}
                                </span>
                                <span className="font-semibold text-[#353535]">
                                  {count as number}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="px-4">
              <div className="border-t border-[#e5e5e5] my-6"></div>
            </div>

            {/* B. Scoring Stats */}
            <div className="px-4">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                  Scoring Statistics
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Total Points Scored</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{scoring.totalPointsScored || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Total Points Conceded</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{scoring.totalPointsConceded || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Average Points Per Set</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{scoring.avgPointsPerSet || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Average Points Per Match</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{avgPointsPerMatch}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-medium text-[#353535]">Total Sets Played</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{scoring.totalSets || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="px-4">
              <div className="border-t border-[#e5e5e5] my-6"></div>
            </div>

            {/* C. Server Stats */}
            <div className="px-4">
              <div className="mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                  Serve Statistics
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Total Serves</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{server.totalServes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#353535]">Points Won on Serve</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{server.pointsWonOnServe || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-medium text-[#353535]">Serve Win Percentage</span>
                    <span className="text-base font-semibold text-[#3c6e71]">{server.serveWinPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* E. Points Per Match Chart */}
            {charts.pointsPerMatch.length > 0 && (
              <div className="px-4">
                <div className="mb-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                    Points Scored Per Match
                  </h2>
                </div>
                <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.pointsPerMatch}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend className="hidden md:block" />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Points"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsPage;
