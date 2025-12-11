// components/weaknesses-analysis/OriginDistanceAnalysis.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const hasData = sortedDistances.filter((d) => d.totalShots >= 3).length > 0;

  // Return null if no displayable data
  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distance from Table Analysis</CardTitle>
        <p className="text-sm text-gray-500">
          Your performance based on where you hit shots from
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {sortedDistances
            .filter((d) => d.totalShots >= 3)
            .map((distance, idx) => {
              const bgColor =
                distance.winRate < 45
                  ? "border-red-300 bg-red-50"
                  : distance.winRate > 55
                  ? "border-green-300 bg-green-50"
                  : "border-yellow-300 bg-yellow-50";

              const badgeVariant =
                distance.winRate < 45 ? "destructive" : "secondary";

              return (
                <div key={idx} className={`p-4 border rounded-lg ${bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize text-sm">
                      {distance.originZone.replace(/-/g, " ")}
                    </h4>
                    <Badge variant={badgeVariant}>
                      {distance.winRate.toFixed(0)}%
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Shots:</span>
                      <span className="font-semibold">{distance.totalShots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">W/L:</span>
                      <span className="font-semibold">
                        {distance.wins}/{distance.losses}
                      </span>
                    </div>
                  </div>

                  {/* Common strokes at this distance */}
                  {distance.commonStrokes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Common Strokes:</p>
                      <div className="flex flex-wrap gap-1">
                        {distance.commonStrokes.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {formatStrokeName(s.stroke)} ({s.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {distance.winRate < 50 && (
                    <p className="text-xs mt-3 pt-3 border-t">
                      <RecommendationText text={distance.recommendation} />
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
