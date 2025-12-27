import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { withErrorHandling, ApiError } from "@/lib/api/http";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getUserSubscription } from "@/lib/middleware/subscription";

/**
 * POST /api/subscription/portal
 * Redirect to subscription management page
 * Note: Razorpay doesn't have a built-in customer portal like Stripe,
 * so we redirect to our own subscription management page
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  if (!isRazorpayConfigured()) {
    throw ApiError.serviceUnavailable("Razorpay is not configured. Please contact the administrator.");
  }

  const { userId } = await requireAuth(req);

  // Get user's subscription
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.razorpayCustomerId) {
    throw ApiError.badRequest("No active Razorpay subscription found");
  }

  // Get base URL for redirect
  const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Redirect to subscription management page
  return NextResponse.json({
    url: `${baseUrl}/subscription`,
  });
});
