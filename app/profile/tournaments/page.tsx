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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { EmptyState } from "../components/EmptyState";

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
      : "0";

  const finalsRate =
    overview.totalTournaments > 0
      ? ((overview.finalsReached / overview.totalTournaments) * 100).toFixed(1)
      : "0";

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
      return "bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]";
    }
    if (placementLower.includes("2nd") || placementLower.includes("runner")) {
      return "bg-[#f3f4f6] text-[#374151] border border-[#d1d5db]";
    }
    if (placementLower.includes("3rd") || placementLower.includes("semi")) {
      return "bg-[#fed7aa] text-[#92400e] border border-[#fdba74]";
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

            {/* Performance Distribution */}
            {performanceData.length > 0 && (
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
                  Tournament Performance Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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
                Achievement Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-[#fef9e7] border border-[#e5d598] rounded">
                  <Award className="w-8 h-8 text-[#92400e] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {overview.tournamentWins}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Championships
                  </p>
                </div>

                <div className="text-center p-4 bg-[#f3f4f6] border border-[#d1d5db] rounded">
                  <Medal className="w-8 h-8 text-[#6b7280] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {overview.finalsReached - overview.tournamentWins}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Runner-ups
                  </p>
                </div>

                <div className="text-center p-4 bg-[#fed7aa] border border-[#fdba74] rounded">
                  <Target className="w-8 h-8 text-[#92400e] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-[#353535]">
                    {overview.semifinalsReached - overview.finalsReached}
                  </p>
                  <p className="text-xs text-[#353535] mt-2 font-semibold">
                    Semifinal Exits
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

export default TournamentsPage;
