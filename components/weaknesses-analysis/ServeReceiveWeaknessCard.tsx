// components/weaknesses-analysis/ServeReceiveWeaknessCard.tsx

import { Progress } from "@/components/ui/progress";
import {
  ServeWeaknessData,
  ReceiveWeaknessData,
} from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface Props {
  serveStats: ServeWeaknessData;
  receiveStats: ReceiveWeaknessData;
}

export function ServeReceiveWeaknessCard({
  serveStats,
  receiveStats,
}: Props) {
  const weakestReceiveTypes = Object.entries(
    receiveStats.vsStrokeType
  )
    .sort((a, b) => a[1].winRate - b[1].winRate)
    .slice(0, 3);

  // Use new field names if available, fallback to legacy names for backward compatibility
  const servePointsWon = serveStats.pointsWonWhenServing ?? serveStats.servesWon;
  const servePointsLost = serveStats.pointsLostWhenServing ?? serveStats.servesLost;
  const totalServePoints = serveStats.totalPointsWhenServing ?? serveStats.totalServes;
  const serveWinRate = serveStats.pointWinRateWhenServing ?? serveStats.serveWinRate;

  const receivePointsWon = receiveStats.pointsWonWhenReceiving ?? receiveStats.receivesWon;
  const receivePointsLost = receiveStats.pointsLostWhenReceiving ?? receiveStats.receivesLost;
  const totalReceivePoints = receiveStats.totalPointsWhenReceiving ?? receiveStats.totalReceives;
  const receiveWinRate = receiveStats.pointWinRateWhenReceiving ?? receiveStats.receiveWinRate;

  return (
    <section className="grid gap-6 md:grid-cols-2">
      {/* Serve */}
      <div className="rounded-lg bg-white p-4 shadow-[0_0_0_1px_#e6e8eb]">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#353535]">
            Points when serving
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#6b7280]">
              <span>Points won: {servePointsWon}</span>
              <span>Points lost: {servePointsLost}</span>
            </div>

            <Progress
              value={serveWinRate}
              className="h-2"
              indicatorClassName="bg-[#3c6e71]"
            />

            <p className="mt-1 text-center text-[11px] text-[#9ca3af]">
              {totalServePoints} total points when serving
            </p>
          </div>

          {serveStats.recommendation && (
            <p className="text-xs leading-relaxed text-[#6b7280]">
              <RecommendationText
                text={serveStats.recommendation}
              />
            </p>
          )}
        </div>
      </div>

      {/* Receive */}
      <div className="rounded-lg bg-white p-4 shadow-[0_0_0_1px_#e6e8eb]">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#353535]">
            Points when receiving
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#6b7280]">
              <span>Points won: {receivePointsWon}</span>
              <span>Points lost: {receivePointsLost}</span>
            </div>

            <Progress
              value={receiveWinRate}
              className="h-2"
              indicatorClassName="bg-[#3c6e71]"
            />

            <p className="mt-1 text-center text-[11px] text-[#9ca3af]">
              {totalReceivePoints} total points when receiving
            </p>
          </div>

          {weakestReceiveTypes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#6b7280]">
                Lower success vs
              </p>

              {weakestReceiveTypes.map(
                ([stroke, stats]) => (
                  <div
                    key={stroke}
                    className="flex justify-between rounded-md bg-[#fafafa] px-2 py-1 text-xs"
                  >
                    <span className="text-[#353535]">
                      {formatStrokeName(stroke)}
                    </span>
                    <span className="font-medium text-[#6b7280]">
                      {stats.winRate.toFixed(0)}%
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {receiveStats.recommendation && (
            <p className="text-xs leading-relaxed text-[#6b7280]">
              <RecommendationText
                text={receiveStats.recommendation}
              />
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
