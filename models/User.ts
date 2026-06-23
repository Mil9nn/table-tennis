import mongoose from "mongoose";

const DEFAULT_DICEBEAR_BG_COLORS = "b6e3f4,c0aede,d1d4f9";

function buildDefaultProfileImage(seedSource?: string): string {
  const seed = (seedSource || "User").trim() || "User";
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${DEFAULT_DICEBEAR_BG_COLORS}`;
}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    profileImage: {
      type: String,
      default: function (this: { username?: string; fullName?: string }) {
        return buildDefaultProfileImage(this.username || this.fullName);
      },
    },
    password: { type: String },

    // Google OAuth (optional — email/password users omit this)
    googleId: { type: String, unique: true, sparse: true },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },

    // Phone verification (primary auth for mobile app)
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date },

    // Profile completion fields
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    handedness: { type: String, enum: ["left", "right", "ambidextrous"] },
    phoneNumber: { type: String, unique: true, sparse: true },
    location: { type: String },
    bio: { type: String, maxlength: 500 },
    playingStyle: { type: String, enum: ["offensive", "defensive", "all_round"] },

    // Profile completion tracking
    isProfileComplete: { type: Boolean, default: false },

    // Subscription fields
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    // Quick access cache (denormalized for performance)
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    subscriptionExpiresAt: { type: Date },

    // Feature flags (computed from subscription)
    hasAdvancedAnalytics: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },

    // Shot tracking preference
    shotTrackingMode: {
      type: String,
      enum: ["detailed", "simple"],
      default: "detailed",
    },
  },
  { timestamps: true }
);

// Indexes for search performance
// Note: username, email, and phoneNumber indexes are created automatically by unique: true constraint
userSchema.index({ fullName: "text" }); // Text index for search

// Indexes for leaderboard filtering
userSchema.index({ dateOfBirth: 1 }); // Age calculation
userSchema.index({ gender: 1 }); // Gender filtering
userSchema.index({ handedness: 1 }); // Handedness filtering

export const User = mongoose.models.User || mongoose.model("User", userSchema);
