// components/weaknesses-analysis/OpponentPatternAnalysis.tsx

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
      <div className="border border-[#d9d9d9] bg-white p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#353535]" />
          <h3 className="text-base font-semibold text-[#353535]">Opponent Patterns</h3>
        </div>
        <p className="text-sm text-[#d9d9d9]">
          No significant opponent patterns identified yet. Play more matches to see what
          strategies opponents use against you.
        </p>
      </div>
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
        color: "text-red-600",
        bgColor: "bg-red-500/5 border-red-500/20",
      };
    if (rate >= 60)
      return {
        label: "High",
        color: "text-amber-600",
        bgColor: "bg-amber-500/5 border-amber-500/20",
      };
    if (rate >= 50)
      return {
        label: "Medium",
        color: "text-amber-600",
        bgColor: "bg-amber-500/5 border-amber-500/20",
      };
    return {
      label: "Low",
      color: "text-[#353535]",
      bgColor: "bg-[#f8f8f8] border-[#d9d9d9]",
    };
  };

  return (
    <div className="border border-[#d9d9d9] bg-white p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-semibold text-[#353535]">What Opponents Use Against You</h3>
        </div>
        <p className="text-xs text-[#d9d9d9]">
          Shots and strategies that opponents successfully use to win points
        </p>
      </div>

      <div className="space-y-3">
        {displayPatterns.map((pattern, index) => {
          const effectiveness = getEffectivenessLevel(pattern.effectivenessRate);

          return (
            <div
              key={index}
              className={`p-4 border ${effectiveness.bgColor} transition-all`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Stroke Name and Badge */}
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-[#353535]">
                      {formatStrokeName(pattern.stroke)}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={`${effectiveness.color} text-xs bg-transparent`}
                    >
                      {effectiveness.label} Threat
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-xs text-[#353535]/70">
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
                    <div className="text-xs text-[#353535]/70">
                      <span className="font-semibold">Common zones:</span>{" "}
                      {pattern.commonZones.join(", ")}
                    </div>
                  )}

                  {/* Recommendation */}
                  <p className="text-xs italic text-[#353535]/60 mt-2 pt-2 border-t border-[#d9d9d9]">
                    <RecommendationText text={pattern.recommendation} />
                  </p>
                </div>

                {/* Rank Number */}
                <div className="text-2xl font-bold text-[#d9d9d9]">#{index + 1}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Note */}
      <div className="mt-4 p-3 bg-[#284b63]/5 border border-[#284b63]/20">
        <p className="text-xs text-[#284b63]">
          <strong>Tip:</strong> Focus on defending against these top opponent strategies.
          Practice counter-shots and anticipate these patterns during matches.
        </p>
      </div>
    </div>
  );
}
