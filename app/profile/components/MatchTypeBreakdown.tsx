"use client";

import { motion } from "framer-motion";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";

interface MatchTypeData {
  label: string;
  matches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  color: string;
}

interface MatchTypeBreakdownProps {
  data: MatchTypeData[];
}

export const MatchTypeBreakdown = ({ data }: MatchTypeBreakdownProps) => {
  const filteredData = data.filter((item) => item.matches > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <SportsTennisIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        Match Type Breakdown
      </h3>
      <div className="space-y-4">
        {filteredData.map((item, i) => {
          const itemWinRate =
            item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;
          const totalSets = item.setsWon + item.setsLost;
          const setWinRate =
            totalSets > 0
              ? Math.round((item.setsWon / totalSets) * 100)
              : 0;

          return (
            <div key={i} className="space-y-3">
              {/* Match Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {item.label}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {item.wins}W / {item.losses}L
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${itemWinRate}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
                <p className="text-xs text-zinc-400">
                  {itemWinRate}% win rate • {item.matches} matches
                </p>
              </div>

              {/* Sets Stats Subsection */}
              {totalSets > 0 && (
                <div className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Sets
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {item.setsWon}W / {item.setsLost}L
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${setWinRate}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 + 0.2 }}
                      className={`h-full ${item.color} opacity-70 rounded-full`}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {setWinRate}% win rate • {totalSets} sets
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-4">
            No matches played yet
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default MatchTypeBreakdown;
