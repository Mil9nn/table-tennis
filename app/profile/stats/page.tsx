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

import WhatshotIcon from '@mui/icons-material/Whatshot';

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

const PlayerStatsPage = () => {
  const router = useRouter();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/player-stats`);
        setStatsData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
  const singlesTotalMatches = (singlesStats.wins || 0) + (singlesStats.losses || 0);
  const doublesTotalMatches = (doublesStats.wins || 0) + (doublesStats.losses || 0);
  const singlesWinRate = singlesTotalMatches > 0 
    ? ((singlesStats.wins || 0) / singlesTotalMatches * 100).toFixed(1)
    : "0.0";
  const doublesWinRate = doublesTotalMatches > 0
    ? ((doublesStats.wins || 0) / doublesTotalMatches * 100).toFixed(1)
    : "0.0";

  // Calculate avg points per match
  const totalMatches = singlesTotalMatches + doublesTotalMatches;
  const avgPointsPerMatch = totalMatches > 0 
    ? ((scoring.totalPointsScored || 0) / totalMatches).toFixed(1)
    : "0.0";

  // Calculate best win streak from match performance
  // Note: matches are sorted newest first, so we reverse to calculate chronologically
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

  // Prepare data for charts
  const matchTypeData = [
    {
      type: "Singles",
      wins: singlesStats.wins || 0,
      losses: singlesStats.losses || 0,
      setsWon: singlesStats.setsWon || 0,
      setsLost: singlesStats.setsLost || 0,
    },
    {
      type: "Doubles",
      wins: doublesStats.wins || 0,
      losses: doublesStats.losses || 0,
      setsWon: doublesStats.setsWon || 0,
      setsLost: doublesStats.setsLost || 0,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="px-6 p-4">
          <h1 className="text-sm flex items-center gap-2 font-bold text-gray-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 p-1 border-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoveLeft className="size-4" />
            </button>
            <span>Player Statistics</span>
          </h1>
          <p className=" text-xs mt-2">
            Comprehensive breakdown of your match performance and statistics
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : !statsData || tables.matchPerformance.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Statistics Available
            </h3>
            <p className="text-gray-600">
              Play matches to start building your player statistics!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Performance Highlights */}
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-800 mb-4">
                Performance Highlights
              </h2>
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-600 mb-1">
                      Best Win Streak
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {bestWinStreak}
                    </p>
                  </div>
                  <div className="text-4xl">
                    <WhatshotIcon fontSize="large" className="text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* A. Singles and Doubles Stats */}
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-800 mb-6">
                Singles & Doubles Performance
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Singles */}
                <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5">
                  <h3 className="text-base font-semibold text-zinc-900 mb-3">
                    Singles
                  </h3>

                  {/* Capsules */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      Wins: {singlesStats.wins || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                      Losses: {singlesStats.losses || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                      Sets Won: {singlesStats.setsWon || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
                      Sets Lost: {singlesStats.setsLost || 0}
                    </div>
                  </div>

                  {/* Win Rate Card */}
                  {singlesTotalMatches > 0 && (
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xs font-semibold text-blue-500 tracking-wide">
                           Win Rate
                        </h4>
                      </div>
                      <p className="text-xl font-bold text-gray-700">
                        {singlesWinRate}%
                      </p>
                    </div>
                  )}

                  {/* Tournament breakdown */}
                  {singlesStats?.matchesByTournamentType &&
                    Object.keys(singlesStats.matchesByTournamentType).length >
                      0 && (
                      <div className="pt-4 border-t border-zinc-200/70 mt-3">
                        <p className="text-xs font-semibold text-zinc-800 mb-2">
                          Tournament Types
                        </p>

                        <div className="space-y-1.5">
                          {Object.entries(
                            singlesStats.matchesByTournamentType
                          ).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-zinc-600">
                                {formatTournamentType(type)}
                              </span>
                              <span className="font-semibold text-zinc-800">
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Doubles */}
                <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5">
                  <h3 className="text-base font-semibold text-zinc-900 mb-3">
                    Doubles
                  </h3>

                  {/* Capsules */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      Wins: {doublesStats.wins || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                      Losses: {doublesStats.losses || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold">
                      Sets Won: {doublesStats.setsWon || 0}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
                      Sets Lost: {doublesStats.setsLost || 0}
                    </div>
                  </div>

                  {/* Win Rate Card */}
                  {doublesTotalMatches > 0 && (
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xs font-semibold text-blue-500 tracking-wide">
                          Doubles Win Rate
                        </h4>
                      </div>
                      <p className="text-xl font-bold text-gray-700">
                        {doublesWinRate}%
                      </p>
                    </div>
                  )}

                  {doublesStats?.matchesByTournamentType &&
                    Object.keys(doublesStats.matchesByTournamentType).length >
                      0 && (
                      <div className="pt-4 border-t border-zinc-200/70 mt-3">
                        <p className="text-xs font-semibold text-zinc-800 mb-2">
                          Tournament Types
                        </p>

                        <div className="space-y-1.5">
                          {Object.entries(
                            doublesStats.matchesByTournamentType
                          ).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-zinc-600">
                                {formatTournamentType(type)}
                              </span>
                              <span className="font-semibold text-zinc-800">
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

            {/* B. Scoring Stats */}
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Scoring Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="bg-gradient-to-br from-green-50 to-green-100 shadow-sm rounded-lg p-4">
                  <p className="text-sm text-green-900 font-semibold mb-1">
                    Total Points Scored
                  </p>
                  <p className="text-3xl font-bold text-green-700">
                    {scoring.totalPointsScored || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 shadow-sm rounded-lg p-4">
                  <p className="text-sm text-red-900 font-semibold mb-1">
                    Total Points Conceded
                  </p>
                  <p className="text-3xl font-bold text-red-700">
                    {scoring.totalPointsConceded || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-1">
                    Avg Points Per Set
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {scoring.avgPointsPerSet || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm rounded-lg p-4">
                  <p className="text-sm text-orange-900 font-semibold mb-1">
                    Avg Points/Match
                  </p>
                  <p className="text-3xl font-bold text-orange-700">
                    {avgPointsPerMatch}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm rounded-lg p-4">
                  <p className="text-sm text-purple-900 font-semibold mb-1">
                    Total Sets
                  </p>
                  <p className="text-3xl font-bold text-purple-700">
                    {scoring.totalSets || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* C. Server Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Serve Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="shadow-sm rounded-lg p-4">
                  <p className="text-sm text-amber-600 font-semibold mb-1">
                    Total Serves
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {server.totalServes || 0}
                  </p>
                </div>
                <div className="shadow-sm rounded-lg p-4">
                  <p className="text-sm text-amber-600 font-semibold mb-1">
                    Points Won on Serve
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {server.pointsWonOnServe || 0}
                  </p>
                </div>
                <div className="rounded-lg p-4">
                  <p className="text-sm text-amber-700 font-semibold mb-1">
                    Serve Win %
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    {server.serveWinPercentage || 0}
                    <span className="text-sm">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* E. Points Per Match Chart */}
            {charts.pointsPerMatch.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Points Scored Per Match
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.pointsPerMatch}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                      <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />

                      <Tooltip />
                      <Legend />

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
            )}

            {/* E. Match-by-Match Performance Table */}
            {tables.matchPerformance.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Match-by-Match Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          #
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Opponent
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Result
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Score
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Points
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Tournament
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.matchPerformance
                        .slice(0, 25)
                        .map((match: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-600">
                              {match.matchNumber}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                                {match.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-800 font-medium">
                              {match.opponent}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  match.result === "Win"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {match.result}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-700">
                              {match.score}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {match.pointsScored} - {match.pointsConceded}
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-xs">
                              {match.tournamentName && match.tournamentType
                                ? `${match.tournamentName} (${formatTournamentType(match.tournamentType)})`
                                : match.tournamentName || formatTournamentType(match.tournamentType)}
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {new Date(match.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
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
