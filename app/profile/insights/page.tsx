"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  TrendingUp,
  MoveLeft,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
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
import { LineWeaknessChart } from "@/components/weaknesses-analysis/LineWeaknessChart";
import { OriginDistanceAnalysis } from "@/components/weaknesses-analysis/OriginDistanceAnalysis";
import {
  hasLineData,
  hasOriginDistanceData,
} from "@/lib/weaknesses-analysis-utils";
import { EmptyState } from "../components/EmptyState";
import { TrendingUpOutlined } from "@mui/icons-material";

interface PerformanceInsightsPageProps {
  userId?: string;
}

const PerformanceInsightsPage = ({ userId }: PerformanceInsightsPageProps = {}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [weaknessData, setWeaknessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [weaknessLoading, setWeaknessLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        // Use userId prop if provided, otherwise use current user's profile
        const apiPath = userId ? `/profile/${userId}/insights` : `/profile/insights`;
        const response = await axiosInstance.get(apiPath);
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
        // Note: weaknesses-analysis route may also need userId support in the future
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
  }, [userId]);

  const stats = data?.stats || {};
  const graphs = data?.graphs || { matchPoints: [], serveAccuracy: [] };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Performance Insights
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : !data || graphs.matchPoints.length === 0 ? (
          <EmptyState icon={TrendingUpOutlined} title="No insights available." description="Performance insights will appear after matches are played!" />
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="max-w-xs">
              {/* Overall Win Rate */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Overall Win Rate
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {stats.overallWinRate}%
                </p>
              </div>
            </div>

            {/* Points Scored vs Conceded */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Points Scored vs Conceded (Last 10 Matches)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphs.matchPoints.slice(-10)}>
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
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
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
            <div className="mt-12 space-y-8">
              <div className="border-t border-[#d9d9d9] pt-8">
                <div className="mb-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                    Weaknesses Analysis
                  </h2>
                  <p className="text-xs text-[#353535] mt-2">
                    Identify areas for improvement based on your last 20 matches
                  </p>
                </div>

                {weaknessLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin h-6 w-6 text-[#3c6e71]" />
                      <span className="text-[#353535] text-sm">Analyzing weaknesses...</span>
                    </div>
                  </div>
                ) : !weaknessData ? (
                  <div className="bg-[#ffffff] border border-[#d9d9d9] p-16 text-center">
                    <TrendingUp className="w-16 h-16 text-[#d9d9d9] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#353535] mb-2">
                      No Analysis Available
                    </h3>
                    <p className="text-[#353535] text-sm">
                      Play more matches to generate weakness analysis!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <WeaknessInsightsPanel insights={weaknessData.overallInsights} />

                      <ShotWeaknessChart
                        shotWeaknesses={weaknessData.shotWeaknesses.byStrokeType}
                        variant="weaknesses"
                        showTop={10}
                      />

                    <ServeReceiveWeaknessCard
                      serveStats={weaknessData.serveReceiveWeaknesses.serve}
                      receiveStats={weaknessData.serveReceiveWeaknesses.receive}
                    />

                    <OpponentPatternAnalysis
                      patterns={weaknessData.opponentPatternAnalysis.successfulStrokes}
                      maxDisplay={5}
                    />

                    <ZoneHeatmap
                      zoneData={weaknessData.zoneWeaknesses}
                    />

                    {/* Semantic Zone Analysis Section */}
                    {weaknessData.semanticZoneAnalysis && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <LineWeaknessChart
                            lineWeaknesses={weaknessData.semanticZoneAnalysis.lineWeaknesses}
                          />
                          <OriginDistanceAnalysis
                            distanceWeaknesses={weaknessData.semanticZoneAnalysis.originDistanceWeaknesses}
                          />
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
