"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { SubscriptionTier } from "@/models/Subscription";

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: "active" | "past_due" | "cancelled" | "expired";
  features: {
    statsPageAccess: 'free' | 'pro';
    profileInsightsAccess: boolean;
    shotAnalysisAccess: boolean;
    aiInsights: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
  isActive: boolean;
}

export function useSubscription() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get("/subscription/current");
        if (response.data?.subscription) {
          const sub = response.data.subscription;
          setSubscription({
            tier: sub.tier || "free",
            status: sub.status || "active",
            features: {
              statsPageAccess: sub.features?.statsPageAccess || 'free',
              profileInsightsAccess: sub.features?.profileInsightsAccess || false,
              shotAnalysisAccess: sub.features?.shotAnalysisAccess || false,
              aiInsights: sub.features?.aiInsights || false,
              advancedAnalytics: sub.features?.advancedAnalytics || false,
              exportData: sub.features?.exportData || false,
            },
            isActive: sub.status === "active",
          });
        } else {
          // Default to free tier
          setSubscription({
            tier: "free",
            status: "active",
            features: {
              statsPageAccess: 'free',
              profileInsightsAccess: false,
              shotAnalysisAccess: false,
              aiInsights: false,
              advancedAnalytics: false,
              exportData: false,
            },
            isActive: true,
          });
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
        // Default to free tier on error
        setSubscription({
          tier: "free",
          status: "active",
          features: {
            statsPageAccess: 'free',
            profileInsightsAccess: false,
            shotAnalysisAccess: false,
            aiInsights: false,
            advancedAnalytics: false,
            exportData: false,
          },
          isActive: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user?._id]);

  const hasFeature = (feature: keyof SubscriptionData['features']): boolean => {
    // TEMPORARILY DISABLED: Always allow access for frontend development
    return true;
    // if (!subscription) return false;
    // return subscription.features[feature] === true || subscription.features[feature] === 'pro';
  };

  const hasTier = (requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      enterprise: 2,
    };
    return tierHierarchy[subscription.tier] >= tierHierarchy[requiredTier];
  };

  const isLocked = (feature: keyof SubscriptionData['features']): boolean => {
    // TEMPORARILY DISABLED: Never lock features for frontend development
    return false;
    // return !hasFeature(feature);
  };

  const canAccessStatsPage = (): boolean => {
    // TEMPORARILY DISABLED: Always allow access for frontend development
    return true;
    // if (!subscription) return false;
    // return subscription.features.statsPageAccess !== 'free';
  };

  return {
    subscription,
    loading,
    tier: subscription?.tier || "free",
    hasFeature,
    hasTier,
    isLocked,
    canAccessStatsPage,
    isActive: subscription?.isActive || false,
  };
}

