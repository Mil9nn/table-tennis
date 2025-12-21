import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { withErrorHandling, ApiError } from "@/lib/api/http";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";

/**
 * POST /api/subscription/checkout
 * Create a Stripe checkout session for subscription purchase
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  if (!isStripeConfigured()) {
    throw ApiError.serviceUnavailable("Stripe is not configured. Please contact the administrator.");
  }

  const { userId } = await requireAuth(req);
  const body = await req.json();

  const { tier, trialDays } = body;

  // Validate tier
  if (!tier || !["pro", "premium"].includes(tier)) {
    throw ApiError.badRequest("Invalid subscription tier. Must be 'pro' or 'premium'");
  }

  await connectDB();
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Get base URL for redirect
  const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Create Stripe checkout session
  const session = await createCheckoutSession(userId, tier, {
    successUrl: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/pricing`,
    customerEmail: user.email,
    trialDays: trialDays || 14, // Default 14-day trial
  });

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
});
