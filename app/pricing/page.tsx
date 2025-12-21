"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import StarIcon from "@mui/icons-material/Star";
import { useRouter } from "next/navigation";

interface PricingTier {
  name: string;
  price: string;
  priceAmount: number;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  cta: string;
  tier: "free" | "lifetime" | "annual" | "three_month";
  billingPeriod?: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    priceAmount: 0,
    description: "Perfect for casual players",
    tier: "free",
    cta: "Get Started",
    features: [
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
    ],
  },
  {
    name: "Pro - Lifetime",
    price: "$50",
    priceAmount: 50,
    description: "One-time payment, yours forever",
    tier: "lifetime",
    cta: "Buy Lifetime",
    billingPeriod: "One-time payment",
    highlighted: true,
    features: [
      { text: "Everything in Free, PLUS:", included: true },
      { text: "Unlimited match history", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Weaknesses analysis & heatmaps", included: true },
      { text: "AI-generated insights", included: true },
      { text: "Export data (CSV/PDF)", included: true },
      { text: "Create 10 tournaments/year", included: true },
      { text: "Max 50 participants", included: true },
      { text: "All tournament formats", included: true },
      { text: "Multi-scorer (up to 3)", included: true },
    ],
  },
  {
    name: "Pro - Annual",
    price: "$4.50",
    priceAmount: 4.5,
    description: "Best value for regular users",
    tier: "annual",
    cta: "Start Annual",
    billingPeriod: "per year",
    features: [
      { text: "Everything in Free, PLUS:", included: true },
      { text: "Unlimited match history", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Weaknesses analysis & heatmaps", included: true },
      { text: "AI-generated insights", included: true },
      { text: "Export data (CSV/PDF)", included: true },
      { text: "Create 10 tournaments/year", included: true },
      { text: "Max 50 participants", included: true },
      { text: "All tournament formats", included: true },
      { text: "Multi-scorer (up to 3)", included: true },
    ],
  },
  {
    name: "Pro - 3 Months",
    price: "$2.50",
    priceAmount: 2.5,
    description: "Try it out for a season",
    tier: "three_month",
    cta: "Start 3-Month",
    billingPeriod: "per 3 months",
    features: [
      { text: "Everything in Free, PLUS:", included: true },
      { text: "Unlimited match history", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Weaknesses analysis & heatmaps", included: true },
      { text: "AI-generated insights", included: true },
      { text: "Export data (CSV/PDF)", included: true },
      { text: "Create 10 tournaments/year", included: true },
      { text: "Max 50 participants", included: true },
      { text: "All tournament formats", included: true },
      { text: "Multi-scorer (up to 3)", included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>("free");

  useEffect(() => {
    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setCurrentTier(data.tier);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, []);

  const handleUpgrade = async (tier: "lifetime" | "annual" | "three_month") => {
    setLoading(tier);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Header */}
      <section className="px-6 sm:px-8 py-16 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-4">
            Start free, upgrade when you need more. Choose{" "}
            <span className="font-semibold text-blue-600">lifetime</span> or flexible billing.
          </p>
          <p className="text-sm text-neutral-500">
            Lifetime • Annual • Quarterly • 30-day money-back guarantee
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 sm:px-8 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={tier.highlighted ? "md:-mt-4" : ""}
            >
              <Card
                className={`relative h-full flex flex-col ${
                  tier.highlighted
                    ? "border-2 border-blue-500 shadow-xl"
                    : "border border-neutral-200"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <StarIcon fontSize="small" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-neutral-900">
                      {tier.price}
                    </span>
                    {tier.billingPeriod && (
                      <div className="text-sm text-neutral-600 mt-1">
                        {tier.billingPeriod}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">{tier.description}</p>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {feature.included ? (
                          <CheckCircleIcon className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CancelIcon className="text-neutral-300 mt-0.5 flex-shrink-0" />
                        )}
                        <span
                          className={
                            feature.included
                              ? "text-neutral-700"
                              : "text-neutral-400"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  {currentTier === tier.tier ? (
                    <Button
                      disabled
                      className="w-full bg-neutral-300 text-neutral-600 cursor-not-allowed"
                    >
                      Current Plan
                    </Button>
                  ) : tier.tier === "free" ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-neutral-300 hover:bg-neutral-50"
                    >
                      <Link href="/auth/register">{tier.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(tier.tier as "lifetime" | "annual" | "three_month")}
                      disabled={loading !== null}
                      className={`w-full ${
                        tier.highlighted
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-neutral-900 hover:bg-neutral-800"
                      } text-white`}
                    >
                      {loading === tier.tier ? "Loading..." : tier.cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 sm:px-8 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                What's the difference between Lifetime, Annual, and 3-Month?
              </h3>
              <p className="text-neutral-600">
                All Pro plans include the same features. Lifetime is a one-time payment
                with access forever. Annual and 3-Month are recurring subscriptions that
                you can cancel anytime.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Can I switch between plans?
              </h3>
              <p className="text-neutral-600">
                Yes! You can upgrade from a subscription to Lifetime anytime. For subscription
                changes, the new billing cycle starts at your next renewal date.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                What happens if I cancel my subscription?
              </h3>
              <p className="text-neutral-600">
                Your data is never deleted. If you cancel a subscription, you'll keep Pro
                features until the end of your billing period, then return to the Free tier.
                Lifetime purchases never expire.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-neutral-600">
                Yes, we offer a 30-day money-back guarantee for all paid plans, including
                Lifetime purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 sm:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">
          Ready to elevate your game?
        </h2>
        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
          Join thousands of players and organizers using our platform to track,
          analyze, and improve their table tennis performance.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/auth/register">Get Started Free</Link>
        </Button>
      </section>
    </div>
  );
}
