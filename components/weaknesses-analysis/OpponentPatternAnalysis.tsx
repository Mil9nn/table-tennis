// components/weaknesses-analysis/OpponentPatternAnalysis.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpponentPattern } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { RecommendationText } from "./RecommendationText";

interface OpponentPatternAnalysisProps {
  patterns: OpponentPattern[];
  maxDisplay?: number;
}

export function OpponentPatternAnalysis({
  patterns,
  maxDisplay = 5,
}: OpponentPatternAnalysisProps) {
  const displayPatterns = patterns.slice(0, maxDisplay);

  if (displayPatterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Opponent Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No significant opponent patterns identified yet. Play more matches to see what
            strategies opponents use against you.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEffectivenessLevel = (rate: number): {
    label: string;
    color: string;
    bgColor: string;
  } => {
    if (rate >= 70)
      return {
        label: "Critical",
        color: "text-red-700",
        bgColor: "bg-red-100 border-red-300",
      };
    if (rate >= 60)
      return {
        label: "High",
        color: "text-orange-700",
        bgColor: "bg-orange-100 border-orange-300",
      };
    if (rate >= 50)
      return {
        label: "Medium",
        color: "text-yellow-700",
        bgColor: "bg-yellow-100 border-yellow-300",
      };
    return {
      label: "Low",
      color: "text-gray-700",
      bgColor: "bg-gray-100 border-gray-300",
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          What Opponents Use Against You
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Shots and strategies that opponents successfully use to win points
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayPatterns.map((pattern, index) => {
            const effectiveness = getEffectivenessLevel(pattern.effectivenessRate);

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${effectiveness.bgColor} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Stroke Name and Badge */}
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">
                        {formatStrokeName(pattern.stroke)}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`${effectiveness.color} text-xs`}
                      >
                        {effectiveness.label} Threat
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-xs text-gray-600">
                      <div>
                        <span className="font-semibold">{pattern.timesUsed}</span>{" "}
                        times used
                      </div>
                      <div>
                        <span className="font-semibold">
                          {pattern.pointsWonByOpponent}
                        </span>{" "}
                        points won
                      </div>
                      <div className={effectiveness.color}>
                        <span className="font-semibold">
                          {pattern.effectivenessRate.toFixed(1)}%
                        </span>{" "}
                        success rate
                      </div>
                    </div>

                    {/* Common Zones */}
                    {pattern.commonZones.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Common zones:</span>{" "}
                        {pattern.commonZones.join(", ")}
                      </div>
                    )}

                    {/* Recommendation */}
                    <p className="text-xs italic text-gray-500 mt-2 pt-2 border-t border-gray-300">
                      <RecommendationText text={pattern.recommendation} />
                    </p>
                  </div>

                  {/* Rank Number */}
                  <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Focus on defending against these top opponent strategies.
            Practice counter-shots and anticipate these patterns during matches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
