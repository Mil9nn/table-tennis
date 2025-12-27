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
  // Sort by distance (on-table → close → mid → far)
  const distanceOrder = [
    "on-table",
    "close-to-table",
    "mid-distance",
    "far-distance",
  ];
  const sortedDistances = [...distanceWeaknesses].sort(
    (a, b) =>
      distanceOrder.indexOf(a.originZone) - distanceOrder.indexOf(b.originZone)
  );

  const hasData = sortedDistances.some((d) => d.totalShots > 0);

  // Return null if no displayable data
  if (!hasData) {
    return null;
  }

  return (
    <div className="border border-[#d9d9d9] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#353535]">Distance from Table Analysis</h3>
        <p className="text-xs text-[#d9d9d9]">
          Your performance based on where you hit shots from
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedDistances.map((distance, idx) => {
          // Show all categories, but style differently if no data
          if (distance.totalShots === 0) {
            return (
              <div key={idx} className="p-3 border border-[#d9d9d9] bg-[#f8f8f8] opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize text-xs text-[#d9d9d9]">
                    {distance.originZone.replace(/-/g, " ")}
                  </h4>
                  <Badge variant="outline" className="text-[#d9d9d9] border-[#d9d9d9] text-xs">
                    No data
                  </Badge>
                </div>
                <div className="text-xs text-[#d9d9d9]">
                  No shots recorded from this position
                </div>
              </div>
            );
          }
          
          const bgColor =
            distance.winRate < 45
              ? "border-red-500/20 bg-red-500/5"
              : distance.winRate > 55
              ? "border-[#3c6e71]/20 bg-[#3c6e71]/5"
              : "border-amber-500/20 bg-amber-500/5";

          const badgeClass =
            distance.winRate < 45 
              ? "bg-red-500 text-white" 
              : distance.winRate > 55
              ? "bg-[#3c6e71] text-white"
              : "bg-amber-500 text-white";

          return (
            <div key={idx} className={`p-3 border ${bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold capitalize text-xs text-[#353535]">
                  {distance.originZone.replace(/-/g, " ")}
                </h4>
                <Badge className={`text-[10px] rounded-full px-1.5 py-0.5 ${badgeClass}`}>
                  {distance.winRate.toFixed(0)}%
                </Badge>
              </div>

              <div className="text-xs space-y-1 mb-2">
                <div className="flex justify-between">
                  <span className="text-[#353535]/70">Total Shots:</span>
                  <span className="font-semibold text-[#353535]">{distance.totalShots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#353535]/70">Won/Lost:</span>
                  <span className="font-semibold text-[#353535]">
                    <span className="text-green-600">{distance.wins}</span>/
                    <span className="text-red-600">{distance.losses}</span>
                  </span>
                </div>
              </div>

              {/* Common strokes at this distance */}
              {distance.commonStrokes.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-[#d9d9d9] mb-1">Common Strokes:</p>
                  <div className="flex flex-wrap gap-1">
                    {distance.commonStrokes.slice(0, 3).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-[#d9d9d9] text-[#353535]">
                        {formatStrokeName(s.stroke)} ({s.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {distance.winRate < 50 && (
                <p className="text-xs mt-2 pt-2 border-t border-[#d9d9d9] text-[#353535]/70">
                  <RecommendationText text={distance.recommendation} />
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
