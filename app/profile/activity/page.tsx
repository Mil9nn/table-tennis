"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Calendar as CalendarIcon, TrendingUp, Activity as ActivityIcon, MoveLeft, Loader2 } from "lucide-react";
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
            <span>Activity & Trends</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Track your playing activity over time and identify patterns
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
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
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-pink-500 tracking-wide">
                    Total Matches
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{totalMatches}</p>
                <p className="text-xs text-gray-500 mt-1">Across {monthlyActivity.length} months</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-purple-500 tracking-wide">
                    Avg Per Month
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{avgPerMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Matches per month</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-amber-500 tracking-wide">
                    Peak Month
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{peakMonth?.count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {peakMonth?.month
                    ? new Date(peakMonth.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                Monthly Match Activity
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
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
                    <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Matches" />
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
                {monthlyActivity
                  .slice()
                  .reverse()
                  .map((item: any, index: number) => {
                    const percentage = totalMatches > 0 ? (item.count / totalMatches) * 100 : 0;
                    const date = new Date(item.month);
                    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-medium text-gray-600">{monthName}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            {percentage > 20 && (
                              <span className="text-white text-[10px] font-bold">{item.count}</span>
                            )}
                          </div>
                        </div>
                        {percentage <= 20 && (
                          <div className="w-8 text-xs font-semibold text-gray-700">{item.count}</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Activity Insight */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-900">Activity Insight</h3>
              </div>
              <p className="text-xs text-purple-700">
                {monthlyActivity.length >= 2 ? (
                  <>
                    {monthlyActivity[monthlyActivity.length - 1]?.count >
                    monthlyActivity[monthlyActivity.length - 2]?.count
                      ? "Your activity is trending up! Keep up the momentum."
                      : monthlyActivity[monthlyActivity.length - 1]?.count <
                        monthlyActivity[monthlyActivity.length - 2]?.count
                      ? "Your activity has decreased recently. Consider scheduling more matches."
                      : "Your activity has been consistent. Great job maintaining your routine!"}
                  </>
                ) : (
                  "Keep playing to see trends in your activity over time!"
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTrendsPage;
