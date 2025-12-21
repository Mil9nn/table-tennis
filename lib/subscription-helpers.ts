import { Subscription, SubscriptionTier, ISubscription, ISubscriptionFeatures, getFeaturesByTier } from "@/models/Subscription";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { connectDB } from "./mongodb";
import { syncSubscriptionFromStripe } from "./stripe";

/**
 * Create a new subscription for a user
 */
export async function createSubscription(
  userId: string,
  tier: SubscriptionTier,
  options?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    trialDays?: number;
  }
): Promise<ISubscription> {
  await connectDB();

  const features = getFeaturesByTier(tier);
  const now = new Date();
  const endDate = new Date();

  // Free tier gets far future end date, paid tiers get 1 year
  if (tier === "free") {
    endDate.setFullYear(endDate.getFullYear() + 100);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  let status: "active" | "trial" = "active";
  let trialEndsAt: Date | undefined;

  // Set trial period if specified
  if (options?.trialDays && options.trialDays > 0) {
    status = "trial";
    trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + options.trialDays);
  }

  // Delete existing subscription if any
  await Subscription.findOneAndDelete({ user: userId });

  const subscription = await Subscription.create({
    user: userId,
    tier,
    status,
    startDate: now,
    endDate,
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    tournamentsCreatedThisPeriod: 0,
    features,
    stripeCustomerId: options?.stripeCustomerId,
    stripeSubscriptionId: options?.stripeSubscriptionId,
    stripePriceId: options?.stripePriceId,
  });

  // Update user's cached fields
  await User.findByIdAndUpdate(userId, {
    subscription: subscription._id,
    subscriptionTier: tier,
    subscriptionStatus: status,
    subscriptionExpiresAt: endDate,
    hasAdvancedAnalytics: features.advancedAnalytics,
    canExportData: features.exportData,
  });

  return subscription;
}

/**
 * Update subscription tier (upgrade/downgrade)
 */
export async function updateSubscriptionTier(
  userId: string,
  newTier: SubscriptionTier
): Promise<ISubscription> {
  await connectDB();

  let subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    // Create new subscription if doesn't exist
    return createSubscription(userId, newTier);
  }

  const features = getFeaturesByTier(newTier);

  // Update subscription
  subscription.tier = newTier;
  subscription.features = features;

  // Reset status to active if upgrading from expired
  if (subscription.status === "expired") {
    subscription.status = "active";
  }

  await subscription.save();

  // Update user's cached fields
  await User.findByIdAndUpdate(userId, {
    subscriptionTier: newTier,
    hasAdvancedAnalytics: features.advancedAnalytics,
    canExportData: features.exportData,
  });

  return subscription;
}

/**
 * Cancel a subscription (will expire at period end)
 */
export async function cancelSubscription(subscriptionId: string): Promise<ISubscription> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  await subscription.save();

  // Update user's cached status
  await User.findByIdAndUpdate(subscription.user, {
    subscriptionStatus: "cancelled",
  });

  return subscription;
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<ISubscription> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (subscription.status !== "cancelled") {
    throw new Error("Subscription is not cancelled");
  }

  subscription.status = "active";
  subscription.cancelledAt = undefined;
  await subscription.save();

  // Update user's cached status
  await User.findByIdAndUpdate(subscription.user, {
    subscriptionStatus: "active",
  });

  return subscription;
}

/**
 * Expire a subscription (when period ends)
 */
export async function expireSubscription(subscriptionId: string): Promise<void> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Downgrade to free tier
  const features = getFeaturesByTier("free");

  subscription.tier = "free";
  subscription.status = "expired";
  subscription.features = features;
  await subscription.save();

  // Update user's cached fields
  await User.findByIdAndUpdate(subscription.user, {
    subscriptionTier: "free",
    subscriptionStatus: "expired",
    hasAdvancedAnalytics: false,
    canExportData: false,
  });
}

/**
 * Renew a subscription (when payment succeeds)
 */
export async function renewSubscription(
  subscriptionId: string,
  paymentData?: {
    amount: number;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
  }
): Promise<ISubscription> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Extend period by 1 year
  const newPeriodStart = subscription.currentPeriodEnd;
  const newPeriodEnd = new Date(newPeriodStart);
  newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);

  subscription.currentPeriodStart = newPeriodStart;
  subscription.currentPeriodEnd = newPeriodEnd;
  subscription.endDate = newPeriodEnd;
  subscription.status = "active";
  subscription.tournamentsCreatedThisPeriod = 0; // Reset counter

  await subscription.save();

  // Update user's cached fields
  await User.findByIdAndUpdate(subscription.user, {
    subscriptionStatus: "active",
    subscriptionExpiresAt: newPeriodEnd,
  });

  // Record payment if data provided
  if (paymentData) {
    await Payment.create({
      user: subscription.user,
      subscription: subscription._id,
      amount: paymentData.amount,
      currency: "USD",
      status: "succeeded",
      paymentDate: new Date(),
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      stripePaymentIntentId: paymentData.stripePaymentIntentId,
      stripeInvoiceId: paymentData.stripeInvoiceId,
    });
  }

  return subscription;
}

/**
 * Sync subscription from Stripe
 */
export async function syncSubscriptionWithStripe(subscriptionId: string): Promise<ISubscription> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (!subscription.stripeSubscriptionId) {
    throw new Error("Subscription is not linked to Stripe");
  }

  const stripeData = await syncSubscriptionFromStripe(subscription.stripeSubscriptionId);

  // Update subscription with Stripe data
  subscription.currentPeriodStart = stripeData.currentPeriodStart;
  subscription.currentPeriodEnd = stripeData.currentPeriodEnd;

  // Map Stripe status to our status
  if (stripeData.status === "active") {
    subscription.status = "active";
  } else if (stripeData.status === "trialing") {
    subscription.status = "trial";
  } else if (stripeData.status === "past_due") {
    subscription.status = "past_due";
  } else if (stripeData.status === "canceled" || stripeData.status === "incomplete_expired") {
    subscription.status = "cancelled";
  }

  await subscription.save();

  // Update user's cached fields
  await User.findByIdAndUpdate(subscription.user, {
    subscriptionStatus: subscription.status,
    subscriptionExpiresAt: subscription.endDate,
  });

  return subscription;
}

/**
 * Get subscription summary for user dashboard
 */
export async function getSubscriptionSummary(userId: string) {
  await connectDB();

  const subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    return null;
  }

  const now = new Date();
  const daysUntilRenewal = Math.ceil(
    (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysUntilTrialEnd = subscription.trialEndsAt
    ? Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    tier: subscription.tier,
    status: subscription.status,
    isActive: subscription.isActive(),
    isInTrial: subscription.isInTrial(),
    features: subscription.features,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    daysUntilRenewal,
    daysUntilTrialEnd,
    tournamentsCreated: subscription.tournamentsCreatedThisPeriod,
    tournamentsLimit: subscription.features.maxTournaments,
    canUpgrade: subscription.tier !== "premium" && subscription.tier !== "enterprise",
  };
}

/**
 * Get feature comparison for pricing page
 */
export function getFeatureComparison(): Record<SubscriptionTier, ISubscriptionFeatures> {
  return {
    free: getFeaturesByTier("free"),
    pro: getFeaturesByTier("pro"),
    premium: getFeaturesByTier("premium"),
    enterprise: getFeaturesByTier("enterprise"),
  };
}
