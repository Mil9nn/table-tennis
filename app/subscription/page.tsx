"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading } = useSubscription();
  const [processing, setProcessing] = useState(false);
  const feature = searchParams.get("feature");

  const handleUpgrade = async (billingPeriod: "monthly" | "yearly") => {
    try {
      setProcessing(true);
      const response = await axiosInstance.post("/api/subscription/checkout", {
        tier: "pro",
        billingPeriod,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error(error.response?.data?.message || "Failed to start upgrade process");
    } finally {
      setProcessing(false);
    }
  };

  const proFeatures = [
    "Full match statistics and analysis",
    "Complete weakness analysis",
    "Advanced heatmaps and wagon wheel",
    "Per-player shot breakdowns",
    "Performance insights and trends",
    "Shot analysis and zone statistics",
    "Export match data (CSV/PDF)",
    "Unlimited match history",
  ];

  const freeFeatures = [
    { text: "Unlimited match participation", included: true },
    { text: "Basic statistics (W/L, sets, points)", included: true },
    { text: "Last 20 matches", included: true },
    { text: "Basic shot tracking", included: true },
    { text: "Create 2 tournaments/year", included: true },
    { text: "Max 16 participants", included: true },
    { text: "Round-robin only", included: true },
    { text: "Advanced analytics", included: false },
    { text: "Data exports", included: false },
    { text: "Multi-scorer", included: false },
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#3c6e71]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-[#353535] hover:text-[#3c6e71]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Subscription Plans
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
          <p className="text-sm text-[#353535]/70 mt-4 max-w-2xl">
            Start free, upgrade when you need more. Choose monthly or yearly billing.
          </p>
        </div>

        {/* Current Plan Badge */}
        {subscription && subscription.tier !== "free" && (
          <div className="mb-8 p-4 bg-[#3c6e71]/10 border border-[#3c6e71] rounded-lg">
            <p className="text-sm text-[#353535]">
              Current Plan: <span className="font-semibold capitalize">{subscription.tier}</span>
            </p>
          </div>
        )}

        {/* Feature Context */}
        {feature && (
          <div className="mb-8 p-4 bg-[#f5f5f5] border border-[#d9d9d9] rounded-lg">
            <p className="text-sm text-[#353535]">
              You're viewing this page to unlock: <span className="font-semibold">{feature}</span>
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Free Tier */}
          <div className="bg-[#ffffff] border-2 border-[#d9d9d9] rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#353535] mb-2">Free</h3>
              <p className="text-sm text-[#353535]/70 mb-4">
                Perfect for casual players
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#353535]">₹0</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {feature.included ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CancelIcon className="w-5 h-5 text-neutral-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${feature.included ? "text-[#353535]" : "text-neutral-400"}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {subscription?.tier === "free" ? (
              <Button
                disabled
                className="w-full bg-neutral-300 text-neutral-600 cursor-not-allowed"
              >
                Current Plan
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full border-[#d9d9d9] hover:bg-[#f5f5f5]"
              >
                <Link href="/auth/register">Get Started</Link>
              </Button>
            )}
          </div>
          {/* Pro Monthly */}
          <div className="bg-[#ffffff] border-2 border-[#d9d9d9] rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#353535] mb-2">Pro - Monthly</h3>
              <p className="text-sm text-[#353535]/70 mb-4">
                Perfect for serious players and regular competitors
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#353535]">₹2</span>
                <span className="text-sm text-[#353535]/70">/month</span>
                <span className="text-xs text-[#3c6e71] ml-2">Testing</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#3c6e71] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#353535]">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade("monthly")}
              disabled={processing || subscription?.tier === "pro"}
              className="w-full bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-white"
            >
              {subscription?.tier === "pro" ? (
                "Current Plan"
              ) : processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Subscribe Monthly
                </>
              )}
            </Button>
          </div>

          {/* Pro Yearly */}
          <div className="bg-[#ffffff] border-2 border-[#3c6e71] rounded-lg p-6 relative">
            <div className="absolute top-4 right-4 bg-[#3c6e71] text-white text-xs px-2 py-1 rounded">
              Best Value
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#353535] mb-2">Pro - Yearly</h3>
              <p className="text-sm text-[#353535]/70 mb-4">
                Best value for regular users
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#353535]">₹2</span>
                <span className="text-sm text-[#353535]/70">/year</span>
                <span className="text-xs text-[#3c6e71] ml-2">Testing Price</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#3c6e71] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#353535]">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade("yearly")}
              disabled={processing || subscription?.tier === "pro"}
              className="w-full bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-white"
            >
              {subscription?.tier === "pro" ? (
                "Current Plan"
              ) : processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Subscribe Yearly
                </>
              )}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-[#353535] mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-[#353535] mb-2">
                What's the difference between Monthly and Yearly?
              </h3>
              <p className="text-[#353535]/70">
                Both plans include the same Pro features. The yearly plan offers better value
                with a discount compared to monthly billing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#353535] mb-2">
                Can I switch between plans?
              </h3>
              <p className="text-[#353535]/70">
                Yes! You can switch between monthly and yearly plans. The new billing cycle
                starts at your next renewal date.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#353535] mb-2">
                What happens if I cancel my subscription?
              </h3>
              <p className="text-[#353535]/70">
                Your data is never deleted. If you cancel a subscription, you'll keep Pro
                features until the end of your billing period, then return to the Free tier.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#353535] mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-[#353535]/70">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[#353535] mb-4">
            Ready to elevate your game?
          </h2>
          <p className="text-[#353535]/70 mb-8 max-w-2xl mx-auto">
            Join thousands of players and organizers using our platform to track,
            analyze, and improve their table tennis performance.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-white"
          >
            <Link href="/auth/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
