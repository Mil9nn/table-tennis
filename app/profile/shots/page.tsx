"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];

const ShotAnalysisPage = () => {
  const router = useRouter();
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setDetailedStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, []);

  const shotAnalysis = detailedStats?.shotAnalysis;

  const handednessData = shotAnalysis
    ? [
        { name: "Forehand", value: shotAnalysis.forehand },
        { name: "Backhand", value: shotAnalysis.backhand },
      ].filter((item) => item.value > 0)
    : [];

  const playStyleData = shotAnalysis
    ? [
        { name: "Offensive", value: shotAnalysis.offensive },
        { name: "Defensive", value: shotAnalysis.defensive },
        { name: "Neutral", value: shotAnalysis.neutral },
      ].filter((item) => item.value > 0)
    : [];

  const detailedShotsData = shotAnalysis?.detailedShots
    ? Object.entries(shotAnalysis.detailedShots)
        .map(([name, value]) => ({
          name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: value as number,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const totalShots =
    (shotAnalysis?.forehand || 0) + (shotAnalysis?.backhand || 0);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Profile</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shot Analysis</h1>
          <p className="text-gray-600 mt-2">
            Detailed breakdown of your shot selection, playing style, and technique preferences
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : totalShots === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Shot Data Yet
            </h3>
            <p className="text-gray-600">
              Play matches with shot tracking enabled to see your detailed shot analysis here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Total Shots Tracked</h3>
                <p className="text-3xl font-bold text-blue-700">{totalShots}</p>
                <p className="text-xs text-blue-600 mt-1">Across all matches</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">Forehand %</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {totalShots > 0
                    ? ((shotAnalysis.forehand / totalShots) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {shotAnalysis.forehand} shots
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Offensive %</h3>
                <p className="text-3xl font-bold text-green-700">
                  {totalShots > 0
                    ? (
                        (shotAnalysis.offensive /
                          (shotAnalysis.offensive +
                            shotAnalysis.defensive +
                            shotAnalysis.neutral)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {shotAnalysis.offensive} offensive shots
                </p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forehand vs Backhand */}
              {handednessData.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Forehand vs Backhand
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={handednessData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {handednessData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Playing Style */}
              {playStyleData.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Playing Style Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={playStyleData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {playStyleData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Shot Breakdown */}
            {detailedShotsData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Shot Type Distribution (18 Shot Types)
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detailedShotsData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis width={40} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {detailedShotsData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Shot Type Legend */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {detailedShotsData.slice(0, 6).map((shot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700">
                          {shot.name}
                        </p>
                        <p className="text-xs text-gray-500">{shot.value} shots</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShotAnalysisPage;
