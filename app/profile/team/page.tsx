"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Users,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { EmptyState } from "../components/EmptyState";

import Diversity3Icon from '@mui/icons-material/Diversity3';

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
      ? ((teamStats.subMatchesWon / teamStats.subMatchesPlayed) * 100).toFixed(
          1
        )
      : "0";

  // Format data for charts
  const formatData = [
    {
      name: "Five Singles",
      matches: teamStats.byFormat.five_singles,
    },
    {
      name: "Single-Double-Single",
      matches: teamStats.byFormat.single_double_single,
    },
    {
      name: "Custom",
      matches: teamStats.byFormat.custom,
    },
  ].filter((format) => format.matches > 0);

  const winLossData = [
    { name: "Wins", value: teamStats.wins, color: "#10B981" },
    { name: "Losses", value: teamStats.losses, color: "#EF4444" },
  ];

  const subMatchData = [
    { name: "Wins", value: teamStats.subMatchesWon, color: "#8B5CF6" },
    {
      name: "Losses",
      value: teamStats.subMatchesPlayed - teamStats.subMatchesWon,
      color: "#F59E0B",
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Team Statistics
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : teamStats.total === 0 ? (
          <EmptyState
            icon={Diversity3Icon}
            title="No team statistics available."
            description="Team statistics will appear after team matches are played!"
          />
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Matches */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Team Matches Played
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {teamStats.total}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {teamStats.wins}W - {teamStats.losses}L
                </p>
              </div>

              {/* Team Win Rate */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Team Win Rate
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {teamWinRate}%
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  Overall team performance
                </p>
              </div>
            </div>

            {/* Individual Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Individual Games */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Individual Games Played
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {teamStats.subMatchesPlayed}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  Games in team matches
                </p>
              </div>

              {/* Personal Win Rate */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Personal Win Rate
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {subMatchWinRate}%
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {teamStats.subMatchesWon} individual wins
                </p>
              </div>
            </div>

            {/* Team Match Results */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Team Match Results
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const percent = (
                          ((entry.value as number) / teamStats.total) *
                          100
                        ).toFixed(1);
                        return `${percent}%`;
                      }}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} matches`]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Game Results */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Individual Game Results
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subMatchData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const percent = (
                          ((entry.value as number) /
                            teamStats.subMatchesPlayed) *
                          100
                        ).toFixed(1);
                        return `${percent}%`;
                      }}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {subMatchData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} games`]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Match Format Distribution */}
            {formatData.length > 0 && (
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                  Match Format Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="matches"
                        fill="#3c6e71"
                        radius={[8, 8, 0, 0]}
                        name="Matches"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Performance Analysis */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Performance Analysis
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-[#353535] font-semibold">
                      Team Match Win Rate
                    </span>
                    <span className="text-sm font-bold text-[#3c6e71]">
                      {teamWinRate}%
                    </span>
                  </div>
                  <div className="w-full bg-[#d9d9d9] rounded-full h-2">
                    <div
                      className="bg-[#3c6e71] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${teamWinRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-[#353535] font-semibold">
                      Individual Game Win Rate
                    </span>
                    <span className="text-sm font-bold text-[#3c6e71]">
                      {subMatchWinRate}%
                    </span>
                  </div>
                  <div className="w-full bg-[#d9d9d9] rounded-full h-2">
                    <div
                      className="bg-[#3c6e71] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${subMatchWinRate}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-[#d9d9d9] pt-4 mt-4">
                  <p className="text-xs text-[#353535]">
                    <strong>Summary:</strong> You&apos;ve played{" "}
                    {teamStats.subMatchesPlayed} individual games across{" "}
                    {teamStats.total} team matches.
                    {parseFloat(subMatchWinRate) > parseFloat(teamWinRate)
                      ? " Your personal performance exceeds your team's overall record."
                      : parseFloat(subMatchWinRate) < parseFloat(teamWinRate)
                      ? " Your team performs better overall - great teamwork!"
                      : " Your personal performance aligns with your team's success."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamStatsPage;
