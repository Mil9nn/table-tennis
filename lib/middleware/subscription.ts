import { NextRequest, NextResponse } from "next/server";
import { Subscription, SubscriptionTier, ISubscription, getFeaturesByTier } from "@/models/Subscription";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, optionalAuth } from "@/lib/api/auth";

/**
 * Get user's subscription with features
 */
export async function getUserSubscription(userId: string): Promise<ISubscription | null> {
  await connectDB();

  let subscription = await Subscription.findOne({ user: userId });

  // If no subscription exists, create a free tier subscription
  if (!subscription) {
    const features = getFeaturesByTier("free");
    const now = new Date();
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 100); // Far future for free tier

    subscription = await Subscription.create({
      user: userId,
      tier: "free",
      status: "active",
      startDate: now,
      endDate: farFuture,
      currentPeriodStart: now,
      currentPeriodEnd: farFuture,
      tournamentsCreatedThisPeriod: 0,
      features,
    });

    // Update user's cached subscription fields
    await User.findByIdAndUpdate(userId, {
      subscription: subscription._id,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      subscriptionExpiresAt: farFuture,
    });
  }

  return subscription;
}

/**
 * Check if user has required subscription tier
 */
export async function requireTier(
  request: NextRequest,
  requiredTier: SubscriptionTier
): Promise<{ allowed: boolean; subscription?: ISubscription; error?: string; userId?: string }> {
  try {
    // Get and verify user
    const auth = await optionalAuth(request);
    if (!auth || !auth.userId) {
      return { allowed: false, error: "Not authenticated" };
    }

    // Get user's subscription
    const subscription = await getUserSubscription(auth.userId);
    if (!subscription) {
      return { allowed: false, error: "No subscription found" };
    }

    // Check if subscription is active
    if (!subscription.isActive()) {
      return { allowed: false, error: "Subscription is not active", subscription };
    }

    // Define tier hierarchy
    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      premium: 2,
      enterprise: 3,
    };

    const userTierLevel = tierHierarchy[subscription.tier];
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return {
        allowed: false,
        error: `This feature requires ${requiredTier} tier or higher`,
        subscription,
      };
    }

    return { allowed: true, subscription, userId: auth.userId };
  } catch (error) {
    console.error("Error in requireTier middleware:", error);
    return { allowed: false, error: "Internal server error" };
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function requireFeature(
  request: NextRequest,
  feature: keyof ISubscription["features"]
): Promise<{ allowed: boolean; subscription?: ISubscription; error?: string; userId?: string }> {
  try {
    const auth = await optionalAuth(request);
    if (!auth || !auth.userId) {
      return { allowed: false, error: "Not authenticated" };
    }

    const subscription = await getUserSubscription(auth.userId);
    if (!subscription) {
      return { allowed: false, error: "No subscription found" };
    }

    if (!subscription.isActive()) {
      return { allowed: false, error: "Subscription is not active", subscription };
    }

    // Check if feature is enabled
    const featureValue = subscription.features[feature];

    if (typeof featureValue === "boolean" && !featureValue) {
      return {
        allowed: false,
        error: `This feature is not available on your current plan`,
        subscription,
      };
    }

    return { allowed: true, subscription, userId: auth.userId };
  } catch (error) {
    console.error("Error in requireFeature middleware:", error);
    return { allowed: false, error: "Internal server error" };
  }
}

/**
 * Check if user has not exceeded a limit
 */
export async function checkLimit(
  userId: string,
  limitType: "tournaments" | "participants" | "scorers",
  currentValue: number
): Promise<{ allowed: boolean; limit: number; error?: string }> {
  try {
    await connectDB();

    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, limit: 0, error: "No subscription found" };
    }

    if (!subscription.isActive()) {
      return { allowed: false, limit: 0, error: "Subscription is not active" };
    }

    let limit: number;
    let current: number;

    switch (limitType) {
      case "tournaments":
        limit = subscription.features.maxTournaments;
        current = subscription.tournamentsCreatedThisPeriod;
        break;
      case "participants":
        limit = subscription.features.maxParticipants;
        current = currentValue;
        break;
      case "scorers":
        limit = subscription.features.maxScorers;
        current = currentValue;
        break;
      default:
        return { allowed: false, limit: 0, error: "Invalid limit type" };
    }

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1 };
    }

    if (current >= limit) {
      return {
        allowed: false,
        limit,
        error: `You have reached the limit of ${limit} ${limitType} for your current plan`,
      };
    }

    return { allowed: true, limit };
  } catch (error) {
    console.error("Error in checkLimit:", error);
    return { allowed: false, limit: 0, error: "Internal server error" };
  }
}

/**
 * Increment tournament counter when a tournament is created
 */
export async function incrementTournamentCount(userId: string): Promise<void> {
  await connectDB();

  await Subscription.findOneAndUpdate(
    { user: userId },
    { $inc: { tournamentsCreatedThisPeriod: 1 } }
  );
}

/**
 * Reset period counters (should be called when subscription period renews)
 */
export async function resetPeriodCounters(subscriptionId: string): Promise<void> {
  await connectDB();

  await Subscription.findByIdAndUpdate(subscriptionId, {
    tournamentsCreatedThisPeriod: 0,
  });
}

/**
 * Check if tournament format is allowed for user's tier
 */
export async function checkTournamentFormatAllowed(
  userId: string,
  format: string
): Promise<{ allowed: boolean; error?: string }> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { allowed: false, error: "No subscription found" };
  }

  if (!subscription.isActive()) {
    return { allowed: false, error: "Subscription is not active" };
  }

  const allowedFormats = subscription.features.tournamentFormats;
  if (!allowedFormats.includes(format)) {
    return {
      allowed: false,
      error: `The ${format} format is not available on your current plan`,
    };
  }

  return { allowed: true };
}
