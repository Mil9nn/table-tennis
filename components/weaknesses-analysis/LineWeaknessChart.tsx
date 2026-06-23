// components/weaknesses-analysis/LineWeaknessChart.tsx

"use client";

import { Progress } from "@/components/ui/progress";
import { LineWeakness } from "@/types/weaknesses.type";
import { AlertCircle, TrendingUp } from "lucide-react";
import { RecommendationText } from "./RecommendationText";

interface LineWeaknessChartProps {
  lineWeaknesses: LineWeakness[];
}

export function LineWeaknessChart({ lineWeaknesses }: LineWeaknessChartProps) {
  // Sort by win rate (weakest first)
  const sortedLines = [...lineWeaknesses]
    .filter((l) => l.totalShots >= 5)
    .sort((a, b) => a.winRate - b.winRate);

  // Return null if no displayable data
  if (sortedLines.length === 0) {
    return null;
  }

  const getProgressColor = (winRate: number) => {
    if (winRate >= 55) return "bg-[#3c6e71]";
    if (winRate >= 45) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="border border-[#d9d9d9] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#353535]">Line of Play Analysis</h3>
        <p className="text-xs text-[#d9d9d9]">
          Your performance when playing different shot trajectories
        </p>
      </div>

      <div className="space-y-4">
        {/* Color Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs pb-3 border-b border-[#d9d9d9]">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#3c6e71]"></span>
            <span className="text-[#353535]/70">Strong (&gt;55%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-500"></span>
            <span className="text-[#353535]/70">Average (45-55%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500"></span>
            <span className="text-[#353535]/70">Weak (&lt;45%)</span>
          </div>
        </div>
        {sortedLines.map((line, idx) => {
          const isVulnerable = line.winRate < 45;
          const opponentEffective = line.averageOpponentWinRate > 55;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize text-sm text-[#353535]">{line.line}</span>
                  {isVulnerable && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {opponentEffective && (
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <span className="text-sm text-[#d9d9d9]">
                  {line.wins}W / {line.losses}L
                </span>
              </div>

              {/* Win Rate Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#353535]/70">Your Win Rate</span>
                  <span
                    className={`font-semibold ${
                      line.winRate < 45
                        ? "text-red-600"
                        : line.winRate > 55
                        ? "text-[#3c6e71]"
                        : "text-amber-600"
                    }`}
                  >
                    {line.winRate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={line.winRate}
                  className="h-2"
                  indicatorClassName={getProgressColor(line.winRate)}
                />
              </div>

              {/* Opponent Success Rate */}
              {line.averageOpponentWinRate > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#d9d9d9]">
                    <span>Opponent Success vs You</span>
                    <span
                      className={`font-semibold ${
                        line.averageOpponentWinRate > 55 ? "text-amber-600" : ""
                      }`}
                    >
                      {line.averageOpponentWinRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={line.averageOpponentWinRate}
                    className="h-1 opacity-60"
                    indicatorClassName={getProgressColor(line.averageOpponentWinRate)}
                  />
                </div>
              )}

              {/* Recommendation */}
              {isVulnerable && (
                <p className="text-xs text-red-700 bg-red-500/5 p-2">
                  <RecommendationText text={line.recommendation} />
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
