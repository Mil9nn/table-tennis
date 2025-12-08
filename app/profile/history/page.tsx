"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  History as HistoryIcon,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  MoveLeft,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GroupWorkIcon from "@mui/icons-material/GroupWork";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xs sm:text-sm flex items-center gap-2 font-bold text-gray-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 p-1 border-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoveLeft className="size-3 sm:size-4" />
            </button>
            <span>Match History</span>
          </h1>
          <p className="text-[10px] sm:text-xs mt-1.5 text-gray-600">
            Complete history of your recent matches and results
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl px-4 sm:px-6 py-8 sm:py-12 text-center border border-gray-100">
            <HistoryIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">
              No Match History
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Your recent matches will appear here once you start playing!
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-blue-500 tracking-wide mb-1.5 sm:mb-2">
                  Total Matches
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {matches.length}
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-green-500 tracking-wide mb-1.5 sm:mb-2">
                  Wins
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {wins}
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-red-500 tracking-wide mb-1.5 sm:mb-2">
                  Losses
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {losses}
                </p>
              </div>
            </div>

            {/* Match List */}
            <div className="bg-white border border-gray-100 overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-bold text-gray-800">
                  Recent Matches
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/matches/${match._id}`)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group border-l-4 ${
                      match.result === "win"
                        ? "border-l-green-500"
                        : "border-l-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {/* Match Info */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Opponent/Team Avatar */}
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                          {match.type === "individual" ? (
                            match.opponentImage ? (
                              <Image
                                src={match.opponentImage}
                                alt={match.opponent || "Opponent"}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs sm:text-sm">
                                {(match.opponent?.[0] || "?").toUpperCase()}
                              </div>
                            )
                          ) : match.teamLogo ? (
                            <Image
                              src={match.teamLogo}
                              alt={match.teams || "Team"}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <GroupWorkIcon
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              style={{
                                fontSize: "inherit",
                                width: "inherit",
                                height: "inherit",
                              }}
                            />
                          )}
                        </div>

                        {/* Match Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                            <h4 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                              {match.type === "individual" ? (
                                <span>
                                  vs {match.opponent || "Unknown Opponent"}
                                </span>
                              ) : (
                                <span>{match.teams || "Team Match"}</span>
                              )}
                            </h4>
                            {match.matchType && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] sm:text-[10px] rounded">
                                {match.matchType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase()
                                  )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>{formatDate(match.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span className="font-semibold text-gray-700">
                                {match.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
