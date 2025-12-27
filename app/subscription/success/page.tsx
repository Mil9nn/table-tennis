"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const subscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    // Track successful subscription
    if (paymentId || subscriptionId) {
      console.log("Subscription successful:", { paymentId, subscriptionId });
      // TODO: Track analytics event
    }
  }, [paymentId, subscriptionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center px-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mb-4 flex justify-center">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircleIcon
                className="text-green-600"
                style={{ fontSize: 64 }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Welcome to Pro!
          </h1>
          <p className="text-xl text-neutral-600">
            Your subscription has been activated successfully
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              What's Next?
            </h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircleIcon fontSize="small" className="mt-0.5" />
                <span>All Pro features are now unlocked</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon fontSize="small" className="mt-0.5" />
                <span>You have full access to advanced analytics and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon fontSize="small" className="mt-0.5" />
                <span>Your subscription will renew automatically</span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Link href="/subscription">View Subscription</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/tournaments/create">Create Tournament</Link>
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-neutral-600 mb-2">
              Questions about your subscription?
            </p>
            <a
              href="mailto:support@yourtabletennis.com"
              className="text-blue-600 hover:underline"
            >
              Contact our support team
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
