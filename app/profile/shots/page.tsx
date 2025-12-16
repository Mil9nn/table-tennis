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
  Cell,
} from "recharts";
import { SHOT_TYPE_COLORS } from "@/constants/constants";
import WagonWheel from "@/components/WagonWheel";

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
  const serveTypeDistribution: Record<string, number> = shotData?.serveTypeDistribution || { side_spin: 0, top_spin: 0, back_spin: 0, mix_spin: 0, no_spin: 0 };
  const heatmapGrid: { count: number; dominantStroke: string | null; shotTypes: Record<string, number> }[][] =
    shotData?.heatmapGrid || [];
  const allShots = shotData?.allShots || [];
  const opponentShots = shotData?.opponentShots || [];

  // Zone/Sector/Line statistics
  const userZoneStats = shotData?.userZoneStats || {};
  const userSectorStats = shotData?.userSectorStats || {};
  const userLineStats = shotData?.userLineStats || {};
  const userOriginZoneStats = shotData?.userOriginZoneStats || {};
  const opponentZoneStats = shotData?.opponentZoneStats || {};
  const opponentSectorStats = shotData?.opponentSectorStats || {};
  const opponentLineStats = shotData?.opponentLineStats || {};

  // Calculate max value for intensity scaling
  const maxHeatmapValue = heatmapGrid
    .flat()
    .reduce((max: number, cell: any) => Math.max(max, cell?.count || 0), 0);

  // Get heatmap cell style based on dominant shot type and intensity
  const getHeatmapStyle = (cell: { count: number; dominantStroke: string | null }) => {
    if (!cell || cell.count === 0) {
      return { backgroundColor: "#f3f4f6" }; // gray-100
    }
    
    const baseColor = cell.dominantStroke 
      ? SHOT_TYPE_COLORS[cell.dominantStroke] || "#3b82f6"
      : "#3b82f6";
    
    // Calculate opacity based on intensity (0.3 to 1.0 range)
    const intensity = Math.min(cell.count / maxHeatmapValue, 1);
    const opacity = 0.3 + (intensity * 0.7);
    
    return { 
      backgroundColor: baseColor,
      opacity,
    };
  };

  // Format shot type name for tooltip
  const formatShotName = (stroke: string) => {
    return stroke.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
                    Winning Shots
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{totalShots}</p>
                <p className="text-xs text-gray-500 mt-1">Point-winning shots across all matches</p>
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
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {shotDistribution.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SHOT_TYPE_COLORS[entry.stroke] || "#3b82f6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap */}
            {heatmapGrid.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100  shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Shot Landing Heatmap
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Aggregated shot landing positions from all your matches. Colors represent dominant shot type in each zone. Brighter = more shots.
                </p>

                <div className="flex justify-center">
                  <div className="inline-block border-2 border-gray-800 overflow-hidden w-full max-w-4xl">
                    {/* Container with correct table aspect ratio (274cm:152.5cm ≈ 1.8:1) */}
                    <div className="relative aspect-[274/152.5] w-full">
                      {/* Net line - vertical, dividing left/right */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-800 z-10 -translate-x-1/2"></div>

                      <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                        {heatmapGrid.map((row, r: number) =>
                          row.map((cell, c: number) => (
                            <div
                              key={`${r}-${c}`}
                              className="border border-gray-300/50 flex items-center justify-center relative group cursor-pointer"
                              style={getHeatmapStyle(cell)}
                            >
                              {/* Tooltip on hover */}
                              {cell?.count > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-[9px] rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
                                    <div className="font-bold mb-1">
                                      {cell.dominantStroke ? formatShotName(cell.dominantStroke) : "Unknown"}
                                    </div>
                                    <div className="text-gray-300">
                                      {cell.count} shot{cell.count > 1 ? "s" : ""}
                                    </div>
                                    {cell.shotTypes && Object.keys(cell.shotTypes).length > 1 && (
                                      <div className="border-t border-gray-700 mt-1 pt-1 text-gray-400">
                                        {Object.entries(cell.shotTypes)
                                          .sort(([, a], [, b]) => b - a)
                                          .slice(0, 3)
                                          .map(([stroke, count]) => (
                                            <div key={stroke} className="flex justify-between gap-2">
                                              <span>{formatShotName(stroke)}:</span>
                                              <span>{count}</span>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-700">
                      Left Side ← | → Right Side
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      (All shots normalized to consistent perspective)
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {shotDistribution.slice(0, 6).map((shot: any) => (
                      <div key={shot.stroke} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: SHOT_TYPE_COLORS[shot.stroke] || "#3b82f6" }}
                        />
                        <span className="text-[10px] text-gray-600">{shot.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Serve Type Distribution */}
                  <div className="mt-4 text-center">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Serve Types that fetched points</h4>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {Object.entries(serveTypeDistribution).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SHOT_TYPE_COLORS[k] || '#6B7280' }} />
                          <div className="text-[12px] text-gray-600">{k.replace(/_/g, ' ')}: <span className="font-bold text-gray-800">{v}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shot Trajectories - Wagon Wheel */}
            {allShots.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Your Shot Trajectories
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Detailed view of your shot placement and trajectories across all matches. Filter by shot type to see patterns.
                </p>
                <WagonWheel shots={allShots} />
              </div>
            )}

            {/* Opponent Shot Trajectories */}
            {opponentShots.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Opponent Shot Trajectories
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Where your opponents&apos; shots land when they score against you. Identify defensive weaknesses and vulnerable zones.
                </p>
                <WagonWheel shots={opponentShots} />
              </div>
            )}

            {/* Zone/Sector/Line Analysis */}
            {totalShots > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Targeting Analysis
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Breakdown of zones, sectors, and lines you target, plus where opponents exploit you defensively.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Your Offensive Patterns */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-blue-600 border-b pb-2">
                      Your Offensive Patterns
                    </h4>

                    {/* Zones Targeted */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Zones Targeted</p>
                      <div className="space-y-1">
                        {Object.entries(userZoneStats)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([zone, count]) => {
                            const total = (Object.values(userZoneStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                            return (
                              <div key={zone} className="flex items-center justify-between text-xs">
                                <span className="capitalize text-gray-600">{zone}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-gray-800 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Sectors Targeted */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Sectors Targeted</p>
                      <div className="space-y-1">
                        {Object.entries(userSectorStats)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([sector, count]) => {
                            const total = (Object.values(userSectorStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                            return (
                              <div key={sector} className="flex items-center justify-between text-xs">
                                <span className="capitalize text-gray-600">{sector}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-gray-800 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Lines Used */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Lines of Play</p>
                      <div className="space-y-1">
                        {Object.entries(userLineStats)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .filter(([, count]) => (count as number) > 0)
                          .map(([line, count]) => {
                            const total = (Object.values(userLineStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                            return (
                              <div key={line} className="flex items-center justify-between text-xs">
                                <span className="capitalize text-gray-600">{line}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-gray-800 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Playing Position */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Playing Position</p>
                      <div className="space-y-1">
                        {Object.entries(userOriginZoneStats)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .filter(([, count]) => (count as number) > 0)
                          .map(([zone, count]) => {
                            const total = (Object.values(userOriginZoneStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                            return (
                              <div key={zone} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{zone.replace(/-/g, " ")}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-gray-800 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Defensive Weaknesses */}
                  {opponentShots.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-red-600 border-b pb-2">
                        Your Defensive Weaknesses
                      </h4>

                      {/* Zones Exploited */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Zones Where You&apos;re Scored On</p>
                        <div className="space-y-1">
                          {Object.entries(opponentZoneStats)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([zone, count]) => {
                              const total = (Object.values(opponentZoneStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                              const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                              return (
                                <div key={zone} className="flex items-center justify-between text-xs">
                                  <span className="capitalize text-gray-600">{zone}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-medium text-gray-800 w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Sectors Exploited */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Sectors Where You&apos;re Vulnerable</p>
                        <div className="space-y-1">
                          {Object.entries(opponentSectorStats)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([sector, count]) => {
                              const total = (Object.values(opponentSectorStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                              const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                              return (
                                <div key={sector} className="flex items-center justify-between text-xs">
                                  <span className="capitalize text-gray-600">{sector}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-medium text-gray-800 w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Lines Exploited */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Lines Opponents Use Against You</p>
                        <div className="space-y-1">
                          {Object.entries(opponentLineStats)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .filter(([, count]) => (count as number) > 0)
                            .map(([line, count]) => {
                              const total = (Object.values(opponentLineStats) as number[]).reduce((a: number, b: number) => a + b, 0);
                              const percentage = total > 0 ? ((count as number / total) * 100).toFixed(1) : 0;
                              return (
                                <div key={line} className="flex items-center justify-between text-xs">
                                  <span className="capitalize text-gray-600">{line}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-medium text-gray-800 w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
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