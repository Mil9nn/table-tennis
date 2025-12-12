"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  TrendingUp,
  MoveLeft,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { WeaknessInsightsPanel } from "@/components/weaknesses-analysis/WeaknessInsightsPanel";
import { ShotWeaknessChart } from "@/components/weaknesses-analysis/ShotWeaknessChart";
import { ZoneHeatmap } from "@/components/weaknesses-analysis/ZoneHeatmap";
import { ServeReceiveWeaknessCard } from "@/components/weaknesses-analysis/ServeReceiveWeaknessCard";
import { OpponentPatternAnalysis } from "@/components/weaknesses-analysis/OpponentPatternAnalysis";
import { ZoneSectorWeaknessTable } from "@/components/weaknesses-analysis/ZoneSectorWeaknessTable";
import { LineWeaknessChart } from "@/components/weaknesses-analysis/LineWeaknessChart";
import { OriginDistanceAnalysis } from "@/components/weaknesses-analysis/OriginDistanceAnalysis";
import {
  hasZoneSectorData,
  hasLineData,
  hasOriginDistanceData,
} from "@/lib/weaknesses-analysis-utils";

const PerformanceInsightsPage = () => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [weaknessData, setWeaknessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [weaknessLoading, setWeaknessLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/insights`);
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWeaknesses = async () => {
      setWeaknessLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/weaknesses-analysis?matchLimit=20`);
        if (response.data.success && response.data.data) {
          setWeaknessData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch weaknesses:", error);
      } finally {
        setWeaknessLoading(false);
      }
    };

    fetchInsights();
    fetchWeaknesses();
  }, []);

  const stats = data?.stats || {};
  const graphs = data?.graphs || { matchPoints: [], serveAccuracy: [] };

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
            <span>Performance Insights</span>
          </h1>
          <p className=" text-xs mt-2">
            Key performance metrics and analytics
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : !data || graphs.matchPoints.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Insights Available
            </h3>
            <p className="text-gray-600">
              Play more matches to generate performance insights!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2 max-w-md">
              {/* Overall Win Rate */}
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Overall Win Rate
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">
                  {stats.overallWinRate}%
                </p>
              </div>
            </div>

            {/* Points Scored vs Conceded */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                Points Scored vs Conceded
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphs.matchPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="scored"
                      fill="#10B981"
                      radius={[8, 8, 0, 0]}
                      name="Scored"
                    />
                    <Bar
                      dataKey="conceded"
                      fill="#EF4444"
                      radius={[8, 8, 0, 0]}
                      name="Conceded"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Serve Accuracy Over Time */}
            {graphs.serveAccuracy.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Serve Accuracy Over Time
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphs.serveAccuracy}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Accuracy (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value: any) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: "#8B5CF6", r: 4 }}
                        name="Serve Accuracy"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Weaknesses Analysis Section */}
            <div className="mt-8 space-y-6">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Weaknesses Analysis
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Identify areas for improvement based on your last 20 matches
                </p>

                {weaknessLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                      <span className="text-gray-600">Analyzing weaknesses...</span>
                    </div>
                  </div>
                ) : !weaknessData ? (
                  <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No Analysis Available
                    </h3>
                    <p className="text-gray-600">
                      Play more matches to generate weakness analysis!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <WeaknessInsightsPanel insights={weaknessData.overallInsights} />

                    <div className="grid md:grid-cols-2 gap-6">
                      <ShotWeaknessChart
                        shotWeaknesses={weaknessData.shotWeaknesses.byStrokeType}
                        variant="weaknesses"
                        showTop={10}
                      />
                      <ZoneHeatmap
                        zoneData={weaknessData.zoneWeaknesses}
                        viewMode="winRate"
                      />
                    </div>

                    <ServeReceiveWeaknessCard
                      serveStats={weaknessData.serveReceiveWeaknesses.serve}
                      receiveStats={weaknessData.serveReceiveWeaknesses.receive}
                    />

                    <OpponentPatternAnalysis
                      patterns={weaknessData.opponentPatternAnalysis.successfulStrokes}
                      maxDisplay={5}
                    />

                    {/* Semantic Zone Analysis Section */}
                    {weaknessData.semanticZoneAnalysis && (
                      <div className="space-y-4 mt-6">
                        {/* Only show header if at least one sub-section has data */}
                        {(hasZoneSectorData(weaknessData.semanticZoneAnalysis.zoneSectorWeaknesses) ||
                          hasLineData(weaknessData.semanticZoneAnalysis.lineWeaknesses) ||
                          hasOriginDistanceData(weaknessData.semanticZoneAnalysis.originDistanceWeaknesses)) && (
                          <div>
                            <h3 className="text-xl font-semibold">Semantic Zone Analysis</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Advanced analysis using table zones, sectors, and shot trajectories
                            </p>
                          </div>
                        )}

                        {/* Each component returns null if no data */}
                        <ZoneSectorWeaknessTable
                          weaknesses={weaknessData.semanticZoneAnalysis.zoneSectorWeaknesses}
                          showAll={false}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <LineWeaknessChart
                            lineWeaknesses={weaknessData.semanticZoneAnalysis.lineWeaknesses}
                          />
                          <OriginDistanceAnalysis
                            distanceWeaknesses={weaknessData.semanticZoneAnalysis.originDistanceWeaknesses}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceInsightsPage;
