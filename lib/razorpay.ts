import Razorpay from "razorpay";
import crypto from "crypto";
import { SubscriptionTier } from "@/models/Subscription";

// Initialize Razorpay - will be null if keys not configured
let razorpay: Razorpay | null = null;

try {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKeyId && razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } else {
    console.warn("⚠️  Razorpay not configured: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing");
  }
} catch (error) {
  console.error("❌ Error initializing Razorpay:", error);
}

export { razorpay };

// Razorpay Plan IDs - these will be set after creating plans in Razorpay Dashboard
export const RAZORPAY_PLANS = {
  pro_monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY || "plan_pro_monthly_placeholder",
  pro_yearly: process.env.RAZORPAY_PLAN_PRO_YEARLY || "plan_pro_yearly_placeholder",
};

// Price amounts (in paise - smallest currency unit for INR)
// NOTE: Reduced to 2 rupees for testing purposes
export const SUBSCRIPTION_PRICES = {
  free: 0,
  pro_monthly: 200, // ₹2/month (200 paise) - TESTING PRICE
  pro_yearly: 200, // ₹2/year (200 paise) - TESTING PRICE
};

/**
 * Create a Razorpay subscription for a user
 */
export async function createSubscription(
  userId: string,
  tier: "pro",
  billingPeriod: "monthly" | "yearly",
  options: {
    customerEmail?: string;
    customerName?: string;
    customerContact?: string;
  }
): Promise<{
  id: string;
  short_url: string;
  status: string;
}> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.");
  }

  const planId = billingPeriod === "monthly" ? RAZORPAY_PLANS.pro_monthly : RAZORPAY_PLANS.pro_yearly;
  const amount = billingPeriod === "monthly" ? SUBSCRIPTION_PRICES.pro_monthly : SUBSCRIPTION_PRICES.pro_yearly;

  // Create customer first
  const customer = await razorpay.customers.create({
    email: options.customerEmail,
    name: options.customerName,
    contact: options.customerContact,
    notes: {
      userId,
      tier,
      billingPeriod,
    },
  });

  // Create subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: billingPeriod === "monthly" ? 12 : 1, // 12 months for monthly, 1 for yearly
    notes: {
      userId,
      tier,
      billingPeriod,
    },
  });

  return {
    id: subscription.id,
    short_url: subscription.short_url || "",
    status: subscription.status,
  };
}

/**
 * Create a Razorpay checkout link for subscription
 * This creates a subscription and returns the checkout URL
 */
export async function createCheckoutLink(
  userId: string,
  tier: "pro",
  billingPeriod: "monthly" | "yearly",
  options: {
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    customerName?: string;
    customerContact?: string;
  }
): Promise<{
  id: string;
  short_url: string;
}> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.");
  }

  const planId = billingPeriod === "monthly" ? RAZORPAY_PLANS.pro_monthly : RAZORPAY_PLANS.pro_yearly;

  // Create customer first
  let customer;
  try {
    customer = await razorpay.customers.create({
      email: options.customerEmail,
      name: options.customerName,
      contact: options.customerContact,
      notes: {
        userId,
        tier,
        billingPeriod,
      },
    });
  } catch (error: any) {
    // If customer already exists, try to find by email
    if (error.statusCode === 400 && options.customerEmail) {
      const customers = await razorpay.customers.all({ count: 100 });
      const existingCustomer = customers.items.find(
        (c: any) => c.email === options.customerEmail
      );
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Create subscription with checkout
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: billingPeriod === "monthly" ? 12 : 1, // 12 months for monthly, 1 for yearly
    notes: {
      userId,
      tier,
      billingPeriod,
    },
    // Add callback URLs if supported
    // Note: Razorpay subscriptions redirect to the plan's configured URL
    // You may need to configure this in the Razorpay dashboard
  });

  // Return subscription details - the checkout URL is typically the subscription's short_url
  // or you need to redirect to Razorpay's hosted page
  return {
    id: subscription.id,
    short_url: subscription.short_url || `https://dashboard.razorpay.com/app/subscriptions/${subscription.id}`,
  };
}

/**
 * Retrieve a Razorpay subscription
 */
export async function getRazorpaySubscription(
  subscriptionId: string
): Promise<any> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  return subscription;
}

/**
 * Cancel a Razorpay subscription
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<any> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  if (cancelAtPeriodEnd) {
    // Pause subscription (will cancel at period end)
    const subscription = await razorpay.subscriptions.pause(subscriptionId, {
      pause_at: "next_cycle",
    });
    return subscription;
  } else {
    // Cancel immediately
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    return subscription;
  }
}

/**
 * Resume a cancelled/paused Razorpay subscription
 */
export async function resumeRazorpaySubscription(
  subscriptionId: string
): Promise<any> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  const subscription = await razorpay.subscriptions.resume(subscriptionId, {
    resume_at: "now",
  });

  return subscription;
}

/**
 * Sync subscription data from Razorpay
 */
export async function syncSubscriptionFromRazorpay(
  razorpaySubscriptionId: string
): Promise<{
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  const subscription = await razorpay.subscriptions.fetch(razorpaySubscriptionId);

  // Convert Razorpay timestamps to Date objects
  const currentPeriodStart = new Date(subscription.current_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_end * 1000);

  // Map Razorpay status to our status
  let status = "active";
  if (subscription.status === "active") {
    status = "active";
  } else if (subscription.status === "pending" || subscription.status === "authenticated") {
    status = "pending";
  } else if (subscription.status === "paused") {
    status = "cancelled";
  } else if (subscription.status === "cancelled" || subscription.status === "expired") {
    status = "cancelled";
  }

  return {
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.status === "paused",
  };
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get tier from Razorpay plan ID
 */
export function getTierFromPlanId(planId: string): SubscriptionTier {
  if (planId === RAZORPAY_PLANS.pro_monthly || planId === RAZORPAY_PLANS.pro_yearly) {
    return "pro";
  }
  return "free";
}

/**
 * Check if Razorpay is properly configured
 */
export function isRazorpayConfigured(): boolean {
  return razorpay !== null;
}

