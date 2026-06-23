// components/weaknesses-analysis/OriginDistanceAnalysis.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { OriginDistanceWeakness } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface OriginDistanceAnalysisProps {
  distanceWeaknesses: OriginDistanceWeakness[];
}

export function OriginDistanceAnalysis({
  distanceWeaknesses,
}: OriginDistanceAnalysisProps) {
  /* -------------------------------
     Ordering Logic (UNCHANGED)
  -------------------------------- */
  const distanceOrder = [
    "on-table",
    "close-to-table",
    "mid-distance",
    "far-distance",
  ];

  const sortedDistances = [...distanceWeaknesses].sort(
    (a, b) =>
      distanceOrder.indexOf(a.originZone) -
      distanceOrder.indexOf(b.originZone)
  );

  const hasData = sortedDistances.some((d) => d.totalShots > 0);
  if (!hasData) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-neutral-900">
          Distance from Table Performance
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Performance breakdown based on your position relative to the table
        </p>
      </div>

      {/* Distance Cards */}
      <div className="grid grid-cols-2 gap-2">
        {sortedDistances.map((distance, idx) => {
          /* -------------------------------
             No Data State (UNCHANGED LOGIC)
          -------------------------------- */
          if (distance.totalShots === 0) {
            return (
              <div
                key={idx}
                className=" bg-neutral-50 p-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold capitalize text-neutral-500">
                    {distance.originZone.replace(/-/g, " ")}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-neutral-400 border-neutral-300"
                  >
                    No data
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400">
                  No points recorded from this position.
                </p>
              </div>
            );
          }

          /* -------------------------------
             Styling Signals (UNCHANGED THRESHOLDS)
          -------------------------------- */
          const surfaceStyle =
            distance.winRate < 45
              ? "bg-red-500/5"
              : distance.winRate > 55
              ? "bg-[#3c6e71]/5"
              : "bg-amber-500/5";

          const badgeStyle =
            distance.winRate < 45
              ? "text-red-600 bg-red-500/10"
              : distance.winRate > 55
              ? "text-[#3c6e71] bg-[#3c6e71]/10"
              : "text-amber-600 bg-amber-500/10";

          return (
            <div
              key={idx}
              className={`p-2 ${surfaceStyle}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold capitalize text-neutral-900">
                  {distance.originZone.replace(/-/g, " ")}
                </h4>
                <Badge
                  className={`text-[10px] px-2 py-0.5 rounded-full ${badgeStyle}`}
                >
                  {distance.winRate.toFixed(0)}% win rate
                </Badge>
              </div>

              {/* Core Stats */}
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Total points</span>
                  <span className="font-semibold text-neutral-900">
                    {distance.totalShots}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Points won / Points lost</span>
                  <span className="font-semibold text-neutral-900">
                    <span className="text-green-600">
                      {distance.wins}
                    </span>
                    /
                    <span className="text-red-600">
                      {distance.losses}
                    </span>
                  </span>
                </div>
              </div>

              {/* Common Strokes */}
              {distance.commonStrokes.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] text-neutral-500">
                    Common strokes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {distance.commonStrokes
                      .slice(0, 3)
                      .map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[11px] border-neutral-300 text-neutral-700"
                        >
                          {formatStrokeName(s.stroke)} ({s.count})
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {distance.winRate < 50 && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600">
                    <RecommendationText
                      text={distance.recommendation}
                    />
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}