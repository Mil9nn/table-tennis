"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Trophy, Award, Medal, Target, Calendar, MoveLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateShort } from "@/lib/utils";
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
        const response = await axiosInstance.get(`/profile/${user._id}/tournament-stats`);
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

  const recentTournaments = tournamentStats?.recent || [];

  const performanceData = [
    { name: "Wins", value: overview.tournamentWins, color: "#10B981" },
    { name: "Finals", value: overview.finalsReached - overview.tournamentWins, color: "#F59E0B" },
    { name: "Semifinals", value: overview.semifinalsReached - overview.finalsReached, color: "#8B5CF6" },
    { name: "Other", value: overview.totalTournaments - overview.semifinalsReached, color: "#6B7280" },
  ].filter((item) => item.value > 0);

  const getPlacementBadge = (placement: string) => {
    const placementLower = placement?.toLowerCase() || "";
    if (placementLower.includes("1st") || placementLower.includes("winner")) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
    if (placementLower.includes("2nd") || placementLower.includes("runner")) {
      return "bg-gray-50 text-gray-700 border-gray-200";
    }
    if (placementLower.includes("3rd") || placementLower.includes("semi")) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

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
            <span>Tournament History</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Your tournament participation and achievements
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
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
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Tournaments
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{overview.totalTournaments}</p>
                <p className="text-xs text-gray-500 mt-1">Total participated</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-yellow-500 tracking-wide">
                    Championships
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{overview.tournamentWins}</p>
                <p className="text-xs text-gray-500 mt-1">{winRate}% win rate</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-purple-500 tracking-wide">
                    Finals Reached
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{overview.finalsReached}</p>
                <p className="text-xs text-gray-500 mt-1">{finalsRate}% of tournaments</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-orange-500 tracking-wide">
                    Semifinals
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{overview.semifinalsReached}</p>
                <p className="text-xs text-gray-500 mt-1">Top 4 finishes</p>
              </div>
            </div>

            {/* Performance Distribution */}
            {performanceData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  Tournament Performance Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <h3 className="text-lg font-bold text-gray-800">Recent Tournaments</h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentTournaments.map((tournament: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/tournaments/${tournament._id}`)}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2.5 bg-blue-50 rounded-lg">
                            <Trophy className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {tournament.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDateShort(tournament.startDate || tournament.date)}</span>
                              </div>
                              {tournament.location && <span>• {tournament.location}</span>}
                            </div>
                          </div>
                        </div>

                        {tournament.placement && (
                          <div
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPlacementBadge(tournament.placement)}`}
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Achievement Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <Award className="w-7 h-7 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">{overview.tournamentWins}</p>
                  <p className="text-xs text-yellow-600">Championships</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Medal className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-700">
                    {overview.finalsReached - overview.tournamentWins}
                  </p>
                  <p className="text-xs text-gray-600">Runner-ups</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <Target className="w-7 h-7 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700">
                    {overview.semifinalsReached - overview.finalsReached}
                  </p>
                  <p className="text-xs text-orange-600">Semifinal Exits</p>
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
