"use client";

import { Flame } from "lucide-react";

interface StatsCardsProps {
  detailedStats: any;
}

const StatsCards = ({ detailedStats }: StatsCardsProps) => {
  // Prefer detailedStats.overall which includes both individual AND team matches
  const totalMatches = detailedStats?.overall?.totalMatches ?? 0
  const totalWins = detailedStats?.overall?.totalWins ?? 0;
  const totalLosses = detailedStats?.overall?.totalLosses ?? 0;
  
  const winPercentage = totalMatches > 0 
    ? ((totalWins / totalMatches) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Matches</h3>
        <p className="text-2xl font-black text-gray-800">{totalMatches}</p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Win Rate</h3>
        <p className="text-2xl font-black text-gray-800">{winPercentage}%</p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Wins</h3>
        <p className="text-2xl font-black text-green-600">{totalWins}</p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Losses</h3>
        <p className="text-2xl font-black text-red-600">{totalLosses}</p>
      </div>

      {detailedStats?.overall?.currentStreak && (
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
            Current Streak
            {detailedStats.overall.currentStreak.type === "win" && (
              <Flame className="text-orange-500" size={14} />
            )}
          </h3>
          <p className="text-2xl font-black text-gray-800">
            {detailedStats.overall.currentStreak.count} {detailedStats.overall.currentStreak.type}
          </p>
        </div>
      )}

      {detailedStats?.overall?.bestWinStreak !== undefined && (
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            Best Win Streak
          </h3>
          <p className="text-2xl font-black text-purple-600">
            {detailedStats.overall.bestWinStreak}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsCards;