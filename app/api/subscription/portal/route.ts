import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { withErrorHandling, ApiError } from "@/lib/api/http";
import { createCustomerPortalSession, isStripeConfigured } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/middleware/subscription";

/**
 * POST /api/subscription/portal
 * Create a Stripe customer portal session for managing subscription
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  if (!isStripeConfigured()) {
    throw ApiError.serviceUnavailable("Stripe is not configured. Please contact the administrator.");
  }

  const { userId } = await requireAuth(req);

  // Get user's subscription
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.stripeCustomerId) {
    throw ApiError.badRequest("No active Stripe subscription found");
  }

  // Get base URL for redirect
  const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Create customer portal session
  const session = await createCustomerPortalSession(
    subscription.stripeCustomerId,
    `${baseUrl}/subscription`
  );

  return NextResponse.json({
    url: session.url,
  });
});
