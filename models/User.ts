import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String },
    password: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"]},
    stats: {
      totalMatches: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      winPercentage: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
