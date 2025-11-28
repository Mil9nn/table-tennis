"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  ArrowLeft,
  History as HistoryIcon,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const MatchHistoryPage = () => {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMatchHistory = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setMatches(response.data.stats.recentMatches || []);
      } catch (error) {
        console.error("Failed to fetch match history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const getMatchTypeIcon = (type: string) => {
    if (type === "team") {
      return <Users className="w-5 h-5" />;
    }
    return <Trophy className="w-5 h-5" />;
  };

  const getResultColor = (result: string) => {
    return result === "win"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";
  };

  const getResultBadgeColor = (result: string) => {
    return result === "win"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200";
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
          <h1 className="text-3xl font-bold text-gray-800">Match History</h1>
          <p className="text-gray-600 mt-2">
            Complete history of your recent matches and results
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Match History
            </h3>
            <p className="text-gray-600">
              Your recent matches will appear here once you start playing!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <HistoryIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Total Matches
                  </h3>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {matches.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">Recorded matches</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Wins</h3>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {matches.filter((m) => m.result === "win").length}
                </p>
                <p className="text-xs text-green-600 mt-1">Victories</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">Losses</h3>
                </div>
                <p className="text-3xl font-bold text-red-700">
                  {matches.filter((m) => m.result === "loss").length}
                </p>
                <p className="text-xs text-red-600 mt-1">Defeats</p>
              </div>
            </div>

            {/* Match List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Recent Matches
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/matches/${match._id}`)}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Match Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Result Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getResultBadgeColor(
                            match.result
                          )}`}
                        >
                          {match.result === "win" ? "WIN" : "LOSS"}
                        </div>

                        {/* Match Type Icon */}
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getMatchTypeIcon(match.type)}
                        </div>

                        {/* Match Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">
                              {match.type === "individual" ? (
                                <span>
                                  vs{" "}
                                  {match.opponent ||
                                    "Unknown Opponent"}
                                </span>
                              ) : (
                                <span>{match.teams || "Team Match"}</span>
                              )}
                            </h4>
                            {match.matchType && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {match.matchType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase()
                                  )}
                              </span>
                            )}
                            {match.matchFormat && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {match.matchFormat
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase()
                                  )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(match.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              <span className="font-semibold text-gray-700">
                                {match.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistoryPage;
