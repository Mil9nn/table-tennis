"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Users, Loader2, MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TeamStatsPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch team stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const teamStats = stats?.team || {
    total: 0,
    byFormat: { five_singles: 0, single_double_single: 0, custom: 0 },
    wins: 0,
    losses: 0,
    subMatchesPlayed: 0,
    subMatchesWon: 0,
  };

  const teamWinRate =
    teamStats.total > 0
      ? ((teamStats.wins / teamStats.total) * 100).toFixed(1)
      : "0";

  const subMatchWinRate =
    teamStats.subMatchesPlayed > 0
      ? ((teamStats.subMatchesWon / teamStats.subMatchesPlayed) * 100).toFixed(1)
      : "0";

  // Format data for charts
  const formatData = [
    { name: "Five Singles", matches: teamStats.byFormat.five_singles },
    { name: "Single-Double-Single", matches: teamStats.byFormat.single_double_single },
    { name: "Custom", matches: teamStats.byFormat.custom },
  ].filter((format) => format.matches > 0);

  const winLossData = [
    { name: "Wins", value: teamStats.wins, color: "#10B981" },
    { name: "Losses", value: teamStats.losses, color: "#EF4444" },
  ];

  const subMatchData = [
    { name: "Wins", value: teamStats.subMatchesWon, color: "#8B5CF6" },
    { name: "Losses", value: teamStats.subMatchesPlayed - teamStats.subMatchesWon, color: "#F59E0B" },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-sm flex items-center gap-2 font-bold text-gray-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 p-1 border-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoveLeft className="size-4" />
            </button>
            <span>Team Statistics</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Your performance in team matches and formats
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : teamStats.total === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Team Statistics
            </h3>
            <p className="text-gray-600">
              Join a team and play team matches to see your team statistics!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Team Matches
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{teamStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {teamStats.wins}W - {teamStats.losses}L
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-green-500 tracking-wide">
                    Team Win Rate
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{teamWinRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Overall performance</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-purple-500 tracking-wide">
                    Individual Games
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{teamStats.subMatchesPlayed}</p>
                <p className="text-xs text-gray-500 mt-1">Games in team matches</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-amber-500 tracking-wide">
                    Personal Win Rate
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{subMatchWinRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{teamStats.subMatchesWon} wins</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Team Match Results */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Team Match Results
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => {
                          const percent = (
                            ((entry.value as number) / teamStats.total) * 100
                          ).toFixed(1);
                          return `${percent}%`;
                        }}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} matches`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Individual Game Results */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Individual Game Results
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subMatchData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => {
                          const percent = (
                            ((entry.value as number) / teamStats.subMatchesPlayed) * 100
                          ).toFixed(1);
                          return `${percent}%`;
                        }}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {subMatchData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} games`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Match Format Distribution */}
            {formatData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Match Format Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="matches" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Matches" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Performance Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Performance Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Team Match Win Rate</span>
                    <span className="font-medium">{teamWinRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${teamWinRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Individual Game Win Rate</span>
                    <span className="font-medium">{subMatchWinRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${subMatchWinRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Analysis:</strong> You&apos;ve played {teamStats.subMatchesPlayed} individual games across {teamStats.total} team matches.
                  {parseFloat(subMatchWinRate) > parseFloat(teamWinRate)
                    ? " Your personal performance is stronger than your team's overall record."
                    : parseFloat(subMatchWinRate) < parseFloat(teamWinRate)
                    ? " Your team wins more than your individual win rate - great teamwork!"
                    : " Your performance aligns with your team's success rate."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamStatsPage;
