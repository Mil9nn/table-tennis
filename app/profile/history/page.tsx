"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { ArrowLeft, Trophy, Users as UsersIcon, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const MatchHistoryPage = () => {
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

  const recentMatches = detailedStats?.recentMatches || [];

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
          <h1 className="text-3xl font-bold text-gray-800">Match History</h1>
          <p className="text-gray-600 mt-2">
            Complete chronological record of all your matches
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Match History Yet
            </h3>
            <p className="text-gray-600">
              Play your first match to start building your match history!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100 mb-6">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{recentMatches.length}</h3>
                  <p className="text-sm text-gray-600">Recent Matches</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">
                    {recentMatches.filter((m: any) => m.result === "win").length}
                  </h3>
                  <p className="text-sm text-gray-600">Wins</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">
                    {recentMatches.filter((m: any) => m.result === "loss").length}
                  </h3>
                  <p className="text-sm text-gray-600">Losses</p>
                </div>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-3">
              {recentMatches.map((match: any, index: number) => (
                <div
                  key={match._id || index}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Win/Loss Badge */}
                        {match.result === "win" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            <TrendingUp className="w-4 h-4" />
                            WIN
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                            <TrendingDown className="w-4 h-4" />
                            LOSS
                          </div>
                        )}

                        {/* Match Type Badge */}
                        {match.type === "individual" ? (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                            {match.matchType?.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                            Team - {match.matchFormat?.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      {/* Opponent/Teams */}
                      <div className="flex items-center gap-2 text-gray-800 mb-1">
                        {match.type === "individual" ? (
                          <>
                            <UsersIcon className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">vs {match.opponent}</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">{match.teams}</span>
                          </>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(match.date), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">{match.score}</div>
                      <p className="text-xs text-gray-500 mt-1">Final Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistoryPage;
