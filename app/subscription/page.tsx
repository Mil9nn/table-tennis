"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Loader2,
  ArrowLeft,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const router = useRouter();
  const { subscription, loading } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [processing, setProcessing] = useState(false);

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      const res = await axiosInstance.post("/api/subscription/checkout", {
        tier: "pro",
        billingPeriod,
      });

      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Unable to start checkout");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#3c6e71]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfb] to-white">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Back */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* HERO */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-2xl font-bold text-[#353535] leading-tight">
            Unlock your competitive edge
          </h1>
          <p className="mt-4 text-[#353535]/70">
            Start free with powerful tournament tools. Upgrade to Pro when you want
            deeper insights, performance analytics, and no limits.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex bg-white border rounded-full p-1">
            {["monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setBillingPeriod(p as any)}
                className={`px-5 py-2 text-sm rounded-full transition ${
                  billingPeriod === p
                    ? "bg-[#3c6e71] text-white"
                    : "text-[#353535]/60 hover:text-[#353535]"
                }`}
              >
                {p === "monthly" ? "Monthly" : "Yearly (Best Value)"}
              </button>
            ))}
          </div>
        </div>

        {/* PRICING GRID */}
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* FREE */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Free</h3>
            <p className="text-sm text-[#353535]/60 mb-4">
              Powerful essentials with sensible limits
            </p>

            <p className="text-3xl font-bold mb-6">₹0</p>

            <ul className="space-y-3 text-sm text-[#353535]/80">
              {[
                "Unlimited matches & scoring",
                "Player & team statistics",
                "Tournament management",
                "Up to 20 players or 10 teams per tournament",
                "All tournament formats",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-[#353535]/60" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button disabled className="w-full">
                Current Plan
              </Button>
            </div>
          </div>

          {/* PRO */}
          <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-[#3c6e71]/30">

            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3c6e71]/20 to-transparent blur-xl rounded-2xl -z-10" />

            <div className="mb-2">
              <h3 className="text-xl font-bold">Pro</h3>
            </div>

            <p className="text-sm text-[#353535]/70 mb-6">
              Built for serious players and competitive tournaments
            </p>

            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-bold">₹2</span>
              <span className="text-sm text-[#353535]/60">
                /{billingPeriod}
              </span>
            </div>

            {/* Feature Blocks */}
            <div className="space-y-5 text-sm text-[#353535]/80">

              <div>
                <div className="flex items-center gap-2 font-medium mb-2 text-[#353535]">
                  <BarChart3 className="w-4 h-4 text-[#3c6e71]" />
                  Advanced Analytics
                </div>
                Shot heatmaps, trends, and performance insights
              </div>

              <div>
                <div className="flex items-center gap-2 font-medium mb-2 text-[#353535]">
                  <Sparkles className="w-4 h-4 text-[#3c6e71]" />
                  Competitive Advantage
                </div>
                Global leaderboards, advanced stats, exports
              </div>

              <div>
                <div className="flex items-center gap-2 font-medium mb-2 text-[#353535]">
                  <ShieldCheck className="w-4 h-4 text-[#3c6e71]" />
                  No Limits
                </div>
                Unlimited participants, branding, and data access
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleUpgrade}
                disabled={processing || subscription?.tier === "pro"}
                className="w-full bg-[#3c6e71] hover:bg-[#3c6e71]/90"
              >
                {processing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Upgrade to Pro"
                )}
              </Button>

              <p className="text-xs text-center text-[#353535]/60 mt-3">
                Cancel anytime • No data loss • Secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
