// components/weaknesses-analysis/WeaknessInsightsPanel.tsx

import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  TrendingUp,
  Target,
  CheckCircle2,
} from "lucide-react";
import { OverallInsights } from "@/types/weaknesses.type";
import { RecommendationText } from "./RecommendationText";

interface Props {
  insights: OverallInsights;
}

export function WeaknessInsightsPanel({ insights }: Props) {
  return (
    <section className="space-y-6">
      {/* Primary insight */}
      <div className="rounded-xl bg-[#fafafa] px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#b45309]" />
          <span className="text-sm font-semibold text-[#353535]">
            Primary weakness
          </span>
        </div>
        <p className="text-sm text-[#4b5563] leading-relaxed">
          <RecommendationText
            text={insights.primaryWeakness}
          />
        </p>
      </div>

      {/* Secondary + strength */}
      <div className="grid gap-4 md:grid-cols-2">
        {insights.secondaryWeakness && (
          <div className="rounded-lg bg-white px-4 py-3 shadow-[0_0_0_1px_#e6e8eb]">
            <div className="mb-1 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#6b7280]" />
              <span className="text-sm font-medium text-[#353535]">
                Secondary weakness
              </span>
            </div>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              <RecommendationText
                text={insights.secondaryWeakness}
              />
            </p>
          </div>
        )}

        <div className="rounded-lg bg-white px-4 py-3 shadow-[0_0_0_1px_#e6e8eb]">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#3c6e71]" />
            <span className="text-sm font-medium text-[#353535]">
              Strength to maintain
            </span>
          </div>
          <p className="text-sm text-[#6b7280] leading-relaxed">
            <RecommendationText
              text={insights.strengthToMaintain}
            />
          </p>
        </div>
      </div>

      {/* Improvement priorities */}
      {insights.improvementPriority.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#284b63]" />
            <h4 className="text-sm font-semibold text-[#353535]">
              Focus areas
            </h4>
          </div>

          <ul className="space-y-2">
            {insights.improvementPriority.map(
              (item, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-md bg-[#fafafa] px-3 py-2"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs"
                  >
                    {idx + 1}
                  </Badge>
                  <p className="text-sm text-[#4b5563]">
                    <RecommendationText text={item} />
                  </p>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
