"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  ArrowLeft,
  Trophy,
  Award,
  Medal,
  Target,
  Calendar,
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

const TournamentsPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTournamentStats = async () => {
      if (!user?._id) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/profile/${user._id}/tournament-stats`
        );
        setTournamentStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch tournament stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentStats();
  }, [user?._id]);

  const overview = tournamentStats?.overview || {
    totalTournaments: 0,
    tournamentWins: 0,
    finalsReached: 0,
    semifinalsReached: 0,
  };

  const winRate =
    overview.totalTournaments > 0
      ? ((overview.tournamentWins / overview.totalTournaments) * 100).toFixed(1)
      : 0;

  const finalsRate =
    overview.totalTournaments > 0
      ? ((overview.finalsReached / overview.totalTournaments) * 100).toFixed(1)
      : 0;

  // Recent tournaments data
  const recentTournaments = tournamentStats?.recent || [];

  const performanceData = [
    { name: "Wins", value: overview.tournamentWins, color: "#10B981" },
    {
      name: "Finals",
      value: overview.finalsReached - overview.tournamentWins,
      color: "#F59E0B",
    },
    {
      name: "Semifinals",
      value: overview.semifinalsReached - overview.finalsReached,
      color: "#8B5CF6",
    },
    {
      name: "Other",
      value:
        overview.totalTournaments -
        overview.tournamentWins -
        (overview.finalsReached - overview.tournamentWins) -
        (overview.semifinalsReached - overview.finalsReached),
      color: "#6B7280",
    },
  ].filter((item) => item.value > 0);

  const getPlacementBadge = (placement: string) => {
    const placementLower = placement?.toLowerCase() || "";
    if (placementLower.includes("1st") || placementLower.includes("winner")) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
    if (placementLower.includes("2nd") || placementLower.includes("runner")) {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
    if (placementLower.includes("3rd") || placementLower.includes("semi")) {
      return "bg-orange-100 text-orange-700 border-orange-200";
    }
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">
            Tournament History
          </h1>
          <p className="text-gray-600 mt-2">
            Your tournament participation and achievements
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : overview.totalTournaments === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Tournament History
            </h3>
            <p className="text-gray-600">
              Participate in tournaments to track your competitive journey!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Tournaments
                  </h3>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {overview.totalTournaments}
                </p>
                <p className="text-xs text-blue-600 mt-1">Total participated</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-yellow-900">
                    Championships
                  </h3>
                </div>
                <p className="text-3xl font-bold text-yellow-700">
                  {overview.tournamentWins}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {winRate}% win rate
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">
                    Finals
                  </h3>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {overview.finalsReached}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {finalsRate}% of tournaments
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-semibold text-orange-900">
                    Semifinals
                  </h3>
                </div>
                <p className="text-3xl font-bold text-orange-700">
                  {overview.semifinalsReached}
                </p>
                <p className="text-xs text-orange-600 mt-1">Top 4 finishes</p>
              </div>
            </div>

            {/* Performance Distribution */}
            {performanceData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Tournament Performance Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                        {performanceData.map((entry, index) => (
                          <Bar
                            key={`bar-${index}`}
                            dataKey="value"
                            fill={entry.color}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Tournaments */}
            {recentTournaments.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">
                    Recent Tournaments
                  </h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentTournaments.map((tournament: any, index: number) => (
                    <div
                      key={index}
                      onClick={() =>
                        router.push(`/tournaments/${tournament._id}`)
                      }
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <Trophy className="w-6 h-6 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {tournament.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {formatDate(
                                    tournament.startDate || tournament.date
                                  )}
                                </span>
                              </div>
                              {tournament.location && (
                                <span>" {tournament.location}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {tournament.placement && (
                          <div
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getPlacementBadge(
                              tournament.placement
                            )}`}
                          >
                            {tournament.placement}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievement Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Achievement Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">
                    {overview.tournamentWins}
                  </p>
                  <p className="text-sm text-yellow-600">Championships</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Medal className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-700">
                    {overview.finalsReached - overview.tournamentWins}
                  </p>
                  <p className="text-sm text-gray-600">Runner-ups</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700">
                    {overview.semifinalsReached - overview.finalsReached}
                  </p>
                  <p className="text-sm text-orange-600">Semifinal Exits</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
