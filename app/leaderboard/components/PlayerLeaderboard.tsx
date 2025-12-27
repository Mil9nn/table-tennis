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
  matchType: "singles" | "doubles" | "mixed_doubles" | "all";
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
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-[#353535]">
              {getDisplayName(entry.player)}
            </p>
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
            {entry.stats.currentStreak !== 0 && (
              <>
                <StreakBadge streak={entry.stats.currentStreak} />
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.setsWon}</strong>
              <span className="text-[#a8a8a8] font-medium"> sets won</span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.setsLost}</strong>
              <span className="text-[#a8a8a8] font-medium"> sets lost</span>
            </div>
          </div>
        </div>

        <div className="text-right min-w-fit">
          <div className="text-xs font-medium text-[#6c6868] uppercase tracking-wider mb-1">
            Win Rate
          </div>
          <div className="text-sm font-bold" style={{ color: "#3c6e71" }}>
            {entry.stats.winRate}%
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
  matchType: "singles" | "doubles" | "mixed_doubles" | "all";
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
  const totalGames = stats.wins + stats.losses;

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
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto leaderboard-modal-content"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d9d9d9",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(53, 53, 53, 0.15)",
        }}
      >
        {/* Header Section */}
        <DialogHeader
          className="pb-6"
          style={{
            background:
              "linear-gradient(to bottom, #ffffff, rgba(217, 217, 217, 0.03))",
            borderBottom: "1px solid #d9d9d9",
            marginBottom: "20px",
          }}
        >
          <div className="flex items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  className="h-20 w-20 shadow-sm ring-2 ring-offset-2"
                  style={{
                    borderWidth: "2px",
                    borderColor: "#3c6e71",
                    backgroundColor: "#284b63",
                  }}
                >
                  <AvatarImage
                    src={player.player.profileImage}
                    alt={getDisplayName(player.player)}
                  />
                  <AvatarFallback
                    className="text-xl font-bold text-white"
                    style={getAvatarFallbackStyle(player.player._id)}
                  >
                    {getInitials(getDisplayName(player.player))}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-0 -right-1 flex items-center justify-center rounded-full px-2.5 py-1.5 shadow-md font-bold"
                  style={{ backgroundColor: "#3c6e71", color: "#ffffff" }}
                >
                  <span className="text-xs">#{player.rank}</span>
                </div>
              </div>

              <div className="flex-1">
                <DialogTitle
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#353535" }}
                >
                  {getDisplayName(player.player)}
                </DialogTitle>
                <p className="text-sm" style={{ color: "#d9d9d9" }}>
                  @{player.player.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "#d9d9d9" }}
              >
                Win Rate
              </div>
              <div className="text-xl font-bold" style={{ color: "#3c6e71" }}>
                {stats.winRate}%
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
        {stats.currentStreak !== 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Current Streak
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          stats.currentStreak > 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        )}
                      >
                        {Math.abs(stats.currentStreak)}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px] p-2 rounded-full font-semibold",
                          stats.currentStreak > 0
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-rose-100 text-rose-700 border-rose-200"
                        )}
                      >
                        {stats.currentStreak > 0 ? "W" : "L"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
          {/* Performance Overview */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#d9d9d9" }}
            >
              Overview
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="rounded-lg p-5 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3c6e71";
                  e.currentTarget.style.backgroundColor =
                    "rgba(60, 110, 113, 0.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d9d9d9";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#3c6e71" }}
                  >
                    {stats.wins}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    wins
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(60, 110, 113, 0.1)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: "#3c6e71",
                      width:
                        totalGames > 0
                          ? `${(stats.wins / totalGames) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-lg p-5 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#e74c3c";
                  e.currentTarget.style.backgroundColor =
                    "rgba(231, 76, 60, 0.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d9d9d9";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#e74c3c" }}
                  >
                    {stats.losses}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    losses
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(231, 76, 60, 0.1)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: "#e74c3c",
                      width:
                        totalGames > 0
                          ? `${(stats.losses / totalGames) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-lg p-5 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#284b63";
                  e.currentTarget.style.backgroundColor =
                    "rgba(40, 75, 99, 0.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d9d9d9";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#284b63" }}
                  >
                    {totalGames}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    total
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(40, 75, 99, 0.1)" }}
                >
                  <div
                    className="h-full rounded-full w-full"
                    style={{ backgroundColor: "#284b63" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Set Statistics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Set Statistics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-1">
                    Sets Won
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {stats.setsWon}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-1">
                    Sets Lost
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {stats.setsLost}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-1">
                    Set Differential
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold",
                      setDiff > 0
                        ? "text-emerald-600"
                        : setDiff < 0
                        ? "text-rose-600"
                        : "text-slate-600"
                    )}
                  >
                    {setDiff > 0 ? "+" : ""}
                    {setDiff}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Point Statistics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Point Statistics
            </h3>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {showPointsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (
                <>
                  {/* Points For/Against */}
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="text-xs text-slate-500 font-medium mb-1.5">
                        Points Scored
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900">
                          {pointsFor}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({avgPointsPerGame}/set)
                        </span>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="text-xs text-slate-500 font-medium mb-1.5">
                        Points Conceded
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900">
                          {pointsAgainst}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({avgPointsAgainst}/set)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points Differential */}
                  <div className="border-t border-slate-200 p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 font-medium">
                        Point Differential
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "text-xl font-bold",
                            pointsDiff > 0
                              ? "text-emerald-600"
                              : pointsDiff < 0
                              ? "text-rose-600"
                              : "text-slate-600"
                          )}
                        >
                          {pointsDiff > 0 ? "+" : ""}
                          {pointsDiff}
                        </div>
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            pointsDiff > 0
                              ? "bg-emerald-500"
                              : pointsDiff < 0
                              ? "bg-rose-500"
                              : "bg-slate-400"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Serve Statistics Section */}
                  {detailedStats && detailedStats.serve.totalServes > 0 && (
                    <div className="border-t border-slate-200 p-4">
                      <div className="text-xs text-slate-500 font-medium mb-3">
                        Serve Performance
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-slate-900">
                            {detailedStats.serve.totalServes}
                          </div>
                          <div className="text-xs text-slate-500">
                            Total Serves
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-emerald-600">
                            {detailedStats.serve.pointsWonOnServe}
                          </div>
                          <div className="text-xs text-slate-500">
                            Won on Serve
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-900">
                            {detailedStats.serve.serveWinPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500">
                            Serve Win %
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent Matches Section */}
          {/* {detailedStats && detailedStats.recentMatches.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Recent {matchType === 'singles' ? 'Singles' : matchType === 'doubles' ? 'Doubles' : matchType === 'mixed_doubles' ? 'Mixed' : 'Individual'} Matches
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200">
                  {detailedStats.recentMatches.slice(0, 5).map((match) => (
                    <div key={match.matchId} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-xs px-2 py-0.5",
                              match.result === 'win'
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            )}>
                              {match.result === 'win' ? 'W' : 'L'}
                            </Badge>
                            <span className="text-sm font-medium text-slate-900">
                              vs {match.opponent}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{match.score}</span>
                            <span>•</span>
                            <span>{match.pointsScored}-{match.pointsConceded} pts</span>
                            <span>•</span>
                            <span>{new Date(match.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )} */}
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
