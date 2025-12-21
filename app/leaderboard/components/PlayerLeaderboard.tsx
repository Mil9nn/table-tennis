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
import { cn } from "@/lib/utils";
import type { PlayerStats, FormatSpecificStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { getDisplayName, getInitials } from "../utils";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

interface PlayerLeaderboardProps {
  data: PlayerStats[];
  loading: boolean;
  emptyMessage: string;
  matchType: "singles" | "doubles" | "mixed_doubles";
}

const RankMedal = ({ rank }: { rank: number }) => {
  const styles = {
    1: "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900",
    2: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
    3: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900",
  };

  if (rank > 3)
    return (
      <div className="h-5 w-5 flex items-center justify-center text-slate-700 text-xs font-semibold">
        {rank}
      </div>
    );

  return (
    <div
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold shadow",
        styles[rank as 1 | 2 | 3]
      )}
    >
      {rank}
    </div>
  );
};

const StreakBadge = ({ streak }: { streak: number }) => {
  if (streak === 0) return null;
  const isWinning = streak > 0;

  return (
    <Badge
     variant={"outline"}
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-md font-medium",
        isWinning ? "text-green-700" : "text-red-700"
      )}
    >
      {isWinning ? "W" : "L"}
      {Math.abs(streak)}
    </Badge>
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Section */}
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-slate-300/50 shadow-lg">
                  <AvatarImage
                    src={player.player.profileImage}
                    alt={getDisplayName(player.player)}
                  />
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-lg font-semibold">
                    {getInitials(getDisplayName(player.player))}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-1.5 px-2 shadow-sm">
                  <span className="text-xs font-bold text-yellow-900">
                    #{player.rank}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-900 mb-1">
                  {getDisplayName(player.player)}
                </DialogTitle>
                <p className="text-sm text-slate-500">
                  @{player.player.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Win Rate
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.winRate}%
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Performance Overview */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Performance Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.wins}
                  </span>
                  <span className="text-xs text-slate-500">wins</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalGames > 0
                          ? `${(stats.wins / totalGames) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.losses}
                  </span>
                  <span className="text-xs text-slate-500">losses</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalGames > 0
                          ? `${(stats.losses / totalGames) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {totalGames}
                  </span>
                  <span className="text-xs text-slate-500">total</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full w-full" />
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
                        <span className="text-2xl font-bold text-slate-900">
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
                        <span className="text-2xl font-bold text-slate-900">
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
                            "text-2xl font-bold",
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
}: PlayerLeaderboardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(
    null
  );

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message={emptyMessage} />;

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <div className="">
      {/* TOP 3 — featured layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {topThree.map((entry) => (
          <div
            key={entry.player._id}
            onClick={() => setSelectedPlayer(entry)}
            className={cn(
              "group border bg-white p-3 transition-all hover:-translate-y-1 cursor-pointer"
            )}
          >
            <div className="flex items-center gap-2">
              <RankMedal rank={entry.rank} />

              <Link
                href={`/profile/${entry.player._id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-10 w-10 ring-2 ring-indigo-200 group-hover:ring-indigo-300 transition-all">
                  <AvatarImage
                    src={entry.player.profileImage}
                    alt={getDisplayName(entry.player)}
                  />
                  <AvatarFallback>
                    {getInitials(getDisplayName(entry.player))}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  {getDisplayName(entry.player)}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{entry.stats.wins}</span>
                  <span className="text-[10px]">wins</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-rose-600">{entry.stats.losses}</span>
                  <span className="text-[10px]">losses</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-indigo-600">{entry.stats.winRate}%</span>
                  <span className="text-[10px]">WR</span>
                  {entry.stats.currentStreak !== 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <StreakBadge streak={entry.stats.currentStreak} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OTHERS — list style */}
      <div className="">
        {others.map((entry) => (
          <div
            key={entry.player._id}
            onClick={() => setSelectedPlayer(entry)}
            className="group bg-white border p-2 transition-all hover:-translate-y-[2px] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RankMedal rank={entry.rank} />

              <Link
                href={`/profile/${entry.player._id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-10 w-10 ring-1 ring-slate-200 group-hover:ring-indigo-200 transition-all">
                  <AvatarImage src={entry.player.profileImage} />
                  <AvatarFallback>
                    {getInitials(getDisplayName(entry.player))}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  {getDisplayName(entry.player)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{entry.stats.wins}</span>
                  <span className="text-[10px]">wins</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-rose-600">{entry.stats.losses}</span>
                  <span className="text-[10px]">losses</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-indigo-600">{entry.stats.winRate}%</span>
                  <span className="text-[10px]">WR</span>
                  {entry.stats.currentStreak !== 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <StreakBadge streak={entry.stats.currentStreak} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
