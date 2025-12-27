"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "../components/EmptyState";

const HeadToHeadPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [headToHead, setHeadToHead] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchHeadToHead = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setHeadToHead(response.data.stats.headToHead || []);
      } catch (error) {
        console.error("Failed to fetch head to head:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadToHead();
  }, []);

  const getRecordIcon = (wins: number, losses: number) => {
    if (wins > losses)
      return <TrendingUp className="w-4 h-4 text-[#10B981]" />;
    if (wins < losses)
      return <TrendingDown className="w-4 h-4 text-[#EF4444]" />;
    return <Minus className="w-4 h-4 text-[#6b7280]" />;
  };

  const getRecordBorderColor = (wins: number, losses: number) => {
    if (wins > losses) return "border-l-[#10B981]";
    if (wins < losses) return "border-l-[#EF4444]";
    return "border-l-[#d9d9d9]";
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-[#10B981]";
    if (winRate >= 40) return "text-[#353535]";
    return "text-[#EF4444]";
  };

  const fetchMatchHistory = async (opponentId: string) => {
    if (!user?._id) return;
    try {
      setLoadingHistory(true);
      const res = await axiosInstance.get(
        `/profile/${user._id}/head-to-head/${opponentId}`
      );
      if (res.data.success) {
        setMatchHistory(res.data.matches);
      }
    } catch (err) {
      console.error("Error fetching match history:", err);
      setMatchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpponentClick = (opponent: any) => {
    setSelectedOpponent(opponent);
    setIsModalOpen(true);
    fetchMatchHistory(opponent._id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOpponent(null);
    setMatchHistory([]);
  };

  // Calculate summary stats
  const totalOpponents = headToHead.length;
  const dominantRecord = headToHead.filter(
    (h) => h.wins > h.losses
  ).length;
  const evenRecord = headToHead.filter((h) => h.wins === h.losses).length;
  const losingRecord = headToHead.filter((h) => h.wins < h.losses).length;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Head to Head
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : headToHead.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="No head-to-head data available."
            description="Play matches to build your head-to-head records!"
          />
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Total Opponents
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {totalOpponents}
                </p>
                <p className="text-xs text-[#353535] mt-3">Unique players faced</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Winning Records
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {dominantRecord}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {totalOpponents > 0
                    ? ((dominantRecord / totalOpponents) * 100).toFixed(0)
                    : 0}
                  % of opponents
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Even Records
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {evenRecord}
                </p>
                <p className="text-xs text-[#353535] mt-3">Tied matchups</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Losing Records
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {losingRecord}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  {totalOpponents > 0
                    ? ((losingRecord / totalOpponents) * 100).toFixed(0)
                    : 0}
                  % of opponents
                </p>
              </div>
            </div>

            {/* Matchup List */}
            <div className="space-y-4">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                  Opponent Records
                </h2>
                <p className="text-xs text-[#353535] mt-1">
                  Sorted by most matches played
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9]">
                <div className="divide-y divide-[#d9d9d9]">
                  {headToHead.map((record, index) => (
                    <div
                      key={index}
                      onClick={() => handleOpponentClick(record.opponent)}
                      className={`px-6 py-4 hover:bg-[#f5f5f5] transition-colors cursor-pointer border-l-4 ${getRecordBorderColor(
                        record.wins,
                        record.losses
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Opponent Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#d9d9d9] flex-shrink-0">
                            {record.opponent.profileImage ? (
                              <Image
                                src={record.opponent.profileImage}
                                alt={
                                  record.opponent.fullName ||
                                  record.opponent.username
                                }
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] text-white font-bold text-sm">
                                {(
                                  record.opponent.fullName?.[0] ||
                                  record.opponent.username?.[0] ||
                                  "?"
                                ).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Name and username */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#353535] text-sm truncate">
                              {record.opponent.fullName ||
                                record.opponent.username}
                            </h4>
                            {record.opponent.fullName && (
                              <p className="text-xs text-[#666666] truncate">
                                @{record.opponent.username}
                              </p>
                            )}
                          </div>

                          {/* Record Icon */}
                          <div className="flex-shrink-0">
                            {getRecordIcon(record.wins, record.losses)}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-right flex-shrink-0">
                          <div>
                            <p className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">
                              Record
                            </p>
                            <p className="text-sm font-bold text-[#353535]">
                              {record.wins}-{record.losses}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">
                              Win Rate
                            </p>
                            <p
                              className={`text-sm font-bold ${getWinRateColor(
                                parseFloat(record.winRate)
                              )}`}
                            >
                              {record.winRate}%
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">
                              Matches
                            </p>
                            <p className="text-sm font-bold text-[#353535]">
                              {record.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Head-to-Head Match History Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
            {selectedOpponent && (
              <>
                <DialogHeader className="px-6 py-4 border-b border-[#d9d9d9]">
                  <div className="flex items-center gap-4">
                    {selectedOpponent.profileImage ? (
                      <Image
                        src={selectedOpponent.profileImage}
                        alt={
                          selectedOpponent.fullName ||
                          selectedOpponent.username
                        }
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#d9d9d9]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] flex items-center justify-center text-white font-bold">
                        {(
                          selectedOpponent.fullName?.[0] ||
                          selectedOpponent.username?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <DialogTitle className="text-lg font-bold text-[#353535]">
                        {selectedOpponent.fullName ||
                          selectedOpponent.username}
                      </DialogTitle>
                      <p className="text-sm text-[#666666]">
                        @{selectedOpponent.username}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3c6e71]" />
                      <p className="text-sm text-[#666666]">
                        Loading match history...
                      </p>
                    </div>
                  </div>
                ) : matchHistory.length > 0 ? (
                  <div className="flex flex-col overflow-hidden">
                    {/* Summary Stats */}
                    {(() => {
                      const wins = matchHistory.filter(
                        (m) => m.result === "win"
                      ).length;
                      const losses = matchHistory.filter(
                        (m) => m.result === "loss"
                      ).length;
                      const total = wins + losses;
                      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                      const isWinning = wins > losses;

                      return (
                        <div className="px-6 py-4 bg-[#f5f5f5] border-b border-[#d9d9d9]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                                Head-to-Head Record
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 font-mono text-xl">
                                  <span
                                    className={`font-bold ${
                                      isWinning
                                        ? "text-[#10B981]"
                                        : "text-[#353535]"
                                    }`}
                                  >
                                    {wins}
                                  </span>
                                  <span className="text-[#d9d9d9]">-</span>
                                  <span
                                    className={`font-bold ${
                                      !isWinning && losses > wins
                                        ? "text-[#EF4444]"
                                        : "text-[#353535]"
                                    }`}
                                  >
                                    {losses}
                                  </span>
                                </div>
                                <span className="text-sm text-[#666666]">
                                  ({winRate}% win rate)
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-[#666666]">
                              {total} total matches
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Match List */}
                    <div className="overflow-y-auto flex-1">
                      <div className="divide-y divide-[#d9d9d9]">
                        {matchHistory.map((match: any, i: number) => (
                          <Link
                            key={i}
                            href={`/matches/${match.matchId}`}
                            className="px-6 py-3 flex items-center gap-4 hover:bg-[#f5f5f5] transition-colors group"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                match.result === "win"
                                  ? "bg-[#d1f4e6] text-[#065f46]"
                                  : "bg-[#fee2e2] text-[#7f1d1d]"
                              }`}
                            >
                              {match.result === "win" ? "W" : "L"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-[#353535] capitalize">
                                  {match.matchType?.replace("_", " ")}
                                </p>
                                {match.tournament && (
                                  <span className="text-xs text-[#666666]">
                                    • {match.tournament.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#666666]">
                                {match.date
                                  ? new Date(match.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : ""}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="text-sm font-mono font-bold text-[#353535]">
                                  {match.score || "—"}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#d9d9d9] group-hover:text-[#3c6e71] transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <Swords className="w-12 h-12 text-[#d9d9d9] mb-4" />
                    <h3 className="text-lg font-bold text-[#353535] mb-1">
                      No Matches Found
                    </h3>
                    <p className="text-sm text-[#666666] text-center">
                      No completed matches found between you and this player.
                    </p>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HeadToHeadPage;
