import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb.js";
import IndividualMatch from "../models/IndividualMatch.js";

// Lightweight User model
const userSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  gender: String,
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Helpers
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr: any[]) {
  return arr.sort(() => Math.random() - 0.5);
}

// Data sources
const strokeTypes = [
  "forehand_drive", "backhand_drive", "forehand_topspin", "backhand_topspin",
  "forehand_loop", "backhand_loop", "forehand_smash", "backhand_smash",
  "forehand_push", "backhand_push", "forehand_chop", "backhand_chop",
  "forehand_flick", "backhand_flick", "forehand_block", "backhand_block",
  "forehand_drop", "backhand_drop",
];

const errorTypes = ["net", "long", "serve"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune"];
const venues = ["Smash Arena", "SpinMasters Arena", "TableTennis Pro Hall", "Ping Pong Palace"];

async function seedMatches() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});
    if (users.length < 4) throw new Error("❌ Need at least 4 users!");

    await IndividualMatch.deleteMany({});
    console.log("🧹 Cleared existing IndividualMatches");

    const matches = [];

    for (let i = 0; i < 15; i++) {
      const matchType = pick(["singles", "doubles", "mixed_doubles"]);
      const shuffled = shuffle([...users]);

      let participants = [];
      if (matchType === "singles") {
        participants = shuffled.slice(0, 2);
      } else if (matchType === "doubles") {
        participants = shuffled.slice(0, 4);
      } else {
        const males = users.filter((u) => u.gender === "male");
        const females = users.filter((u) => u.gender === "female");
        participants = [pick(males), pick(females), pick(males), pick(females)];
      }

      const side1 = participants.slice(0, participants.length / 2);
      const side2 = participants.slice(participants.length / 2);
      const winnerSide = pick(["side1", "side2"]);

      const numberOfSets = pick([3, 5]);
      const games = [];

      // --- Generate Games ---
      for (let g = 1; g <= numberOfSets; g++) {
        const totalShots = randInt(25, 50);
        const shots = [];

        let server = pick(participants);
        for (let s = 1; s <= totalShots; s++) {
          const side = pick(["side1", "side2"]);
          const player =
            side === "side1"
              ? pick(side1)
              : pick(side2);

          const stroke = pick(strokeTypes);
          const isError = Math.random() < 0.15;
          const isWinner = !isError && Math.random() < 0.1;

          const shot = {
            shotNumber: s,
            side,
            player: player._id,
            stroke,
            outcome: isError ? "error" : isWinner ? "winner" : "let",
            errorType: isError ? pick(errorTypes) : null,
            server: server._id,
            timestamp: new Date(),
          };

          shots.push(shot);
        }

        const side1Score = randInt(8, 11);
        const side2Score = randInt(8, 11);
        const winner = side1Score > side2Score ? "side1" : "side2";

        games.push({
          gameNumber: g,
          side1Score,
          side2Score,
          winnerSide: winner,
          completed: true,
          expedite: false,
          shots,
          duration: randInt(200, 500),
          startTime: new Date(),
          endTime: new Date(),
        });
      }

      // --- Compute basic stats ---
      const stats = {
        winners: randInt(10, 40),
        unforcedErrors: randInt(5, 20),
        aces: randInt(0, 4),
        serveErrors: randInt(0, 3),
        longestStreak: randInt(1, 6),
        clutchPointsWon: randInt(1, 10),
        playerStats: new Map(),
      };

      for (const p of participants) {
        stats.playerStats.set(p._id.toString(), {
          winners: randInt(3, 15),
          unforcedErrors: randInt(1, 10),
          aces: randInt(0, 3),
          serveErrors: randInt(0, 2),
          detailedShots: Object.fromEntries(
            strokeTypes.map((s) => [s, randInt(0, 5)])
          ),
          errorsByType: {
            net: randInt(0, 4),
            long: randInt(0, 3),
            serve: randInt(0, 2),
          },
        });
      }

      const match = {
        matchCategory: "individual",
        matchType,
        numberOfSets,
        participants: participants.map((p) => p._id),
        scorer: pick(users)._id,
        city: pick(cities),
        venue: pick(venues),
        status: "completed",
        currentGame: randInt(1, numberOfSets),
        currentServer: pick([
          "side1",
          "side2",
          "side1_main",
          "side2_main",
          "side1_partner",
          "side2_partner",
        ]),
        games,
        finalScore: {
          side1Sets: winnerSide === "side1" ? randInt(2, 3) : randInt(0, 1),
          side2Sets: winnerSide === "side2" ? randInt(2, 3) : randInt(0, 1),
        },
        winnerSide,
        serverConfig: {
          firstServer: pick([
            "side1_main",
            "side2_main",
            "side1_partner",
            "side2_partner",
          ]),
          firstReceiver: pick([
            "side1_main",
            "side2_main",
            "side1_partner",
            "side2_partner",
          ]),
          serverOrder: [
            "side1_main",
            "side2_main",
            "side1_partner",
            "side2_partner",
          ],
        },
        matchDuration: randInt(500, 1500),
        statistics: stats,
      };

      matches.push(match);
    }

    await IndividualMatch.insertMany(matches, { ordered: false });
    console.log(`✅ Inserted ${matches.length} matches with shots successfully!`);
  } catch (err) {
    console.error("❌ Error seeding matches:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedMatches();