import Stripe from "stripe";
import { SubscriptionTier } from "@/models/Subscription";

// Initialize Stripe - will be null if keys not configured
let stripe: Stripe | null = null;

try {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  } else {
    console.warn("⚠️  Stripe not configured: STRIPE_SECRET_KEY is missing");
  }
} catch (error) {
  console.error("❌ Error initializing Stripe:", error);
}

export { stripe };

// Stripe Price IDs - these will be set after creating products in Stripe
// TODO: Update these with actual Stripe price IDs from your Stripe dashboard
export const STRIPE_PRICES = {
  lifetime: process.env.STRIPE_PRICE_LIFETIME || "price_lifetime_placeholder",
  annual: process.env.STRIPE_PRICE_ANNUAL || "price_annual_placeholder",
  three_month: process.env.STRIPE_PRICE_THREE_MONTH || "price_three_month_placeholder",
};

// Price amounts (in cents)
export const SUBSCRIPTION_PRICES = {
  free: 0,
  lifetime: 5000, // $50.00 (one-time payment)
  annual: 450, // $4.50/year
  three_month: 250, // $2.50/3 months
};

/**
 * Create a Stripe checkout session for subscription or one-time purchase
 */
export async function createCheckoutSession(
  userId: string,
  tier: "lifetime" | "annual" | "three_month",
  options: {
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    trialDays?: number;
  }
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.");
  }

  const priceId = STRIPE_PRICES[tier];
  const isLifetime = tier === "lifetime";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: isLifetime ? "payment" : "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      tier,
    },
  };

  // Add customer email if provided
  if (options.customerEmail) {
    sessionParams.customer_email = options.customerEmail;
  }

  // For subscription mode, add subscription data
  if (!isLifetime) {
    sessionParams.subscription_data = {
      metadata: {
        userId,
        tier,
      },
    };

    // Add trial period if specified
    if (options.trialDays && options.trialDays > 0) {
      sessionParams.subscription_data.trial_period_days = options.trialDays;
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Create a Stripe customer portal session for managing subscription
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Retrieve a Stripe subscription
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return subscription;
}

/**
 * Resume a cancelled Stripe subscription
 */
export async function resumeStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

/**
 * Sync subscription data from Stripe
 */
export async function syncSubscriptionFromStripe(
  stripeSubscriptionId: string
): Promise<{
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Type assertion for accessing subscription properties
  const sub = stripeSubscription as any;

  return {
    status: sub.status,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

/**
 * Handle Stripe webhook events
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  return event;
}

/**
 * Get tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === STRIPE_PRICES.lifetime || priceId === STRIPE_PRICES.annual || priceId === STRIPE_PRICES.three_month) {
    return "pro"; // All paid tiers map to "pro" tier
  }
  return "free";
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}
