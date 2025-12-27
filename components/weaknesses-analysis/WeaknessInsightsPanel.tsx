// components/weaknesses-analysis/WeaknessInsightsPanel.tsx

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import { OverallInsights } from "@/types/weaknesses.type";
import { RecommendationText } from "./RecommendationText";

interface WeaknessInsightsPanelProps {
  insights: OverallInsights;
}

export function WeaknessInsightsPanel({ insights }: WeaknessInsightsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Primary Weakness Alert */}
      <Alert className="border-red-500/20 bg-red-500/5">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="ml-2">
          <div className="space-y-1">
            <p className="font-semibold text-red-700 text-sm">Primary Weakness</p>
            <p className="text-sm text-red-700/80">
              <RecommendationText text={insights.primaryWeakness} />
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Secondary Weakness */}
        {insights.secondaryWeakness && (
          <div className="border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-700 text-sm">
                  Secondary Weakness
                </p>
                <p className="text-sm text-amber-700/80">
                  <RecommendationText text={insights.secondaryWeakness} />
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strength to Maintain */}
        <div className="border border-[#3c6e71]/20 bg-[#3c6e71]/5 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-[#3c6e71] mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#3c6e71] text-sm">
                Strength to Maintain
              </p>
              <p className="text-sm text-[#3c6e71]/80">
                <RecommendationText text={insights.strengthToMaintain} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Priorities */}
      {insights.improvementPriority.length > 0 && (
        <div className="border border-[#d9d9d9] bg-white p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-[#284b63]" />
            <h3 className="text-base font-semibold text-[#353535]">Priority Improvements</h3>
          </div>
          <div className="space-y-3">
            {insights.improvementPriority.map((priority, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[#f8f8f8] hover:bg-[#f0f0f0] transition-colors"
              >
                <Badge
                  variant={index === 0 ? "destructive" : "secondary"}
                  className={`mt-0.5 shrink-0 ${index === 0 ? '' : 'bg-[#d9d9d9] text-[#353535]'}`}
                >
                  #{index + 1}
                </Badge>
                <p className="text-sm text-[#353535] flex-1">
                  <RecommendationText text={priority} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
