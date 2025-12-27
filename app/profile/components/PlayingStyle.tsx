"use client";

import { motion } from "framer-motion";
import BoltIcon from "@mui/icons-material/Bolt";

interface PlayingStyleProps {
  shotAnalysis?: {
    offensive: number;
    neutral: number;
    defensive: number;
  } | null;
}

export const PlayingStyle = ({ shotAnalysis }: PlayingStyleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <BoltIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        Playing Style
      </h3>
      {shotAnalysis && (shotAnalysis.offensive > 0 || shotAnalysis.defensive > 0) ? (
        <div className="space-y-4">
          {/* Style Distribution with Percentages */}
          {(() => {
            const totalShots =
              (shotAnalysis.offensive || 0) +
              (shotAnalysis.neutral || 0) +
              (shotAnalysis.defensive || 0);
            if (totalShots === 0) return null;

            const offensivePct = Math.round(
              (shotAnalysis.offensive / totalShots) * 100
            );
            const neutralPct = Math.round(
              (shotAnalysis.neutral / totalShots) * 100
            );
            const defensivePct = Math.round(
              (shotAnalysis.defensive / totalShots) * 100
            );

            return (
              <div className="space-y-3">
                {[
                  {
                    label: "Offensive",
                    value: offensivePct,
                    color: "bg-red-500",
                    textColor: "text-red-500",
                  },
                  {
                    label: "Neutral",
                    value: neutralPct,
                    color: "bg-zinc-500",
                    textColor: "text-zinc-500",
                  },
                  {
                    label: "Defensive",
                    value: defensivePct,
                    color: "bg-blue-500",
                    textColor: "text-blue-500",
                  },
                ].map((style) => (
                  <div key={style.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                        {style.label}
                      </span>
                      <span className={`font-bold ${style.textColor}`}>
                        {style.value}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${style.value}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full ${style.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <BoltIcon className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No shot data available</p>
        </div>
      )}
    </motion.div>
  );
};

export default PlayingStyle;
