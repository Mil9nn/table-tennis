// components/weaknesses-analysis/ServeReceiveWeaknessCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (winRate >= 55) return "text-green-600";
    if (winRate >= 45) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (winRate: number) => {
    if (winRate >= 55) return "bg-green-500";
    if (winRate >= 45) return "bg-yellow-500";
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Serve Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Wins: {serveStats.servesWon}</span>
              <span>Losses: {serveStats.servesLost}</span>
            </div>
            <Progress
              value={serveStats.serveWinRate}
              className="h-3"
              indicatorClassName={getProgressColor(serveStats.serveWinRate)}
            />
            <p className="text-xs text-gray-500 text-center">
              Total Serves: {serveStats.totalServes}
            </p>
          </div>

          {/* Recommendation */}
          <div className="pt-2 border-t">
            <p className={`text-xs italic ${
              serveStats.recommendation?.includes("Need more") 
                ? "text-gray-500" 
                : "text-gray-600"
            }`}>
              <RecommendationText text={serveStats.recommendation} />
            </p>
            {serveStats.totalServes > 0 && serveStats.totalServes < 3 && (
              <p className="text-xs text-gray-400 mt-1">
                (Minimum 3 serves needed for accurate analysis)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Receive Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receive Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Wins: {receiveStats.receivesWon}</span>
              <span>Losses: {receiveStats.receivesLost}</span>
            </div>
            <Progress
              value={receiveStats.receiveWinRate}
              className="h-3"
              indicatorClassName={getProgressColor(receiveStats.receiveWinRate)}
            />
            <p className="text-xs text-gray-500 text-center">
              Total Receives: {receiveStats.totalReceives}
            </p>
          </div>

          {/* Weakest Receive Types */}
          {weakestReceiveTypes.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-semibold text-gray-700">
                Struggling Against:
              </p>
              <div className="space-y-1">
                {weakestReceiveTypes.map(([stroke, stats]) => (
                  <div
                    key={stroke}
                    className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded"
                  >
                    <span className="text-gray-700">
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
          <div className="pt-2 border-t">
            <p className={`text-xs italic ${
              receiveStats.recommendation?.includes("Need more") 
                ? "text-gray-500" 
                : "text-gray-600"
            }`}>
              <RecommendationText text={receiveStats.recommendation} />
            </p>
            {receiveStats.totalReceives > 0 && receiveStats.totalReceives < 3 && (
              <p className="text-xs text-gray-400 mt-1">
                (Minimum 3 receives needed for accurate analysis)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
