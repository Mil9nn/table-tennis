"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn, getAvatarFallbackStyle } from "@/lib/utils";
import type { PlayerStats, FormatSpecificStats } from "../types";
import {
  LeaderboardEmpty,
  LeaderboardLoading,
  RankBadge,
  StreakBadge,
} from "./shared";
import { getDisplayName, getInitials } from "../utils";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

interface PlayerLeaderboardProps {
  data: PlayerStats[];
  loading: boolean;
  emptyMessage: string;
  matchType: "singles" | "doubles" | "all";
  currentUserId?: string;
}

// Using shared RankBadge and StreakBadge components

const PlayerRow = ({
  entry,
  isTopThree,
  isCurrentUser,
  onClick,
}: {
  entry: PlayerStats;
  isTopThree: boolean;
  isCurrentUser: boolean;
  onClick: () => void;
}) => {
  const isRank1 = entry.rank === 1;
  const isRank2or3 = entry.rank === 2 || entry.rank === 3;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:shadow-sm"
      style={{
        backgroundColor: isCurrentUser
          ? "rgba(60, 110, 113, 0.05)"
          : isRank1
          ? "rgba(60, 110, 113, 0.03)"
          : "#ffffff",
        borderLeft: isRank1
          ? "4px solid #3c6e71"
          : isRank2or3
          ? "4px solid #d9d9d9"
          : "4px solid transparent",
        paddingTop: "18px",
        paddingBottom: "18px",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = "#3c6e71";
        e.currentTarget.style.backgroundColor = "rgba(60, 110, 113, 0.02)";
      }}
      onMouseLeave={(e) => {
        const originalBorderColor =
          isCurrentUser || isRank1
            ? "#3c6e71"
            : isRank2or3
            ? "#d9d9d9"
            : "transparent";
        const originalBgColor = isCurrentUser
          ? "rgba(60, 110, 113, 0.05)"
          : isRank1
          ? "rgba(60, 110, 113, 0.03)"
          : "#ffffff";
        e.currentTarget.style.borderLeftColor = originalBorderColor;
        e.currentTarget.style.backgroundColor = originalBgColor;
      }}
    >
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank} />

        <Link
          href={`/profile/${entry.player._id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            className="h-12 w-12 transition-all"
            style={
              isTopThree
                ? {
                    borderWidth: isRank1 ? "2.5px" : "1.5px",
                    borderColor: isRank1 ? "#3c6e71" : "#d9d9d9",
                    borderStyle: "solid",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = "2px";
                e.currentTarget.style.borderColor = "#3c6e71";
              }
            }}
            onMouseLeave={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = isRank1 ? "2.5px" : "1.5px";
                e.currentTarget.style.borderColor = isRank1
                  ? "#3c6e71"
                  : "#d9d9d9";
              }
            }}
          >
            <AvatarImage src={entry.player.profileImage} />
            <AvatarFallback style={getAvatarFallbackStyle(entry.player._id)}>
              {getInitials(getDisplayName(entry.player))}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-[#353535]">
                {getDisplayName(entry.player)}
              </p>
              {entry.stats.currentStreak !== 0 && (
                <StreakBadge streak={entry.stats.currentStreak} />
              )}
            </div>
            <div>
              <span className="text-xs text-[#353535]">
                Winrate: <span className="font-semibold" style={{ color: "#3c6e71" }}>{entry.stats.winRate}%</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.wins}</strong>
              <span className="text-[#a8a8a8] font-medium"> wins</span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.losses}</strong>
              <span className="text-[#a8a8a8] font-medium"> losses</span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.setsWon}</strong>
              <span className="text-[#a8a8a8] font-medium">
                <span className="hidden sm:inline">sets won</span>
                <span className="sm:hidden">sw</span>
              </span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.setsLost}</strong>
              <span className="text-[#a8a8a8] font-medium">
                <span className="hidden sm:inline">sets lost</span>
                <span className="sm:hidden">sl</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerStatsModal = ({
  player,
  matchType,
  onClose,
}: {
  player: PlayerStats | null;
  matchType: "singles" | "doubles" | "all";
  onClose: () => void;
}) => {
  const [detailedStats, setDetailedStats] =
    useState<FormatSpecificStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player) {
      setDetailedStats(null);
      return;
    }

    // Fetch format-specific stats
    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        // If matchType is "all", default to "singles" for the stats API
        const typeParam = matchType === "all" ? "singles" : matchType;
        const { data } = await axiosInstance.get(
          `/leaderboard/player/${player.player._id}/stats?type=${typeParam}`
        );
        setDetailedStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
        setDetailedStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [player, matchType]);

  if (!player) return null;

  const stats = player.stats;
  const totalGames = detailedStats?.totalMatches ?? (stats.wins + stats.losses);

  // Use detailedStats if available, fallback to 0
  const pointsFor = detailedStats?.points.totalScored ?? 0;
  const pointsAgainst = detailedStats?.points.totalConceded ?? 0;
  const pointsDiff = detailedStats?.points.differential ?? 0;
  const gameDiff = stats.wins - stats.losses;
  const setDiff = stats.setsWon - stats.setsLost;

  // Calculate additional stats if available
  const avgPointsPerGame = detailedStats
    ? detailedStats.points.avgPerSet.toFixed(1)
    : "0.0";
  const avgPointsAgainst = detailedStats
    ? detailedStats.points.avgConcededPerSet.toFixed(1)
    : "0.0";

  // Show loading state while fetching detailed stats
  const showPointsLoading = loading && !detailedStats;

  return (
    <Dialog open={!!player} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] md:w-full p-0 border-0 overflow-hidden" showCloseButton={false}>
        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Modern Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Avatar with enhanced styling */}
            <div className="relative">
              <Avatar
                className="h-20 w-20 md:h-24 md:w-24 ring-2 ring-white/20 ring-offset-4 ring-offset-transparent shadow-2xl"
              >
                <AvatarImage
                  src={player.player.profileImage}
                  alt={getDisplayName(player.player)}
                />
                <AvatarFallback
                  className="text-2xl font-bold text-white bg-gradient-to-br from-slate-600 to-slate-700"
                  style={getAvatarFallbackStyle(player.player._id)}
                >
                  {getInitials(getDisplayName(player.player))}
                </AvatarFallback>
              </Avatar>
              
              {/* Rank Badge */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full px-2 py-1 md:px-3 md:py-1.5 shadow-lg border-2 border-white">
                <span className="text-xs md:text-sm font-bold">{player.rank}</span>
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <DialogTitle className="text-lg md:text-xl font-bold text-white mb-1">
                {getDisplayName(player.player)}
              </DialogTitle>
              <p className="text-slate-300 text-xs md:text-sm font-medium mb-2">
                @{player.player.username}
              </p>
              
              {/* Win Rate Display */}
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 md:px-3 md:py-2 inline-flex">
                <span className="text-slate-300 text-xs md:text-sm font-medium">Win Rate</span>
                <span className="text-lg md:text-xl font-bold text-white">{stats.winRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-2 overflow-y-auto max-h-[calc(90vh-250px)] md:max-h-[calc(90vh-200px)] space-y-6">
          {/* Current Streak */}
          {stats.currentStreak !== 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs md:text-sm font-semibold text-slate-700 mb-1">Current Streak</h4>
                  <p className="text-xs text-slate-500">Active performance trend</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg md:text-xl font-bold ${
                    stats.currentStreak > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {Math.abs(stats.currentStreak)}
                  </span>
                  <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold ${
                    stats.currentStreak > 0 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-rose-100 text-rose-700 border border-rose-200"
                  }`}>
                    {stats.currentStreak > 0 ? "WINS" : "LOSSES"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/60">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Performance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.wins}</div>
                    <div className="text-xs text-slate-500 font-medium">WINS</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-slate-900">{totalGames}</div>
                    <div className="text-xs text-slate-500 font-medium">TOTAL</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-rose-600">{stats.losses}</div>
                    <div className="text-xs text-slate-500 font-medium">LOSSES</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    {totalGames > 0 ? (
                      <>
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                          style={{ width: `${(stats.wins / totalGames) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                          style={{ width: `${(stats.losses / totalGames) * 100}%` }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-slate-200" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Match Distribution */}
            {detailedStats?.distribution && (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/60">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Match Types</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-blue-600">{detailedStats.distribution.individual}</div>
                      <div className="text-xs text-slate-500 font-medium">INDIVIDUAL</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-slate-900">{detailedStats.distribution.team}</div>
                      <div className="text-xs text-slate-500 font-medium">TEAM</div>
                    </div>
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-rose-600">{detailedStats.distribution.tournament}</div>
                      <div className="text-xs text-slate-500 font-medium">TOURNAMENT</div>
                    </div>
                  </div>
                  
                  {/* Distribution Progress Bar */}
                  <div className="relative">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {totalGames > 0 ? (
                        <>
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                            style={{ width: `${(detailedStats.distribution.individual / totalGames) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                            style={{ width: `${(detailedStats.distribution.team / totalGames) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                            style={{ width: `${(detailedStats.distribution.tournament / totalGames) * 100}%` }}
                          />
                        </>
                      ) : (
                        <div className="h-full w-full bg-slate-200" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Set Statistics */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/60">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Set Performance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.setsWon}</div>
                    <div className="text-xs text-slate-500 font-medium">WON</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-slate-900">{stats.setsWon + stats.setsLost}</div>
                    <div className="text-xs text-slate-500 font-medium">TOTAL</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-rose-600">{stats.setsLost}</div>
                    <div className="text-xs text-slate-500 font-medium">LOST</div>
                  </div>
                </div>
                
                {/* Set Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    {stats.setsWon + stats.setsLost > 0 ? (
                      <>
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                          style={{ width: `${(stats.setsWon / (stats.setsWon + stats.setsLost)) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                          style={{ width: `${(stats.setsLost / (stats.setsWon + stats.setsLost)) * 100}%` }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-slate-200" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Point Statistics */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/60">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Points</h3>
              </div>
              <div className="p-6">
                {showPointsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg md:text-2xl font-bold text-blue-600">{pointsFor}</div>
                        <div className="text-xs text-slate-500 font-medium">SCORED</div>
                      </div>
                      <div>
                        <div className="text-lg md:text-2xl font-bold text-slate-900">{pointsFor + pointsAgainst}</div>
                        <div className="text-xs text-slate-500 font-medium">TOTAL</div>
                      </div>
                      <div>
                        <div className="text-lg md:text-2xl font-bold text-rose-600">{pointsAgainst}</div>
                        <div className="text-xs text-slate-500 font-medium">CONCEDED</div>
                      </div>
                    </div>
                    
                    {/* Points Progress Bar */}
                    <div className="relative">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        {pointsFor + pointsAgainst > 0 ? (
                          <>
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                              style={{ width: `${(pointsFor / (pointsFor + pointsAgainst)) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                              style={{ width: `${(pointsAgainst / (pointsFor + pointsAgainst)) * 100}%` }}
                            />
                          </>
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                      </div>
                    </div>
                    
                    {/* Averages */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div className="text-center">
                        <div className="text-base md:text-lg font-bold text-blue-600">{avgPointsPerGame}</div>
                        <div className="text-xs text-slate-500 font-medium">AVG PER SET</div>
                      </div>
                  <div className="text-center">
                    <div className={`text-base md:text-lg font-bold px-2 py-1 rounded ${
                      pointsDiff > 0 ? "text-blue-600" : pointsDiff < 0 ? "text-rose-600" : "text-slate-600"
                    }`}>
                      {pointsDiff > 0 ? "+" : ""}{pointsDiff}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">DIFFERENTIAL</div>
                  </div>
                </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Serve Statistics */}
          {!showPointsLoading && detailedStats && detailedStats.serve.totalServes > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-200/60">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Serve Performance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-blue-600">{detailedStats.serve.pointsWonOnServe}</div>
                    <div className="text-xs text-slate-500 font-medium">WON</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-slate-900">{detailedStats.serve.totalServes}</div>
                    <div className="text-xs text-slate-500 font-medium">TOTAL</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold text-rose-600">{detailedStats.serve.totalServes - detailedStats.serve.pointsWonOnServe}</div>
                    <div className="text-xs text-slate-500 font-medium">LOST</div>
                  </div>
                </div>
                
                {/* Serve Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
                      style={{ width: `${detailedStats.serve.serveWinPercentage}%` }}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700 ease-out"
                      style={{ width: `${100 - detailedStats.serve.serveWinPercentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Win Rate */}
                <div className="text-center pt-2 border-t border-slate-200">
                  <div className="text-lg md:text-2xl font-bold text-blue-600">{detailedStats.serve.serveWinPercentage.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 font-medium">SERVE WIN RATE</div>
                </div>
              </div>
            </div>
          )}

                  </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Statistics generated</span>
            <span className="text-xs text-slate-600 font-semibold">
              {detailedStats ? new Date().toLocaleString() : "Loading..."}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function PlayerLeaderboard({
  data,
  loading,
  emptyMessage,
  matchType,
  currentUserId,
}: PlayerLeaderboardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(
    null
  );

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message={emptyMessage} />;

  // Find current user's entry
  const currentUserEntry = currentUserId
    ? data.find((entry) => entry.player._id === currentUserId)
    : null;

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <div>
      {/* CURRENT USER ROW - shown at top if user is not in top 3 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <>
          <div
            style={{
              backgroundColor: "rgba(60, 110, 113, 0.05)",
              border: "1px solid rgba(60, 110, 113, 0.15)",
            }}
          >
            <div
              className="divide-y"
              style={{ borderColor: "rgba(217, 217, 217, 0.5)" }}
            >
              <PlayerRow
                entry={currentUserEntry}
                isTopThree={false}
                isCurrentUser={true}
                onClick={() => setSelectedPlayer(currentUserEntry)}
              />
            </div>
          </div>
          <div
            className="h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(217, 217, 217, 0.4), transparent)",
            }}
          />
        </>
      )}

      {/* TOP 3 — enhanced styling */}
      <div
        className="divide-y"
        style={{ borderColor: "rgba(217, 217, 217, 0.6)" }}
      >
        {topThree.map((entry) => {
          const isCurrentUser = currentUserId === entry.player._id;
          const isTopThree = entry.rank <= 3;

          return (
            <PlayerRow
              key={entry.player._id}
              entry={entry}
              isTopThree={isTopThree}
              isCurrentUser={isCurrentUser}
              onClick={() => setSelectedPlayer(entry)}
            />
          );
        })}
      </div>

      {/* OTHERS — list style */}
      <div
        className="divide-y"
        style={{ borderColor: "rgba(217, 217, 217, 0.6)" }}
      >
        {others.map((entry) => {
          const isCurrentUser = currentUserId === entry.player._id;
          return (
            <PlayerRow
              key={entry.player._id}
              entry={entry}
              isTopThree={false}
              isCurrentUser={isCurrentUser}
              onClick={() => setSelectedPlayer(entry)}
            />
          );
        })}
      </div>

      {/* Stats Modal */}
      <PlayerStatsModal
        player={selectedPlayer}
        matchType={matchType}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
