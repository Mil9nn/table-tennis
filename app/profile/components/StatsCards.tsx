"use client";

import { Trophy, Target, TrendingUp, Award, Flame } from "lucide-react";

interface StatsCardsProps {
  detailedStats: any;
  tournamentStats?: any;
}

const StatsCards = ({ detailedStats, tournamentStats }: StatsCardsProps) => {
  // Prefer detailedStats.overall which includes both individual AND team matches
  const totalMatches = detailedStats?.overall?.totalMatches ?? 0;
  const totalWins = detailedStats?.overall?.totalWins ?? 0;
  const totalLosses = detailedStats?.overall?.totalLosses ?? 0;
  const currentStreak = detailedStats?.overall?.currentStreak;
  const bestWinStreak = detailedStats?.overall?.bestWinStreak ?? 0;

  const winPercentage =
    totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : "0";

  return (
    <section className="mt-6 w-full">
      <div className="flex gap-4 overflow-x-auto whitespace-nowrap pb-2 px-2">
        {/* Total Matches */}
        <div className="min-w-[150px] bg-white shadow-sm rounded-xl p-4">
          <h3 className="text-xs font-semibold text-blue-400">Matches</h3>

          <p className="text-2xl font-bold text-slate-600">{totalMatches}</p>
          <p className="text-xs text-blue-400 mt-1">
            {totalWins}W - {totalLosses}L
          </p>
        </div>

        {/* Win Rate */}
        <div className="min-w-[150px] bg-white shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-blue-400">Win Rate</h3>
          </div>
          <p className="text-2xl font-bold text-slate-600">{winPercentage}%</p>
          <p className="text-xs text-blue-500 mt-1">{totalWins} victories</p>
        </div>

        {/* Current Streak */}
        <div className="min-w-[150px] bg-white shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-semibold text-blue-400">Streak</h3>
          </div>
          <p className="text-2xl font-bold text-slate-600">
            {currentStreak?.count ?? 0}
          </p>
          <p className="text-xs text-blue-500 mt-1 capitalize">
            {currentStreak?.type ?? "none"} streak
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
