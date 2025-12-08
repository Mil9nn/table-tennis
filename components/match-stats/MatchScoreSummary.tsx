"use client";

import { motion } from "framer-motion";

interface MatchScoreSummaryProps {
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  totalPoints: number;
  totalGames: number;
}

export function MatchScoreSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
  totalPoints,
  totalGames,
}: MatchScoreSummaryProps) {
  const isSide1Winning = side1Sets > side2Sets;
  const isSide2Winning = side2Sets > side1Sets;
  
  // Calculate total sets played (sum of sets won by both sides)
  const totalSetsPlayed = (side1Sets || 0) + (side2Sets || 0);

  return (
    <div className="w-full max-w-sm mx-auto p-2 space-y-2">
      {/* Main Score Section */}
      <div className="flex items-center justify-between">
        {/* Side 1 */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {side1Name}
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className={`text-lg font-semibold ${
              isSide1Winning ? "text-blue-400" : "text-zinc-200"
            }`}
          >
            {side1Sets}
          </motion.p>
        </div>

        {/* Minimal VS */}
        <div className="text-[10px] px-2 text-zinc-500 font-semibold">vs</div>

        {/* Side 2 */}
        <div className="flex-1 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {side2Name}
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className={`text-lg font-semibold ${
              isSide2Winning ? "text-blue-400" : "text-zinc-200"
            }`}
          >
            {side2Sets}
          </motion.p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800"></div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-center">
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">Total Points</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
            className="text-sm font-semibold"
          >
            {totalPoints || 0}
          </motion.p>
        </div>

        <div className="w-px h-6 bg-zinc-800"></div>

        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">Sets Played</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
            className="text-sm font-semibold"
          >
            {totalSetsPlayed || 0}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
