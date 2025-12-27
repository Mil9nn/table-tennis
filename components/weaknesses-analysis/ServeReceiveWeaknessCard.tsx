// components/weaknesses-analysis/ServeReceiveWeaknessCard.tsx

import { Progress } from "@/components/ui/progress";
import {
  ServeWeaknessData,
  ReceiveWeaknessData,
} from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface ServeReceiveWeaknessCardProps {
  serveStats: ServeWeaknessData;
  receiveStats: ReceiveWeaknessData;
}

export function ServeReceiveWeaknessCard({
  serveStats,
  receiveStats,
}: ServeReceiveWeaknessCardProps) {
  // Get serve color class based on win rate
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 55) return "text-[#3c6e71]";
    if (winRate >= 45) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (winRate: number) => {
    if (winRate >= 55) return "bg-[#3c6e71]";
    if (winRate >= 45) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get top 3 weakest receive types
  const weakestReceiveTypes = Object.entries(receiveStats.vsStrokeType)
    .filter(([_, stats]) => stats.received >= 3)
    .sort((a, b) => a[1].winRate - b[1].winRate)
    .slice(0, 3);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Serve Stats */}
      <div className="border border-[#d9d9d9] bg-white p-4">
        <h3 className="text-base font-semibold text-[#353535] mb-4">Serve Performance</h3>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#353535]/70">
              <span>Wins: {serveStats.servesWon}</span>
              <span>Losses: {serveStats.servesLost}</span>
            </div>
            <Progress
              value={serveStats.serveWinRate}
              className="h-3"
              indicatorClassName={getProgressColor(serveStats.serveWinRate)}
            />
            <p className="text-xs text-[#d9d9d9] text-center">
              Total Serves: {serveStats.totalServes}
            </p>
          </div>

          {/* Recommendation */}
          <div className="pt-2 border-t border-[#d9d9d9]">
            <p className={`text-xs italic ${
              serveStats.recommendation?.includes("Need more") 
                ? "text-[#d9d9d9]" 
                : "text-[#353535]/70"
            }`}>
              <RecommendationText text={serveStats.recommendation} />
            </p>
            {serveStats.totalServes > 0 && serveStats.totalServes < 3 && (
              <p className="text-xs text-[#d9d9d9] mt-1">
                (Minimum 3 serves needed for accurate analysis)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Receive Stats */}
      <div className="border border-[#d9d9d9] bg-white p-4">
        <h3 className="text-base font-semibold text-[#353535] mb-4">Receive Performance</h3>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#353535]/70">
              <span>Wins: {receiveStats.receivesWon}</span>
              <span>Losses: {receiveStats.receivesLost}</span>
            </div>
            <Progress
              value={receiveStats.receiveWinRate}
              className="h-3"
              indicatorClassName={getProgressColor(receiveStats.receiveWinRate)}
            />
            <p className="text-xs text-[#d9d9d9] text-center">
              Total Receives: {receiveStats.totalReceives}
            </p>
          </div>

          {/* Weakest Receive Types */}
          {weakestReceiveTypes.length > 0 && (
            <div className="pt-2 border-t border-[#d9d9d9] space-y-2">
              <p className="text-xs font-semibold text-[#353535]">
                Struggling Against:
              </p>
              <div className="space-y-1">
                {weakestReceiveTypes.map(([stroke, stats]) => (
                  <div
                    key={stroke}
                    className="flex justify-between items-center text-xs bg-[#f8f8f8] p-2"
                  >
                    <span className="text-[#353535]">
                      {formatStrokeName(stroke)}
                    </span>
                    <span
                      className={`font-semibold ${getWinRateColor(
                        stats.winRate
                      )}`}
                    >
                      {stats.winRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="pt-2 border-t border-[#d9d9d9]">
            <p className={`text-xs italic ${
              receiveStats.recommendation?.includes("Need more") 
                ? "text-[#d9d9d9]" 
                : "text-[#353535]/70"
            }`}>
              <RecommendationText text={receiveStats.recommendation} />
            </p>
            {receiveStats.totalReceives > 0 && receiveStats.totalReceives < 3 && (
              <p className="text-xs text-[#d9d9d9] mt-1">
                (Minimum 3 receives needed for accurate analysis)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
