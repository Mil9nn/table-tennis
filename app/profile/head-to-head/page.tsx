"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Swords, TrendingUp, TrendingDown, Minus, User, MoveLeft, Loader2, ChevronRight } from "lucide-react";
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
    if (wins > losses) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (wins < losses) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getRecordBorderColor = (wins: number, losses: number) => {
    if (wins > losses) return "border-l-green-500";
    if (wins < losses) return "border-l-red-500";
    return "border-l-gray-400";
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-green-600";
    if (winRate >= 40) return "text-gray-700";
    return "text-red-600";
  };

  const fetchMatchHistory = async (opponentId: string) => {
    if (!user?._id) return;
    try {
      setLoadingHistory(true);
      const res = await axiosInstance.get(`/profile/${user._id}/head-to-head/${opponentId}`);
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
  const dominantRecord = headToHead.filter((h) => h.wins > h.losses).length;
  const evenRecord = headToHead.filter((h) => h.wins === h.losses).length;
  const losingRecord = headToHead.filter((h) => h.wins < h.losses).length;

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
            <span>Head to Head</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Your matchup records against individual opponents
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : headToHead.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Head-to-Head Data
            </h3>
            <p className="text-gray-600">
              Play matches to build your head-to-head records!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Total Opponents
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{totalOpponents}</p>
                <p className="text-xs text-gray-500 mt-1">Unique players faced</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-green-500 tracking-wide">
                    Winning Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{dominantRecord}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalOpponents > 0 ? ((dominantRecord / totalOpponents) * 100).toFixed(0) : 0}% of opponents
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 tracking-wide">
                    Even Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{evenRecord}</p>
                <p className="text-xs text-gray-500 mt-1">Tied matchups</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-red-500 tracking-wide">
                    Losing Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{losingRecord}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalOpponents > 0 ? ((losingRecord / totalOpponents) * 100).toFixed(0) : 0}% of opponents
                </p>
              </div>
            </div>

            {/* Matchup List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Opponent Records</h3>
                <p className="text-xs text-gray-500 mt-1">Sorted by most matches played</p>
              </div>

              <div className="divide-y divide-gray-100">
                {headToHead.map((record, index) => (
                  <div
                    key={index}
                    onClick={() => handleOpponentClick(record.opponent)}
                    className={`px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getRecordBorderColor(record.wins, record.losses)}`}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {/* Opponent Info */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {record.opponent.profileImage ? (
                            <Image
                              src={record.opponent.profileImage}
                              alt={record.opponent.fullName || record.opponent.username}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs sm:text-sm">
                              {(record.opponent.fullName?.[0] || record.opponent.username?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name and username */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                            {record.opponent.fullName || record.opponent.username}
                          </h4>
                          {record.opponent.fullName && (
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">@{record.opponent.username}</p>
                          )}
                        </div>

                        {/* Record Icon - hidden on very small screens */}
                        <div className="hidden sm:block flex-shrink-0">{getRecordIcon(record.wins, record.losses)}</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 sm:gap-3 text-right flex-shrink-0">
                        <div className="hidden sm:block">
                          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide">Record</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-800">
                            {record.wins}-{record.losses}
                          </p>
                        </div>
                        <div className="sm:hidden">
                          <p className="text-xs font-bold text-gray-800">
                            {record.wins}-{record.losses}
                          </p>
                        </div>

                        <div className="min-w-[45px] sm:min-w-[60px] hidden sm:block">
                          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide">Win Rate</p>
                          <p className={`text-xs sm:text-sm font-bold ${getWinRateColor(parseFloat(record.winRate))}`}>
                            {record.winRate}%
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide hidden sm:block">Matches</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-800">{record.total}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Head-to-Head Match History Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
            {selectedOpponent && (
              <>
                <DialogHeader className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    {selectedOpponent.profileImage ? (
                      <Image
                        src={selectedOpponent.profileImage}
                        alt={selectedOpponent.fullName || selectedOpponent.username}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {(selectedOpponent.fullName?.[0] || selectedOpponent.username?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        {selectedOpponent.fullName || selectedOpponent.username}
                      </DialogTitle>
                      <p className="text-sm text-gray-500">@{selectedOpponent.username}</p>
                    </div>
                  </div>
                </DialogHeader>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      <p className="text-sm text-gray-500">Loading match history...</p>
                    </div>
                  </div>
                ) : matchHistory.length > 0 ? (
                  <div className="flex flex-col overflow-hidden">
                    {/* Summary Stats */}
                    {(() => {
                      const wins = matchHistory.filter((m) => m.result === "win").length;
                      const losses = matchHistory.filter((m) => m.result === "loss").length;
                      const total = wins + losses;
                      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                      const isWinning = wins > losses;

                      return (
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                Head-to-Head Record
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 font-mono text-xl">
                                  <span className={`font-bold ${isWinning ? 'text-green-600' : 'text-gray-600'}`}>
                                    {wins}
                                  </span>
                                  <span className="text-gray-300">-</span>
                                  <span className={`font-bold ${!isWinning && losses > wins ? 'text-red-600' : 'text-gray-600'}`}>
                                    {losses}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">({winRate}% win rate)</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{total} total matches</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Match List */}
                    <div className="overflow-y-auto flex-1">
                      <div className="divide-y divide-gray-100">
                        {matchHistory.map((match: any, i: number) => (
                          <Link
                            key={i}
                            href={`/matches/${match.matchId}`}
                            className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors group"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              match.result === 'win' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {match.result === 'win' ? 'W' : 'L'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {match.matchType?.replace('_', ' ')}
                                </p>
                                {match.tournament && (
                                  <span className="text-xs text-gray-500">• {match.tournament.name}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {match.date ? new Date(match.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : ''}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="text-sm font-mono font-medium text-gray-700">
                                  {match.score || '—'}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <Swords className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Matches Found</h3>
                    <p className="text-sm text-gray-500 text-center">
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
