import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { withErrorHandling, ApiError } from "@/lib/api/http";
import { createCheckoutLink, isRazorpayConfigured } from "@/lib/razorpay";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";

/**
 * POST /api/subscription/checkout
 * Create a Razorpay checkout link for subscription purchase
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  if (!isRazorpayConfigured()) {
    throw ApiError.serviceUnavailable("Razorpay is not configured. Please contact the administrator.");
  }

  const { userId } = await requireAuth(req);
  const body = await req.json();

  const { tier, billingPeriod } = body;

  // Validate tier - only pro is allowed
  if (!tier || tier !== "pro") {
    throw ApiError.badRequest("Invalid subscription tier. Must be 'pro'");
  }

  // Validate billing period
  if (!billingPeriod || !["monthly", "yearly"].includes(billingPeriod)) {
    throw ApiError.badRequest("Invalid billing period. Must be 'monthly' or 'yearly'");
  }

  await connectDB();
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Get base URL for redirect
  const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Create Razorpay checkout link
  const checkoutLink = await createCheckoutLink(userId, tier, billingPeriod, {
    successUrl: `${baseUrl}/subscription/success?payment_id={PAYMENT_ID}&subscription_id={SUBSCRIPTION_ID}`,
    cancelUrl: `${baseUrl}/subscription`,
    customerEmail: user.email,
    customerName: user.name || user.email,
    customerContact: user.phone,
  });

  return NextResponse.json({
    paymentLinkId: checkoutLink.id,
    url: checkoutLink.short_url,
  });
});
