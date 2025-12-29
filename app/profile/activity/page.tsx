"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Activity as ActivityIcon,
  Loader2,
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
} from "recharts";
import { EmptyState } from "../components/EmptyState";

interface ActivityTrendsPageProps {
  userId?: string;
}

const ActivityTrendsPage = ({ userId }: ActivityTrendsPageProps) => {
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

  const monthlyActivity = detailedStats?.monthlyActivity || [];
  const totalMatches = monthlyActivity.reduce(
    (sum: number, m: any) => sum + m.count,
    0
  );
  const avgPerMonth =
    monthlyActivity.length > 0
      ? (totalMatches / monthlyActivity.length).toFixed(1)
      : 0;
  const peakMonth =
    monthlyActivity.length > 0
      ? monthlyActivity.reduce(
          (max: any, m: any) => (m.count > max.count ? m : max),
          monthlyActivity[0]
        )
      : null;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Activity & Trends
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : monthlyActivity.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity data available."
            description="Play matches to start tracking your activity trends over time!"
          />
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Total Matches
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {totalMatches}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  Across {monthlyActivity.length} months
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Average Per Month
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {avgPerMonth}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  Matches per month
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Peak Month
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {peakMonth?.count || 0}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {peakMonth?.month
                    ? new Date(peakMonth.month).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Monthly Match Activity
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "2-digit",
                        });
                      }}
                    />
                    <YAxis width={40} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                      }}
                      formatter={(value: any) => [`${value} matches`, "Total"]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3c6e71"
                      radius={[8, 8, 0, 0]}
                      name="Matches"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Monthly Breakdown
              </h3>
              <div className="space-y-4">
                {monthlyActivity.slice().reverse().map((item: any, index: number) => {
                  const percentage = (item.count / totalMatches) * 100;
                  const date = new Date(item.month);
                  const monthName = date.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-32 text-xs font-bold text-[#353535]">
                        {monthName}
                      </div>
                      <div className="flex-1 bg-[#e5e7eb] rounded-full h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-[#3c6e71] rounded-full flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && (
                            <span className="text-white text-xs font-bold">
                              {item.count}
                            </span>
                          )}
                        </div>
                      </div>
                      {percentage <= 15 && (
                        <div className="w-12 text-xs font-bold text-[#353535]">
                          {item.count}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTrendsPage;
