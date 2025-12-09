"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, Activity as ActivityIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ActivityTrendsPage = () => {
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
  const totalMatches = monthlyActivity.reduce((sum: number, m: any) => sum + m.count, 0);
  const avgPerMonth = monthlyActivity.length > 0 ? (totalMatches / monthlyActivity.length).toFixed(1) : 0;
  const peakMonth = monthlyActivity.length > 0
    ? monthlyActivity.reduce((max: any, m: any) => m.count > max.count ? m : max, monthlyActivity[0])
    : null;

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
          <h1 className="text-3xl font-bold text-gray-800">Activity & Trends</h1>
          <p className="text-gray-600 mt-2">
            Track your playing activity over time and identify performance patterns
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : monthlyActivity.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Activity Data Yet
            </h3>
            <p className="text-gray-600">
              Play matches to start tracking your activity trends over time!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-5 h-5 text-pink-600" />
                  <h3 className="text-sm font-semibold text-pink-900">Total Matches</h3>
                </div>
                <p className="text-3xl font-bold text-pink-700">{totalMatches}</p>
                <p className="text-xs text-pink-600 mt-1">Across {monthlyActivity.length} months</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Average Per Month</h3>
                </div>
                <p className="text-3xl font-bold text-purple-700">{avgPerMonth}</p>
                <p className="text-xs text-purple-600 mt-1">Matches per month</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <ActivityIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-900">Peak Month</h3>
                </div>
                <p className="text-3xl font-bold text-amber-700">{peakMonth?.count || 0}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {peakMonth?.month ? new Date(peakMonth.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A"}
                </p>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                Monthly Match Activity
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                      }}
                    />
                    <YAxis width={40} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      }}
                      formatter={(value: any) => [`${value} matches`, "Total"]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8B5CF6"
                      radius={[8, 8, 0, 0]}
                      name="Matches"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Monthly Breakdown
              </h3>
              <div className="space-y-2">
                {monthlyActivity.slice().reverse().map((item: any, index: number) => {
                  const percentage = (item.count / totalMatches) * 100;
                  const date = new Date(item.month);
                  const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gray-700">
                        {monthName}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && (
                            <span className="text-white text-xs font-bold">{item.count}</span>
                          )}
                        </div>
                      </div>
                      {percentage <= 15 && (
                        <div className="w-12 text-sm font-semibold text-gray-700">
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
