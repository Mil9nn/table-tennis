"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  Trophy,
  Award,
  Medal,
  Target,
  Calendar,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../components/EmptyState";

const TournamentsPage = ({ userId }: { userId?: string }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Use provided userId or fall back to current user
  const targetUserId = userId || user?._id;

  useEffect(() => {
    const fetchTournamentStats = async () => {
      if (!targetUserId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/profile/${targetUserId}/tournament-stats`
        );
        setTournamentStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch tournament stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentStats();
  }, [targetUserId]);

  const overview = tournamentStats?.overview || {
    totalTournaments: 0,
    tournamentWins: 0,
    finalsReached: 0,
    semifinalsReached: 0,
  };

  const winRate =
    overview.totalTournaments > 0
      ? (((overview.tournamentWins || 0) / overview.totalTournaments) * 100).toFixed(1)
      : "0";

  const finalsRate =
    overview.totalTournaments > 0
      ? (((overview.finalsReached || 0) / overview.totalTournaments) * 100).toFixed(1)
      : "0";

  // Recent tournaments data
  const recentTournaments = tournamentStats?.recent || [];

  const getPlacementBadge = (placement: string) => {
    const placementLower = placement?.toLowerCase() || "";
    if (placementLower.includes("1st") || placementLower.includes("winner") || placementLower.includes("gold")) {
      return "bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]"; // Gold
    }
    if (placementLower.includes("2nd") || placementLower.includes("runner") || placementLower.includes("silver")) {
      return "bg-[#f3f4f6] text-[#374151] border border-[#d1d5db]"; // Silver
    }
    if (placementLower.includes("3rd") || placementLower.includes("semi") || placementLower.includes("bronze")) {
      return "bg-[#fed7aa] text-[#92400e] border border-[#fdba74]"; // Bronze
    }
    return "bg-[#e0f2fe] text-[#0c4a6e] border border-[#7dd3fc]";
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
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Tournament History
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : overview.totalTournaments === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No tournament history available."
            description="Tournament statistics will appear after tournaments are played!"
          />
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Tournaments */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Tournaments Played
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {overview.totalTournaments}
                </p>
              </div>

              {/* Championships */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Championships Won
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {overview.tournamentWins}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {winRate}% win rate
                </p>
              </div>

              {/* Finals Reached */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Finals Reached
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {overview.finalsReached}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {finalsRate}% of tournaments
                </p>
              </div>

              {/* Semifinals Reached */}
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Semifinals Reached
                </h3>
                <p className="text-4xl font-bold text-[#353535]">
                  {overview.semifinalsReached}
                </p>
                <p className="text-xs text-[#353535] mt-3">Top 4 finishes</p>
              </div>
            </div>

            {/* Recent Tournaments */}
            {recentTournaments.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                    Recent Tournaments
                  </h2>
                  <p className="text-xs text-[#353535] mt-1">
                    Your recent tournament participation
                  </p>
                </div>

                <div className="bg-[#ffffff] border border-[#d9d9d9]">
                  <div className="divide-y divide-[#d9d9d9]">
                    {recentTournaments.map((tournament: any, index: number) => (
                      <div
                        key={index}
                        onClick={() =>
                          router.push(`/tournaments/${tournament._id}`)
                        }
                        className="p-6 hover:bg-[#f5f5f5] transition-colors cursor-pointer border-b border-[#d9d9d9] last:border-0"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-[#f0f9ff] rounded">
                              <Trophy className="w-5 h-5 text-[#3c6e71]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#353535] truncate">
                                {tournament.name}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-[#666666]">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {formatDate(
                                      tournament.startDate || tournament.date
                                    )}
                                  </span>
                                </div>
                                {tournament.location && (
                                  <span>{tournament.location}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {tournament.placement && (
                            <div
                              className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${getPlacementBadge(
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
              </div>
            )}

            {/* Achievement Summary */}
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                Medal Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-[#fef9e7] border border-[#e5d598] rounded">
                  <Medal className="w-8 h-8 text-[#fbbf24] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {overview.tournamentWins || 0}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Gold Medals
                  </p>
                </div>

                <div className="text-center p-4 bg-[#f3f4f6] border border-[#d1d5db] rounded">
                  <Medal className="w-8 h-8 text-[#9ca3af] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {Math.max(0, (overview.finalsReached || 0) - (overview.tournamentWins || 0))}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Silver Medals
                  </p>
                </div>

                <div className="text-center p-4 bg-[#fed7aa] border border-[#fdba74] rounded">
                  <Medal className="w-8 h-8 text-[#d97706] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {Math.max(0, (overview.semifinalsReached || 0) - (overview.finalsReached || 0))}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Bronze Medals
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export as both default and named export for flexibility
export default TournamentsPage;
export { TournamentsPage };
