import mongoose, { Schema, Document } from "mongoose";

export type SubscriptionTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";

export interface ISubscriptionFeatures {
  maxTournaments: number; // -1 for unlimited
  maxParticipants: number; // -1 for unlimited
  maxScorers: number;
  advancedAnalytics: boolean;
  exportData: boolean;
  customBranding: boolean;
  tournamentFormats: string[]; // e.g., ['round_robin', 'knockout', 'hybrid']
  // New features for stats and profile pages
  statsPageAccess: 'free' | 'pro'; // Access level for match stats page
  profileInsightsAccess: boolean; // Performance Insights tab
  shotAnalysisAccess: boolean; // Shot Analysis tab
  aiInsights: boolean; // AI-powered insights (Pro only)
}

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Subscription lifecycle
  startDate: Date;
  endDate: Date; // For yearly subscriptions
  cancelledAt?: Date;

  // Payment info (Razorpay)
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
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
  statsPageAccess: { 
    type: String, 
    enum: ['free', 'pro'], 
    required: true, 
    default: 'free' 
  },
  profileInsightsAccess: { type: Boolean, required: true, default: false },
  shotAnalysisAccess: { type: Boolean, required: true, default: false },
  aiInsights: { type: Boolean, required: true, default: false },
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
      enum: ["free", "pro", "enterprise"],
      required: true,
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "expired"],
      required: true,
      default: "active",
    },

    // Subscription lifecycle
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true }, // Set to far future for free tier
    cancelledAt: { type: Date },

    // Razorpay payment info
    razorpayCustomerId: { type: String, sparse: true },
    razorpaySubscriptionId: { type: String, sparse: true, unique: true },
    razorpayPlanId: { type: String },
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
        statsPageAccess: 'free',
        profileInsightsAccess: false,
        shotAnalysisAccess: false,
        aiInsights: false,
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
        statsPageAccess: 'free',
        profileInsightsAccess: false,
        shotAnalysisAccess: false,
        aiInsights: false,
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
        statsPageAccess: 'pro',
        profileInsightsAccess: true,
        shotAnalysisAccess: true,
        aiInsights: false,
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
        statsPageAccess: 'pro',
        profileInsightsAccess: true,
        shotAnalysisAccess: true,
        aiInsights: true,
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
        statsPageAccess: 'free',
        profileInsightsAccess: false,
        shotAnalysisAccess: false,
        aiInsights: false,
      };
  }
}

// Also add as static method for compatibility
subscriptionSchema.statics.getFeaturesByTier = getFeaturesByTier;

// Helper method to check if subscription is currently active
subscriptionSchema.methods.isActive = function(): boolean {
  return this.status === "active";
};

// Helper method to check if subscription has expired
subscriptionSchema.methods.hasExpired = function(): boolean {
  return new Date() > this.endDate;
};

export const Subscription = mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
