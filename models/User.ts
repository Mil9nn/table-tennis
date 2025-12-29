import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String },
    password: { type: String, required: true },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },

    // Profile completion fields
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    handedness: { type: String, enum: ["left", "right", "ambidextrous"] },
    phoneNumber: { type: String },
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
  },
  { timestamps: true }
);

// Indexes for search performance
// Note: username and email indexes are created automatically by the unique: true constraint
userSchema.index({ fullName: "text" }); // Text index for search

// Indexes for leaderboard filtering
userSchema.index({ dateOfBirth: 1 }); // Age calculation
userSchema.index({ gender: 1 }); // Gender filtering
userSchema.index({ handedness: 1 }); // Handedness filtering

export const User = mongoose.models.User || mongoose.model("User", userSchema);
