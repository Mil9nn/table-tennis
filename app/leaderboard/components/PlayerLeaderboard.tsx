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
import { LeaderboardEmpty, LeaderboardLoading, RankBadge, StreakBadge } from "./shared";
import { getDisplayName, getInitials } from "../utils";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

interface PlayerLeaderboardProps {
  data: PlayerStats[];
  loading: boolean;
  emptyMessage: string;
  matchType: "singles" | "doubles" | "mixed_doubles";
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

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-250"
      style={{
        backgroundColor: isCurrentUser
          ? 'rgba(24, 195, 248, 0.08)'
          : isRank1
          ? 'rgba(24, 195, 248, 0.04)'
          : '#ffffff',
        borderLeft: isCurrentUser
          ? '0px solid #18c3f8'
          : isRank1
          ? '4px solid #18c3f8'
          : entry.rank === 2 || entry.rank === 3
          ? '4px solid #ccbcbc'
          : '4px solid transparent',
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = '#18c3f8';
        e.currentTarget.style.backgroundColor = 'rgba(204, 188, 188, 0.03)';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        const originalBorderColor = isCurrentUser || isRank1
          ? '#18c3f8'
          : entry.rank === 2 || entry.rank === 3
          ? '#ccbcbc'
          : 'transparent';
        const originalBgColor = isCurrentUser
          ? 'rgba(24, 195, 248, 0.08)'
          : isRank1
          ? 'rgba(24, 195, 248, 0.04)'
          : '#ffffff';
        e.currentTarget.style.borderLeftColor = originalBorderColor;
        e.currentTarget.style.backgroundColor = originalBgColor;
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank} variant="list" />

        <Link
          href={`/profile/${entry.player._id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            className="h-12 w-12 transition-all"
            style={{
              borderWidth: isTopThree
                ? (isRank1 ? '2.5px' : '1.5px')
                : '0px',
              borderColor: isTopThree
                ? (isRank1 ? '#18c3f8' : '#ccbcbc')
                : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = '2px';
                e.currentTarget.style.borderColor = '#18c3f8';
              }
            }}
            onMouseLeave={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = isRank1 ? '2.5px' : '1.5px';
                e.currentTarget.style.borderColor = isRank1 ? '#18c3f8' : '#ccbcbc';
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
            <p className="font-semibold text-[0.9375rem]" style={{ color: '#323139' }}>
              {getDisplayName(entry.player)}
            </p>
            {isCurrentUser && (
              <Badge
                className="text-xs font-semibold px-2 py-0.5"
                style={{
                  backgroundColor: 'rgba(24, 195, 248, 0.15)',
                  color: '#18c3f8',
                  border: '1px solid rgba(24, 195, 248, 0.3)',
                }}
              >
                You
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-[0.75rem] mt-1">
            <span style={{ color: '#323139' }}>
              <strong className="lb-font-mono">{entry.stats.wins}</strong> wins
            </span>
            <span style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
              <strong className="lb-font-mono">{entry.stats.losses}</strong> losses
            </span>
            {entry.stats.currentStreak !== 0 && (
              <StreakBadge streak={entry.stats.currentStreak} />
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs" style={{ color: '#ccbcbc' }}>Win Rate</div>
          <div
            className="text-lg font-bold lb-font-mono"
            style={{ color: '#18c3f8' }}
          >
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
  matchType: "singles" | "doubles" | "mixed_doubles";
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
        const { data } = await axiosInstance.get(
          `/leaderboard/player/${player.player._id}/stats?type=${matchType}`
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
        className="max-w-3xl max-h-[90vh] overflow-y-auto leaderboard-modal-content lb-font-primary"
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid rgba(204, 188, 188, 0.2)',
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(50, 49, 57, 0.2)'
        }}
      >
        {/* Header Section */}
        <DialogHeader
          className="pb-6"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, rgba(204, 188, 188, 0.05))',
            borderBottom: '1px solid rgba(204, 188, 188, 0.2)',
            marginBottom: '20px'
          }}
        >
          <div className="flex items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  className="h-20 w-20 shadow-lg"
                  style={{
                    borderWidth: '3px',
                    borderColor: '#18c3f8'
                  }}
                >
                  <AvatarImage
                    src={player.player.profileImage}
                    alt={getDisplayName(player.player)}
                  />
                  <AvatarFallback
                    className="text-xl font-bold"
                    style={getAvatarFallbackStyle(player.player._id)}
                  >
                    {getInitials(getDisplayName(player.player))}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-0 -right-1 flex items-center justify-center rounded-full px-2 py-1 shadow-md"
                  style={{ backgroundColor: '#18c3f8' }}
                >
                  <span className="text-xs font-bold" style={{ color: '#ffffff' }}>
                    #{player.rank}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <DialogTitle
                  className="text-xl font-bold mb-1"
                  style={{ color: '#323139' }}
                >
                  {getDisplayName(player.player)}
                </DialogTitle>
                <p
                  className="text-sm"
                  style={{ color: '#ccbcbc' }}
                >
                  @{player.player.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: '#ccbcbc' }}
              >
                Win Rate
              </div>
              <div
                className="text-2xl font-bold lb-font-mono"
                style={{ color: '#18c3f8' }}
              >
                {stats.winRate}%
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Performance Overview */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#ccbcbc' }}
            >
              Performance Overview
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="rounded-2xl p-5 shadow-sm transition-all duration-250 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(204, 188, 188, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(24, 195, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(204, 188, 188, 0.25)';
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-xl font-bold lb-font-mono"
                    style={{ color: '#323139' }}
                  >
                    {stats.wins}
                  </span>
                  <span
                    className="text-xs uppercase"
                    style={{ color: '#ccbcbc' }}
                  >
                    wins
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(204, 188, 188, 0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: '#18c3f8',
                      width: totalGames > 0 ? `${(stats.wins / totalGames) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl p-5 shadow-sm transition-all duration-250 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(204, 188, 188, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(24, 195, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(204, 188, 188, 0.25)';
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-xl font-bold lb-font-mono"
                    style={{ color: '#323139' }}
                  >
                    {stats.losses}
                  </span>
                  <span
                    className="text-xs uppercase"
                    style={{ color: '#ccbcbc' }}
                  >
                    losses
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(204, 188, 188, 0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: '#ef4444',
                      width: totalGames > 0 ? `${(stats.losses / totalGames) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl p-5 shadow-sm transition-all duration-250 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(204, 188, 188, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(24, 195, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(204, 188, 188, 0.25)';
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-xl font-bold lb-font-mono"
                    style={{ color: '#323139' }}
                  >
                    {totalGames}
                  </span>
                  <span
                    className="text-xs uppercase"
                    style={{ color: '#ccbcbc' }}
                  >
                    total
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(204, 188, 188, 0.1)' }}>
                  <div
                    className="h-full rounded-full w-full"
                    style={{ backgroundColor: '#ccbcbc' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Game Statistics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Game Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Game Differential
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold",
                      gameDiff > 0
                        ? "text-emerald-600"
                        : gameDiff < 0
                        ? "text-rose-600"
                        : "text-slate-600"
                    )}
                  >
                    {gameDiff > 0 ? "+" : ""}
                    {gameDiff}
                  </span>
                </div>
              </div>

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
                Recent {matchType === 'singles' ? 'Singles' : matchType === 'doubles' ? 'Doubles' : 'Mixed'} Matches
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
    <div className="lb-font-primary">
      {/* CURRENT USER ROW - shown at top if user is not in top 3 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <>
          <div
            className=""
            style={{
              backgroundColor: 'rgba(24, 195, 248, 0.05)',
              border: '2px solid rgba(24, 195, 248, 0.2)',
            }}
          >
            <div className="divide-y" style={{ borderColor: 'rgba(204, 188, 188, 0.15)' }}>
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
              background: 'linear-gradient(to right, transparent, rgba(204, 188, 188, 0.3), transparent)',
            }}
          />
        </>
      )}

      {/* TOP 3 — same structure as others, different styling */}
      <div className="divide-y" style={{ borderColor: 'rgba(204, 188, 188, 0.15)' }}>
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
      <div className="divide-y" style={{ borderColor: 'rgba(204, 188, 188, 0.15)' }}>
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
