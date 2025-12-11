// components/weaknesses-analysis/LineWeaknessChart.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (winRate >= 55) return "bg-green-500";
    if (winRate >= 45) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Line of Play Analysis</CardTitle>
        <p className="text-sm text-gray-500">
          Your performance when playing different shot trajectories
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedLines.map((line, idx) => {
          const isVulnerable = line.winRate < 45;
          const opponentEffective = line.averageOpponentWinRate > 55;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize text-sm">{line.line}</span>
                  {isVulnerable && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {opponentEffective && (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {line.wins}W / {line.losses}L
                </span>
              </div>

              {/* Win Rate Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Your Win Rate</span>
                  <span
                    className={`font-semibold ${
                      line.winRate < 45
                        ? "text-red-600"
                        : line.winRate > 55
                        ? "text-green-600"
                        : "text-yellow-600"
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
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Opponent Success vs You</span>
                    <span
                      className={`font-semibold ${
                        line.averageOpponentWinRate > 55 ? "text-orange-600" : ""
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
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                  <RecommendationText text={line.recommendation} />
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
