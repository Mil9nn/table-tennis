// components/live-scorer/common/MatchInfo.tsx
"use client";

import { Timer } from "lucide-react";

interface MatchInfoProps {
  currentGame: number;
  totalGames: number;
  matchStartTime?: Date;
  rallyCount?: number;
}

export default function MatchInfo({
  currentGame,
  totalGames,
  matchStartTime,
  rallyCount = 0,
}: MatchInfoProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-sm dark:shadow-lg px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        {/* Game Progress */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#3c6e71] to-[#284b63] text-white flex items-center justify-center font-bold text-sm">
            {currentGame}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Set {currentGame} of {totalGames}
          </span>
        </div>

        {/* Rally Counter */}
        {rallyCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <Timer className="w-3.5 h-3.5 text-[#3c6e71]" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {rallyCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
