"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { LockedContent } from "./paywall/LockedContent";
import { SubscriptionTier } from "@/models/Subscription";

interface FeatureGateProps {
  feature?: keyof ReturnType<typeof useSubscription>['subscription']['features'];
  requiredTier?: SubscriptionTier;
  fallback?: ReactNode;
  children: ReactNode;
  showPreview?: boolean; // Show blurred preview for locked content
}

export function FeatureGate({
  feature,
  requiredTier,
  fallback,
  children,
  showPreview = false,
}: FeatureGateProps) {
  const { hasFeature, hasTier, isLocked, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded" />;
  }

  // Check by tier if specified
  if (requiredTier) {
    if (!hasTier(requiredTier)) {
      return fallback || <LockedContent requiredTier={requiredTier} />;
    }
    return <>{children}</>;
  }

  // Check by feature if specified
  if (feature) {
    if (isLocked(feature)) {
      if (showPreview) {
        return (
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <LockedContent feature={feature} />
            </div>
          </div>
        );
      }
      return fallback || <LockedContent feature={feature} />;
    }
    return <>{children}</>;
  }

  // If no feature or tier specified, show children
  return <>{children}</>;
}

