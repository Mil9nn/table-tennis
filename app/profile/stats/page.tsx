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
} from "recharts";

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
    setBreakdown: [],
  };
  const charts = statsData?.charts || { pointsPerMatch: [] };

  const singlesStats = singlesDoubles.singles;
  const doublesStats = singlesDoubles.doubles;

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
        <div className="mb-8 px-6 p-4">
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
          <div className="space-y-4 px-2">
            {/* A. Singles and Doubles Stats */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Singles and Doubles Performance
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* Singles */}
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">
                    Singles
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Wins</span>
                      <span className="text-lg font-bold text-green-600">
                        {singlesStats.wins || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Losses</span>
                      <span className="text-lg font-bold text-red-600">
                        {singlesStats.losses || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Sets Won</span>
                      <span className="text-lg font-bold text-blue-600">
                        {singlesStats.setsWon || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Sets Lost</span>
                      <span className="text-lg font-bold text-gray-600">
                        {singlesStats.setsLost || 0}
                      </span>
                    </div>
                    {singlesStats.matchesByTournamentType &&
                      Object.keys(singlesStats.matchesByTournamentType).length >
                        0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            By Tournament Type:
                          </p>
                          {Object.entries(
                            singlesStats.matchesByTournamentType
                          ).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-gray-700 capitalize">
                                {type}
                              </span>
                              <span className="font-semibold">
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Doubles */}
                <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">
                    Doubles
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Wins</span>
                      <span className="text-lg font-bold text-green-600">
                        {doublesStats.wins || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Losses</span>
                      <span className="text-lg font-bold text-red-600">
                        {doublesStats.losses || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Sets Won</span>
                      <span className="text-lg font-bold text-purple-600">
                        {doublesStats.setsWon || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Sets Lost</span>
                      <span className="text-lg font-bold text-gray-600">
                        {doublesStats.setsLost || 0}
                      </span>
                    </div>
                    {doublesStats.matchesByTournamentType &&
                      Object.keys(doublesStats.matchesByTournamentType).length >
                        0 && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <p className="text-xs font-semibold text-purple-900 mb-2">
                            By Tournament Type:
                          </p>
                          {Object.entries(
                            doublesStats.matchesByTournamentType
                          ).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-gray-700 capitalize">
                                {type}
                              </span>
                              <span className="font-semibold">
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Match Type Comparison Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                Singles vs Doubles Performance
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matchTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="wins"
                      fill="#10B981"
                      radius={[8, 8, 0, 0]}
                      name="Wins"
                    />
                    <Bar
                      dataKey="losses"
                      fill="#EF4444"
                      radius={[8, 8, 0, 0]}
                      name="Losses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* B. Scoring Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Scoring Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                    {server.serveWinPercentage || 0}<span className="text-sm">%</span>
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
                    <BarChart data={charts.pointsPerMatch}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="points"
                        fill="#8B5CF6"
                        radius={[8, 8, 0, 0]}
                        name="Points"
                      />
                    </BarChart>
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
                            <td className="py-3 px-4 text-gray-600 text-xs capitalize">
                              {match.tournamentName || match.tournamentType}
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

            {/* E. Set-by-Set Breakdown */}
            {tables.setBreakdown.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Set-by-Set Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Match #
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Set #
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Your Score
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Opponent Score
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Result
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.setBreakdown
                        .slice(0, 50)
                        .map((set: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-600">
                              {set.matchNumber}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {set.setNumber}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 capitalize">
                                {set.matchType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-700">
                              {set.userScore}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-600">
                              {set.opponentScore}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  set.won
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {set.won ? "Won" : "Lost"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {new Date(set.date).toLocaleDateString()}
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
