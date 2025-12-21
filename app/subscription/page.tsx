"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

interface SubscriptionSummary {
  tier: string;
  status: string;
  isActive: boolean;
  isInTrial: boolean;
  features: any;
  currentPeriodEnd: string;
  daysUntilRenewal: number;
  daysUntilTrialEnd: number | null;
  tournamentsCreated: number;
  tournamentsLimit: number;
  canUpgrade: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        console.error("Failed to fetch subscription");
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);

    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      alert("Failed to open subscription management. Please try again.");
      setManagingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-2xl font-bold text-neutral-900">No Subscription Found</h2>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">
              We couldn't find your subscription. This is unusual.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "text-blue-600";
      case "premium":
        return "text-purple-600";
      case "enterprise":
        return "text-orange-600";
      default:
        return "text-neutral-600";
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            My Subscription
          </h1>
          <p className="text-neutral-600">
            Manage your subscription and view usage details
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Current Plan
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-3xl font-bold capitalize ${getTierColor(
                      subscription.tier
                    )}`}
                  >
                    {subscription.tier}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierBadge(
                      subscription.tier
                    )}`}
                  >
                    {subscription.isInTrial ? "Trial" : subscription.status}
                  </span>
                </div>
              </div>
              {subscription.tier !== "free" && subscription.isActive && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  variant="outline"
                >
                  {managingSubscription ? "Loading..." : "Manage Subscription"}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Status */}
              <div className="flex items-start gap-3">
                <CheckCircleIcon
                  className={
                    subscription.isActive ? "text-green-500" : "text-neutral-300"
                  }
                />
                <div>
                  <p className="text-sm text-neutral-600">Status</p>
                  <p className="text-lg font-semibold text-neutral-900 capitalize">
                    {subscription.isActive ? "Active" : subscription.status}
                  </p>
                </div>
              </div>

              {/* Renewal Date */}
              {subscription.tier !== "free" && (
                <div className="flex items-start gap-3">
                  <CalendarTodayIcon className="text-blue-500" />
                  <div>
                    <p className="text-sm text-neutral-600">
                      {subscription.isInTrial ? "Trial Ends" : "Renews"}
                    </p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {subscription.isInTrial
                        ? `${subscription.daysUntilTrialEnd} days`
                        : `${subscription.daysUntilRenewal} days`}
                    </p>
                  </div>
                </div>
              )}

              {/* Tournaments */}
              <div className="flex items-start gap-3">
                <EmojiEventsIcon className="text-orange-500" />
                <div>
                  <p className="text-sm text-neutral-600">Tournaments</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {subscription.tournamentsCreated} /{" "}
                    {subscription.tournamentsLimit === -1
                      ? "∞"
                      : subscription.tournamentsLimit}
                  </p>
                </div>
              </div>
            </div>

            {subscription.isInTrial && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>You're in trial mode!</strong> Your trial ends in{" "}
                  {subscription.daysUntilTrialEnd} days. You won't be charged
                  until the trial period ends.
                </p>
              </div>
            )}
          </CardContent>

          {subscription.canUpgrade && (
            <CardFooter>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/pricing">
                  <TrendingUpIcon className="mr-2" />
                  Upgrade Plan
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-neutral-900">
              Your Features
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className={
                    subscription.features.advancedAnalytics
                      ? "text-green-500"
                      : "text-neutral-300"
                  }
                />
                <span
                  className={
                    subscription.features.advancedAnalytics
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }
                >
                  Advanced Analytics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className={
                    subscription.features.exportData
                      ? "text-green-500"
                      : "text-neutral-300"
                  }
                />
                <span
                  className={
                    subscription.features.exportData
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }
                >
                  Data Export (CSV/PDF)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className={
                    subscription.features.customBranding
                      ? "text-green-500"
                      : "text-neutral-300"
                  }
                />
                <span
                  className={
                    subscription.features.customBranding
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }
                >
                  Custom Branding
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircleIcon className="text-green-500" />
                <span className="text-neutral-900">
                  {subscription.features.maxScorers === 0
                    ? "Self-scoring only"
                    : `Up to ${subscription.features.maxScorers} scorers`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircleIcon className="text-green-500" />
                <span className="text-neutral-900">
                  Formats:{" "}
                  {subscription.features.tournamentFormats.join(", ").replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircleIcon className="text-green-500" />
                <span className="text-neutral-900">
                  Max Participants:{" "}
                  {subscription.features.maxParticipants === -1
                    ? "Unlimited"
                    : subscription.features.maxParticipants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-neutral-600 mb-4">
            Need help with your subscription?
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/pricing">View All Plans</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:support@yourtabletennis.com">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
