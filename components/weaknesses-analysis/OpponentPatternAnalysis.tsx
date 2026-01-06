// components/weaknesses-analysis/OpponentPatternAnalysis.tsx

import { Badge } from "@/components/ui/badge";
import { OpponentPattern } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
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

  const getThreatMeta = (rate: number) => {
    if (rate >= 70)
      return {
        label: "Critical",
        accent: "text-red-600",
        surface: "bg-red-500/5",
      };
    if (rate >= 60)
      return {
        label: "High",
        accent: "text-amber-600",
        surface: "bg-amber-500/5",
      };
    return {
      label: "Moderate",
      accent: "text-[#284b63]",
      surface: "bg-[#284b63]/5",
    };
  };

  if (displayPatterns.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-800">
          Opponent Patterns
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          No consistent opponent strategies detected yet. As more matches are
          recorded, actionable patterns will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-neutral-900">
          Opponent Exploit Patterns
        </h3>
      </div>


      {/* Patterns */}
      <div className="space-y-4">
        {displayPatterns.map((pattern, index) => {
          const threat = getThreatMeta(pattern.effectivenessRate);

          return (
            <div
              key={index}
              className={`rounded-md p-4 ${threat.surface}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  {/* Title */}
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900">
                      {formatStrokeName(pattern.stroke)}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] ${threat.accent} bg-transparent`}
                    >
                      {threat.label}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-600">
                    <span>
                      <strong className="text-neutral-900">
                        {pattern.count}
                      </strong>{" "}
                      points won by opponent
                    </span>
                    <span className={threat.accent}>
                      <strong>
                        {pattern.effectivenessRate.toFixed(1)}%
                      </strong>{" "}
                      of opponent's total points won
                    </span>
                  </div>

                  {/* Zones */}
                  {pattern.commonZones.length > 0 && (
                    <div className="text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">
                        Target zones:
                      </span>{" "}
                      {pattern.commonZones.join(", ")}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="pt-2 text-xs text-neutral-500">
                    <RecommendationText text={pattern.recommendation} />
                  </div>
                </div>

                {/* Rank */}
                <div className="text-sm font-semibold text-neutral-400">
                  #{index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      <div className="mt-5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
        Focus defensive training on these high-impact patterns. Anticipation and
        early positioning will significantly reduce point leakage.
      </div>
    </div>
  );
}