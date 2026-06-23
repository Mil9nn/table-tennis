import { Subscription, SubscriptionTier, ISubscription, ISubscriptionFeatures, getFeaturesByTier } from "@/models/Subscription";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { connectDB } from "./mongodb";
import { syncSubscriptionFromRazorpay } from "./razorpay";

/**
 * Create a new subscription for a user
 */
export async function createSubscription(
  userId: string,
  tier: SubscriptionTier,
  options?: {
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    razorpayPlanId?: string;
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

  // Delete existing subscription if any
  await Subscription.findOneAndDelete({ user: userId });

  const subscription = await Subscription.create({
    user: userId,
    tier,
    status: "active",
    startDate: now,
    endDate,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    tournamentsCreatedThisPeriod: 0,
    features,
    razorpayCustomerId: options?.razorpayCustomerId,
    razorpaySubscriptionId: options?.razorpaySubscriptionId,
    razorpayPlanId: options?.razorpayPlanId,
  });

  // Update user's cached fields
  await User.findByIdAndUpdate(userId, {
    subscription: subscription._id,
    subscriptionTier: tier,
    subscriptionStatus: "active",
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
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpayInvoiceId?: string;
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
      currency: "INR",
      status: "succeeded",
      paymentDate: new Date(),
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      razorpayPaymentId: paymentData.razorpayPaymentId,
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayInvoiceId: paymentData.razorpayInvoiceId,
    });
  }

  return subscription;
}

/**
 * Sync subscription from Razorpay
 */
export async function syncSubscriptionWithRazorpay(subscriptionId: string): Promise<ISubscription> {
  await connectDB();

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (!subscription.razorpaySubscriptionId) {
    throw new Error("Subscription is not linked to Razorpay");
  }

  const razorpayData = await syncSubscriptionFromRazorpay(subscription.razorpaySubscriptionId);

  // Update subscription with Razorpay data
  subscription.currentPeriodStart = razorpayData.currentPeriodStart;
  subscription.currentPeriodEnd = razorpayData.currentPeriodEnd;

  // Map Razorpay status to our status
  if (razorpayData.status === "active") {
    subscription.status = "active";
  } else if (razorpayData.status === "pending") {
    subscription.status = "past_due";
  } else if (razorpayData.status === "cancelled" || razorpayData.status === "expired") {
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

  return {
    tier: subscription.tier,
    status: subscription.status,
    isActive: subscription.isActive(),
    features: subscription.features,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    daysUntilRenewal,
    tournamentsCreated: subscription.tournamentsCreatedThisPeriod,
    tournamentsLimit: subscription.features.maxTournaments,
    canUpgrade: false, // Pro is the highest tier now
  };
}

/**
 * Get feature comparison for pricing page
 */
export function getFeatureComparison(): Record<SubscriptionTier, ISubscriptionFeatures> {
  return {
    free: getFeaturesByTier("free"),
    pro: getFeaturesByTier("pro"),
  };
}
