// app/profile/components/StatsCards.tsx
"use client";

import { Flame } from "lucide-react";

interface StatsCardsProps {
  stats: any;
  detailedStats: any;
}

const StatsCards = ({ stats, detailedStats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Matches</h3>
        <p className="text-2xl font-black text-gray-800">
          {stats?.totalMatches || 0}
        </p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Win Rate</h3>
        <p className="text-2xl font-black text-gray-800">
          {stats?.winPercentage ? stats.winPercentage.toFixed(1) : 0}%
        </p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Wins</h3>
        <p className="text-2xl font-black text-green-600">
          {stats?.totalWins || 0}
        </p>
      </div>

      <div className="border-blue-100 border-2 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Total Losses</h3>
        <p className="text-2xl font-black text-red-600">
          {stats?.totalLosses || 0}
        </p>
      </div>

      {detailedStats?.currentStreak && (
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
            Current Streak
            {detailedStats.currentStreak.type === "win" && (
              <Flame className="text-orange-500" size={14} />
            )}
          </h3>
          <p className="text-2xl font-black text-gray-800">
            {detailedStats.currentStreak.count} {detailedStats.currentStreak.type}
          </p>
        </div>
      )}

      {detailedStats?.longestWinStreak !== undefined && (
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            Longest Win Streak
          </h3>
          <p className="text-2xl font-black text-green-600">
            {detailedStats.longestWinStreak}
          </p>
        </div>
      )}

      {detailedStats?.bestWinStreak !== undefined && (
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            Best Win Streak
          </h3>
          <p className="text-2xl font-black text-purple-600">
            {detailedStats.bestWinStreak}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsCards;