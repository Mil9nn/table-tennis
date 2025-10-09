import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/mongodb.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ["male", "female"], required: true },
  profileImage: { type: String },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

const maleNames = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Reyansh",
  "Krishna", "Ishaan", "Rohan", "Kabir", "Dhruv"
];

const femaleNames = [
  "Aanya", "Diya", "Isha", "Kiara", "Myra",
  "Anaya", "Sara", "Aarohi", "Pari", "Navya"
];

async function seed() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    await User.deleteMany({});

    const users: any[] = [];

    for (let i = 0; i < 10; i++) {
      const malePass = await bcrypt.hash("Password123", 10);
      const femalePass = await bcrypt.hash("Password123", 10);

      const malePicId = Math.floor(Math.random() * 99);
      const femalePicId = Math.floor(Math.random() * 99);

      users.push(
        {
          username: maleNames[i].toLowerCase() + (i + 1),
          fullName: maleNames[i],
          email: `${maleNames[i].toLowerCase()}@example.com`,
          password: malePass,
          gender: "male",
          profileImage: `https://randomuser.me/api/portraits/men/${malePicId}.jpg`,
        },
        {
          username: femaleNames[i].toLowerCase() + (i + 1),
          fullName: femaleNames[i],
          email: `${femaleNames[i].toLowerCase()}@example.com`,
          password: femalePass,
          gender: "female",
          profileImage: `https://randomuser.me/api/portraits/women/${femalePicId}.jpg`,
        }
      );
    }

    await User.insertMany(users, { ordered: false });
    console.log("✅ Inserted 20 users with profile images successfully!");
  } catch (err) {
    console.error("❌ Error seeding users:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();