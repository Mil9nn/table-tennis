// components/weaknesses-analysis/WeaknessInsightsPanel.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="ml-2">
          <div className="space-y-1">
            <p className="font-semibold text-red-900">Primary Weakness</p>
            <p className="text-sm text-red-800">
              <RecommendationText text={insights.primaryWeakness} />
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Secondary Weakness */}
        {insights.secondaryWeakness && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-yellow-600 mt-1" />
                <div className="space-y-1">
                  <p className="font-semibold text-yellow-900 text-sm">
                    Secondary Weakness
                  </p>
                  <p className="text-sm text-yellow-800">
                    <RecommendationText text={insights.secondaryWeakness} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strength to Maintain */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 text-sm">
                  Strength to Maintain
                </p>
                <p className="text-sm text-green-800">
                  <RecommendationText text={insights.strengthToMaintain} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Priorities */}
      {insights.improvementPriority.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Priority Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.improvementPriority.map((priority, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Badge
                    variant={index === 0 ? "destructive" : "secondary"}
                    className="mt-0.5 shrink-0"
                  >
                    #{index + 1}
                  </Badge>
                  <p className="text-sm text-gray-700 flex-1">
                    <RecommendationText text={priority} />
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
