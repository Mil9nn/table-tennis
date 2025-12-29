"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  History as HistoryIcon,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { EmptyState } from "../components/EmptyState";

interface MatchHistoryPageProps {
  userId?: string;
}

const MatchHistoryPage = ({ userId }: MatchHistoryPageProps) => {
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
      <div className="max-w-6xl mx-auto py-8">
        {/* Page Title */}
        <div className="mb-8 px-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-4">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Total Matches
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {matches.length}
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Wins
                </h3>
                <p className="text-3xl font-bold text-[#353535]">{wins}</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Losses
                </h3>
                <p className="text-3xl font-bold text-[#353535]">{losses}</p>
              </div>
            </div>

            {/* Match List */}
            <div className="space-y-4">
              <div className="px-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                  Recent Matches
                </h2>
                <p className="text-xs text-[#353535] mt-1">
                  Complete history of your recent matches and results
                </p>
              </div>

              <section className="grid grid-cols-1 gap-px bg-[#d9d9d9]">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/matches/${match._id}`)}
                    className="group block border border-[#d9d9d9] bg-[#ffffff] p-3 px-4 transition-colors hover:bg-[#3c6e71]"
                  >
                    {/* Line 1: Opponent, Score, Result */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                      {/* Opponent Avatar + Name */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] flex items-center justify-center text-white flex-shrink-0">
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
                        <span
                          className={`font-medium text-sm transition-colors group-hover:text-[#ffffff] ${
                            match.result === "win"
                              ? "text-green-600 group-hover:text-green-200"
                              : "text-gray-800"
                          }`}
                        >
                          {match.type === "individual"
                            ? `${match.opponent || "Unknown"}`
                            : match.teams || "Team Match"}
                        </span>
                      </div>

                      {/* Score */}
                      <span className="text-xs font-bold text-gray-700 px-1.5 py-0.5 rounded transition-colors group-hover:text-[#ffffff] shrink-0">
                        {match.score}
                      </span>
                    </div>

                    {/* Line 2: Meta info */}
                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
                      <span className="capitalize">
                        {match.matchType?.replace(/_/g, " ")}
                      </span>
                      <span>•</span>
                      <span>{formatDate(match.date)}</span>
                      {match.city && (
                        <>
                          <span>•</span>
                          <span>{match.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistoryPage;
