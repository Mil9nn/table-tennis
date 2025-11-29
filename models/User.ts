import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String },
    password: { type: String, required: true },

    // Profile completion fields
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    handedness: { type: String, enum: ["left", "right", "ambidextrous"] },
    phoneNumber: { type: String },
    location: { type: String },
    bio: { type: String, maxlength: 500 },

    // Profile completion tracking
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for search performance
// Note: username and email indexes are created automatically by the unique: true constraint
userSchema.index({ fullName: "text" }); // Text index for search

export const User = mongoose.models.User || mongoose.model("User", userSchema);
