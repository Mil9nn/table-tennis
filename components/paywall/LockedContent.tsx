"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SubscriptionTier } from "@/models/Subscription";

interface LockedContentProps {
  feature?: string;
  requiredTier?: SubscriptionTier;
  title?: string;
  description?: string;
  showUpgradeButton?: boolean;
}

export function LockedContent({
  feature,
  requiredTier,
  title,
  description,
  showUpgradeButton = true,
}: LockedContentProps) {
  const router = useRouter();

  const getFeatureInfo = () => {
    if (title && description) {
      return { title, description };
    }

    if (feature === "profileInsightsAccess") {
      return {
        title: "Performance Insights",
        description: "Unlock advanced weakness analysis, zone heatmaps, and opponent pattern analysis",
      };
    }

    if (feature === "shotAnalysisAccess") {
      return {
        title: "Shot Analysis",
        description: "Access complete heatmap grids, wagon wheel visualizations, and zone/sector breakdowns",
      };
    }

    if (feature === "statsPageAccess" || requiredTier) {
      return {
        title: "Advanced Match Analytics",
        description: "Unlock full match analysis with detailed shot placement, weakness analysis, and AI-powered insights",
      };
    }

    return {
      title: "Pro Feature",
      description: "Upgrade to Pro to unlock this feature",
    };
  };

  const { title: featureTitle, description: featureDescription } = getFeatureInfo();

  const handleUpgrade = () => {
    router.push("/subscription?feature=" + (feature || "general"));
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#d9d9d9] rounded-lg">
      <div className="mb-4">
        <div className="w-16 h-16 bg-[#3c6e71]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-[#3c6e71]" />
        </div>
        <h3 className="text-lg font-semibold text-[#353535] text-center mb-2">
          {featureTitle}
        </h3>
        <p className="text-sm text-[#353535]/70 text-center max-w-md">
          {featureDescription}
        </p>
      </div>

      {showUpgradeButton && (
        <div className="flex flex-col gap-2 items-center">
          <Button
            onClick={handleUpgrade}
            className="bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
          <p className="text-xs text-[#353535]/60">
            Starting at ₹2/month or ₹2/year (Testing Price)
          </p>
        </div>
      )}
    </div>
  );
}

