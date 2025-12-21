import mongoose from "mongoose";
import { User } from "../models/User";
import Team from "../models/Team";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.error("Please make sure your .env file contains MONGODB_URI");
  process.exit(1);
}

const dummyUsers = [
  // Team 1: Thunder Smashers
  { username: "alex_thunder", fullName: "Alex Thompson", email: "alex.thunder@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },
  { username: "bella_spin", fullName: "Bella Rodriguez", email: "bella.spin@example.com", gender: "female", handedness: "right", playingStyle: "all_round" },
  { username: "charlie_ace", fullName: "Charlie Kim", email: "charlie.ace@example.com", gender: "male", handedness: "left", playingStyle: "defensive" },
  { username: "diana_flash", fullName: "Diana Patel", email: "diana.flash@example.com", gender: "female", handedness: "right", playingStyle: "offensive" },
  { username: "ethan_power", fullName: "Ethan Williams", email: "ethan.power@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },

  // Team 2: Ping Pong Panthers
  { username: "fiona_swift", fullName: "Fiona Chen", email: "fiona.swift@example.com", gender: "female", handedness: "right", playingStyle: "all_round" },
  { username: "george_blade", fullName: "George Martinez", email: "george.blade@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },
  { username: "hannah_loop", fullName: "Hannah Johnson", email: "hannah.loop@example.com", gender: "female", handedness: "left", playingStyle: "defensive" },
  { username: "ivan_spin", fullName: "Ivan Petrov", email: "ivan.spin@example.com", gender: "male", handedness: "right", playingStyle: "all_round" },
  { username: "julia_chop", fullName: "Julia Anderson", email: "julia.chop@example.com", gender: "female", handedness: "right", playingStyle: "defensive" },

  // Team 3: Table Titans
  { username: "kevin_smash", fullName: "Kevin O'Brien", email: "kevin.smash@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },
  { username: "lisa_drive", fullName: "Lisa Nakamura", email: "lisa.drive@example.com", gender: "female", handedness: "right", playingStyle: "offensive" },
  { username: "mike_block", fullName: "Mike Santos", email: "mike.block@example.com", gender: "male", handedness: "left", playingStyle: "defensive" },
  { username: "nina_rally", fullName: "Nina Kowalski", email: "nina.rally@example.com", gender: "female", handedness: "right", playingStyle: "all_round" },
  { username: "oscar_topspin", fullName: "Oscar Fernandez", email: "oscar.topspin@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },

  // Team 4: Paddle Warriors
  { username: "priya_ace", fullName: "Priya Sharma", email: "priya.ace@example.com", gender: "female", handedness: "right", playingStyle: "all_round" },
  { username: "quinn_slice", fullName: "Quinn Murphy", email: "quinn.slice@example.com", gender: "male", handedness: "right", playingStyle: "defensive" },
  { username: "rachel_spin", fullName: "Rachel Lee", email: "rachel.spin@example.com", gender: "female", handedness: "left", playingStyle: "offensive" },
  { username: "sam_power", fullName: "Sam Wilson", email: "sam.power@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },
  { username: "tina_loop", fullName: "Tina Garcia", email: "tina.loop@example.com", gender: "female", handedness: "right", playingStyle: "all_round" },

  // Team 5: Spin Masters
  { username: "umar_drive", fullName: "Umar Hassan", email: "umar.drive@example.com", gender: "male", handedness: "right", playingStyle: "offensive" },
  { username: "vera_chop", fullName: "Vera Johansson", email: "vera.chop@example.com", gender: "female", handedness: "right", playingStyle: "defensive" },
  { username: "will_smash", fullName: "Will Thompson", email: "will.smash@example.com", gender: "male", handedness: "left", playingStyle: "offensive" },
  { username: "xena_block", fullName: "Xena Papadopoulos", email: "xena.block@example.com", gender: "female", handedness: "right", playingStyle: "defensive" },
  { username: "yuki_rally", fullName: "Yuki Tanaka", email: "yuki.rally@example.com", gender: "male", handedness: "right", playingStyle: "all_round" },
];

const teamConfigs = [
  { name: "Thunder Smashers", city: "New York", userIndexes: [0, 1, 2, 3, 4] },
  { name: "Ping Pong Panthers", city: "Los Angeles", userIndexes: [5, 6, 7, 8, 9] },
  { name: "Table Titans", city: "Chicago", userIndexes: [10, 11, 12, 13, 14] },
  { name: "Paddle Warriors", city: "Houston", userIndexes: [15, 16, 17, 18, 19] },
  { name: "Spin Masters", city: "Phoenix", userIndexes: [20, 21, 22, 23, 24] },
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    const hashedPassword = await bcrypt.hash("password123", 10);

    console.log("\n📝 Creating 25 dummy users...");
    const createdUsers: any[] = [];

    for (const userData of dummyUsers) {
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });

      if (existingUser) {
        console.log(`  ⏭️  User ${userData.username} already exists, skipping...`);
        createdUsers.push(existingUser);
      } else {
        const user = await User.create({
          ...userData,
          password: hashedPassword,
          isProfileComplete: true,
        });
        console.log(`  ✅ Created user: ${userData.fullName} (@${userData.username})`);
        createdUsers.push(user);
      }
    }

    console.log("\n🏆 Creating 5 teams...");

    for (const teamConfig of teamConfigs) {
      const existingTeam = await Team.findOne({ name: teamConfig.name });

      if (existingTeam) {
        console.log(`  ⏭️  Team "${teamConfig.name}" already exists, skipping...`);
        continue;
      }

      const teamPlayers = teamConfig.userIndexes.map((idx) => createdUsers[idx]);
      const captain = teamPlayers[0];

      const players = teamPlayers.map((user, index) => ({
        user: user._id,
        role: index === 0 ? "captain" : "player",
        joinedDate: new Date(),
      }));

      // Create assignments (A, B, C for first 3 players)
      const assignments = new Map<string, string>();
      if (teamPlayers[0]) assignments.set(teamPlayers[0]._id.toString(), "A");
      if (teamPlayers[1]) assignments.set(teamPlayers[1]._id.toString(), "B");
      if (teamPlayers[2]) assignments.set(teamPlayers[2]._id.toString(), "C");

      const team = await Team.create({
        name: teamConfig.name,
        captain: captain._id,
        players,
        city: teamConfig.city,
        assignments,
      });

      console.log(`  ✅ Created team: ${teamConfig.name}`);
      console.log(`     📍 City: ${teamConfig.city}`);
      console.log(`     👑 Captain: ${captain.fullName}`);
      console.log(`     👥 Players: ${teamPlayers.map((u) => u.fullName).join(", ")}`);
      console.log(`     🎯 Positions: A=${teamPlayers[0].fullName}, B=${teamPlayers[1].fullName}, C=${teamPlayers[2].fullName}`);
    }

    console.log("\n✅ Seeding complete!");
    console.log("\n📋 Summary:");
    console.log(`   - ${createdUsers.length} users created/found`);
    console.log(`   - ${teamConfigs.length} teams created/found`);
    console.log(`   - Default password for all users: password123`);

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

seedDatabase();
