import mongoose, { Schema, Document } from "mongoose";

export type SubscriptionTier = "free" | "pro" | "premium" | "enterprise";
export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled" | "expired";

export interface ISubscriptionFeatures {
  maxTournaments: number; // -1 for unlimited
  maxParticipants: number; // -1 for unlimited
  maxScorers: number;
  advancedAnalytics: boolean;
  exportData: boolean;
  customBranding: boolean;
  tournamentFormats: string[]; // e.g., ['round_robin', 'knockout', 'hybrid']
}

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Subscription lifecycle
  startDate: Date;
  endDate: Date; // For yearly subscriptions
  trialEndsAt?: Date;
  cancelledAt?: Date;

  // Payment info (Stripe)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  paymentMethod?: string; // Last 4 digits of card

  // Annual tracking for tournament limits
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  tournamentsCreatedThisPeriod: number;

  // Features enabled
  features: ISubscriptionFeatures;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isActive(): boolean;
  isInTrial(): boolean;
  hasExpired(): boolean;
}

const subscriptionFeaturesSchema = new Schema<ISubscriptionFeatures>({
  maxTournaments: { type: Number, required: true, default: 2 },
  maxParticipants: { type: Number, required: true, default: 16 },
  maxScorers: { type: Number, required: true, default: 0 },
  advancedAnalytics: { type: Boolean, required: true, default: false },
  exportData: { type: Boolean, required: true, default: false },
  customBranding: { type: Boolean, required: true, default: false },
  tournamentFormats: {
    type: [String],
    required: true,
    default: ["round_robin"]
  },
}, { _id: false });

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One subscription per user
    },
    tier: {
      type: String,
      enum: ["free", "pro", "premium", "enterprise"],
      required: true,
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "trial", "past_due", "cancelled", "expired"],
      required: true,
      default: "active",
    },

    // Subscription lifecycle
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true }, // Set to far future for free tier
    trialEndsAt: { type: Date },
    cancelledAt: { type: Date },

    // Stripe payment info
    stripeCustomerId: { type: String, sparse: true },
    stripeSubscriptionId: { type: String, sparse: true, unique: true },
    stripePriceId: { type: String },
    paymentMethod: { type: String }, // e.g., "****1234"

    // Period tracking for limits (resets annually)
    currentPeriodStart: { type: Date, required: true, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    tournamentsCreatedThisPeriod: { type: Number, required: true, default: 0 },

    // Features
    features: {
      type: subscriptionFeaturesSchema,
      required: true,
      default: () => ({
        maxTournaments: 2,
        maxParticipants: 16,
        maxScorers: 0,
        advancedAnalytics: false,
        exportData: false,
        customBranding: false,
        tournamentFormats: ["round_robin"],
      }),
    },
  },
  { timestamps: true }
);

// Indexes for performance
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ tier: 1 });

// Helper function to get feature limits for a tier
export function getFeaturesByTier(tier: SubscriptionTier): ISubscriptionFeatures {
  switch (tier) {
    case "free":
      return {
        maxTournaments: 2,
        maxParticipants: 16,
        maxScorers: 0,
        advancedAnalytics: false,
        exportData: false,
        customBranding: false,
        tournamentFormats: ["round_robin"],
      };
    case "pro":
      return {
        maxTournaments: 10,
        maxParticipants: 50,
        maxScorers: 3,
        advancedAnalytics: true,
        exportData: true,
        customBranding: false,
        tournamentFormats: ["round_robin", "knockout", "hybrid"],
      };
    case "premium":
      return {
        maxTournaments: -1, // Unlimited
        maxParticipants: -1, // Unlimited
        maxScorers: 10,
        advancedAnalytics: true,
        exportData: true,
        customBranding: true,
        tournamentFormats: ["round_robin", "knockout", "hybrid"],
      };
    case "enterprise":
      return {
        maxTournaments: -1, // Unlimited
        maxParticipants: -1, // Unlimited
        maxScorers: 10,
        advancedAnalytics: true,
        exportData: true,
        customBranding: true,
        tournamentFormats: ["round_robin", "knockout", "hybrid"],
      };
    default:
      return {
        maxTournaments: 2,
        maxParticipants: 16,
        maxScorers: 0,
        advancedAnalytics: false,
        exportData: false,
        customBranding: false,
        tournamentFormats: ["round_robin"],
      };
  }
}

// Also add as static method for compatibility
subscriptionSchema.statics.getFeaturesByTier = getFeaturesByTier;

// Helper method to check if subscription is currently active
subscriptionSchema.methods.isActive = function(): boolean {
  return this.status === "active" || this.status === "trial";
};

// Helper method to check if in trial period
subscriptionSchema.methods.isInTrial = function(): boolean {
  return this.status === "trial" && this.trialEndsAt && new Date() < this.trialEndsAt;
};

// Helper method to check if subscription has expired
subscriptionSchema.methods.hasExpired = function(): boolean {
  return new Date() > this.endDate;
};

export const Subscription = mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
