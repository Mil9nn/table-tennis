import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    profileImage: { type: String },
    password: { type: String, required: true },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);