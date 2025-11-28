"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { MoveLeft, Loader2, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const ShotAnalysisPage = () => {
  const router = useRouter();
  const [shotData, setShotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShotAnalysis = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/shots-analysis`);
        setShotData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch shot analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShotAnalysis();
  }, []);

  const shotDistribution = shotData?.shotDistribution || [];
  const heatmapGrid = shotData?.heatmapGrid || [];

  const maxHeatmapValue = heatmapGrid
    .flat()
    .reduce((max: number, val: number) => Math.max(max, val), 0);

  const getHeatmapColor = (value: number) => {
    if (value === 0) return "bg-gray-100";
    const intensity = Math.min((value / maxHeatmapValue) * 100, 100);
    if (intensity < 20) return "bg-blue-200";
    if (intensity < 40) return "bg-blue-300";
    if (intensity < 60) return "bg-blue-400";
    if (intensity < 80) return "bg-blue-500";
    return "bg-blue-600";
  };

  const totalShots = shotDistribution.reduce(
    (sum: number, shot: any) => sum + shot.count,
    0
  );

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
            <span>Shot Analysis</span>
          </h1>
          <p className="text-xs mt-2">
            Breakdown of your shot tendencies and placement
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : totalShots === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Shot Data Yet
            </h3>
            <p className="text-gray-600">
              Play matches with shot tracking enabled to generate insights.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Total Shots Tracked
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{totalShots}</p>
                <p className="text-xs text-gray-500 mt-1">Across all matches</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Most Used Shot
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">
                  {shotDistribution[0]?.name || "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {shotDistribution[0]?.count || 0} times •{" "}
                  {shotDistribution[0]
                    ? ((shotDistribution[0].count / totalShots) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                Shot Type Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shotDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap */}
            {heatmapGrid.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Shot Landing Heatmap
                </h3>

                <div className="flex justify-center">
                  <div className="inline-block border-4 border-gray-800 rounded-lg overflow-hidden">
                    <div className="relative">
                      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-800 z-10 -translate-y-1/2"></div>

                      <div className="grid grid-cols-10">
                        {heatmapGrid.map((row: number[], r: number) =>
                          row.map((value: number, c: number) => (
                            <div
                              key={`${r}-${c}`}
                              className={`w-10 h-10 border border-gray-300 ${getHeatmapColor(
                                value
                              )} flex items-center justify-center text-[10px] font-semibold ${
                                value > 0 ? "text-white" : "text-gray-400"
                              }`}
                            >
                              {value > 0 ? value : ""}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-100 py-1 text-center">
                      <p className="text-[10px] font-semibold text-gray-700">
                        Opponent ↑ | ↓ You
                      </p>
                    </div>
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

export default ShotAnalysisPage;