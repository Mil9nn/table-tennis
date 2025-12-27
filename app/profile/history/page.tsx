"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  History as HistoryIcon,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { EmptyState } from "../components/EmptyState";

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

  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Match History
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="No match history available."
            description="Your recent matches will appear here once you start playing!"
          />
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Total Matches
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {matches.length}
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Wins
                </h3>
                <p className="text-3xl font-bold text-[#353535]">{wins}</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Losses
                </h3>
                <p className="text-3xl font-bold text-[#353535]">{losses}</p>
              </div>
            </div>

            {/* Match List */}
            <div className="space-y-4">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                  Recent Matches
                </h2>
                <p className="text-xs text-[#353535] mt-1">
                  Complete history of your recent matches and results
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9]">
                <div className="divide-y divide-[#d9d9d9]">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/matches/${match._id}`)}
                      className={`px-6 py-4 hover:bg-[#f5f5f5] transition-colors cursor-pointer group border-l-4 ${
                        match.result === "win"
                          ? "border-l-[#10B981]"
                          : "border-l-[#EF4444]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Match Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Opponent/Team Avatar */}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] flex items-center justify-center text-white flex-shrink-0">
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
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] text-white font-bold text-sm">
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
                                className="w-5 h-5"
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-[#353535] text-sm truncate">
                                {match.type === "individual" ? (
                                  <span>
                                    vs {match.opponent || "Unknown Opponent"}
                                  </span>
                                ) : (
                                  <span>{match.teams || "Team Match"}</span>
                                )}
                              </h4>
                              {match.matchType && (
                                <span className="px-2 py-0.5 bg-[#e5e7eb] text-[#353535] text-[9px] rounded font-semibold">
                                  {match.matchType
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l: string) =>
                                      l.toUpperCase()
                                    )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#666666]">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(match.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>•</span>
                                <span className="font-bold text-[#353535]">
                                  {match.score}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Result Badge and Arrow */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`px-3 py-1 rounded font-bold text-xs ${
                              match.result === "win"
                                ? "bg-[#d1f4e6] text-[#065f46]"
                                : "bg-[#fee2e2] text-[#7f1d1d]"
                            }`}
                          >
                            {match.result === "win" ? "Win" : "Loss"}
                          </span>
                          <ChevronRight className="w-5 h-5 text-[#d9d9d9] group-hover:text-[#3c6e71] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistoryPage;
