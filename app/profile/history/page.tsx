"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { History as HistoryIcon, Trophy, Users, Calendar, ChevronRight, MoveLeft, Loader2 } from "lucide-react";
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
    if (type === "team") return <Users className="w-4 h-4" />;
    return <Trophy className="w-4 h-4" />;
  };

  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;

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
            <span>Match History</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Complete history of your recent matches and results
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
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
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Total Matches
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{matches.length}</p>
                <p className="text-xs text-gray-500 mt-1">Recorded matches</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-green-500 tracking-wide">
                    Wins
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{wins}</p>
                <p className="text-xs text-gray-500 mt-1">Victories</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-red-500 tracking-wide">
                    Losses
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{losses}</p>
                <p className="text-xs text-gray-500 mt-1">Defeats</p>
              </div>
            </div>

            {/* Match List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Recent Matches</h3>
              </div>

              <div className="divide-y divide-gray-100">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/matches/${match._id}`)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group border-l-4 ${
                      match.result === "win" ? "border-l-green-500" : "border-l-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Match Info */}
                      <div className="flex items-center gap-3 flex-1">
                        {/* Result Badge */}
                        <div
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            match.result === "win"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {match.result === "win" ? "Win" : "Loss"}
                        </div>

                        {/* Match Type Icon */}
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getMatchTypeIcon(match.type)}
                        </div>

                        {/* Match Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className="font-semibold text-gray-800 text-sm truncate">
                              {match.type === "individual" ? (
                                <span>vs {match.opponent || "Unknown Opponent"}</span>
                              ) : (
                                <span>{match.teams || "Team Match"}</span>
                              )}
                            </h4>
                            {match.matchType && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                                {match.matchType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(match.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5" />
                              <span className="font-semibold text-gray-700">{match.score}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
