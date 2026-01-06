import mongoose from "mongoose";

export type TokenType = "email_verification" | "password_reset";

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      // Note: For OTP, this stores the hashed OTP (otpHash)
      // For backward compatibility, keeping field name as 'token'
    },
    type: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attemptsLeft: {
      type: Number,
      default: 3,
      min: 0,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for automatic expiration (TTL index)
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for quick lookups
verificationTokenSchema.index({ token: 1, type: 1 });
verificationTokenSchema.index({ userId: 1, type: 1 });

export const VerificationToken =
  mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", verificationTokenSchema);

