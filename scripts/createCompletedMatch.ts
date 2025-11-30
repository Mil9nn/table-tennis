import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import IndividualMatch from "../models/IndividualMatch";
import { User } from "../models/User";
import { statsService } from "../services/statsService";

// Load environment variables
dotenv.config();

// Stroke types available
const strokeTypes = [
  "forehand_drive",
  "backhand_drive",
  "forehand_topspin",
  "backhand_topspin",
  "forehand_loop",
  "backhand_loop",
  "forehand_smash",
  "backhand_smash",
  "forehand_push",
  "backhand_push",
  "forehand_flick",
  "backhand_flick",
  "forehand_block",
  "backhand_block",
  "serve_point",
];

// Generate random shot coordinates
function getRandomCoordinate(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random stroke type
function getRandomStroke(): string {
  return strokeTypes[Math.floor(Math.random() * strokeTypes.length)];
}

// Create shots for a game
function createShotsForGame(
  gameNumber: number,
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  side1Score: number,
  side2Score: number,
  totalPoints: number
): any[] {
  const shots: any[] = [];
  let shotNumber = 1;
  let currentServer: "side1" | "side2" = gameNumber % 2 === 1 ? "side1" : "side2";
  
  // Alternate serves every 2 points
  let serveCount = 0;
  
  for (let i = 0; i < totalPoints; i++) {
    // Determine which side scored this point
    const side1PointsSoFar = Math.min(side1Score, Math.floor((i + 1) * (side1Score / totalPoints)));
    const side2PointsSoFar = Math.min(side2Score, Math.floor((i + 1) * (side2Score / totalPoints)));
    
    // Determine winner of this point (simplified logic)
    const pointWinner = i < side1Score ? "side1" : "side2";
    
    // Switch server every 2 points
    if (serveCount >= 2) {
      currentServer = currentServer === "side1" ? "side2" : "side1";
      serveCount = 0;
    }
    serveCount++;
    
    const shot = {
      shotNumber: shotNumber++,
      side: pointWinner,
      player: pointWinner === "side1" ? player1Id : player2Id,
      stroke: getRandomStroke(),
      server: currentServer === "side1" ? player1Id : player2Id,
      originX: getRandomCoordinate(-50, 150),
      originY: getRandomCoordinate(-50, 150),
      landingX: getRandomCoordinate(0, 100),
      landingY: getRandomCoordinate(0, 100),
      timestamp: new Date(Date.now() - (totalPoints - i) * 10000), // Spread over time
    };
    
    shots.push(shot);
  }
  
  return shots;
}

// Create player statistics from shots
function createPlayerStats(shots: any[], player1Id: string, player2Id: string): Map<string, any> {
  const stats = new Map();
  
  const player1Stats: any = {
    detailedShots: {},
  };
  
  const player2Stats: any = {
    detailedShots: {},
  };
  
  shots.forEach((shot) => {
    const playerId = shot.player.toString();
    const statsObj = playerId === player1Id ? player1Stats : player2Stats;
    
    if (!statsObj.detailedShots[shot.stroke]) {
      statsObj.detailedShots[shot.stroke] = 0;
    }
    statsObj.detailedShots[shot.stroke]++;
  });
  
  stats.set(player1Id, player1Stats);
  stats.set(player2Id, player2Stats);
  
  return stats;
}

async function createCompletedMatch() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Fetch users from the database
    const users = await User.find().limit(2).select("_id username fullName");

    if (users.length < 2) {
      console.error("Error: Need at least 2 users in the database to create a match.");
      console.log(`Found ${users.length} user(s) in the database.`);
      process.exit(1);
    }

    const [player1, player2] = users;
    const player1Id = player1._id.toString();
    const player2Id = player2._id.toString();

    console.log(`\nCreating completed match between:`);
    console.log(`  Player 1: ${player1.username} (${player1.fullName})`);
    console.log(`  Player 2: ${player2.username} (${player2.fullName})`);

    // Define game scores (best of 3, player1 wins 2-1)
    const games = [
      { gameNumber: 1, side1Score: 11, side2Score: 9, winner: "side1" },
      { gameNumber: 2, side1Score: 7, side2Score: 11, winner: "side2" },
      { gameNumber: 3, side1Score: 11, side2Score: 8, winner: "side1" },
    ];

    const matchStartTime = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes ago
    const matchDuration = 45 * 60 * 1000; // 45 minutes in milliseconds

    // Create games with shots
    const gamesWithShots = games.map((game, index) => {
      const gameStartTime = new Date(matchStartTime.getTime() + index * 15 * 60 * 1000);
      const gameDuration = 15 * 60 * 1000; // 15 minutes per game
      const totalPoints = game.side1Score + game.side2Score;
      
      const shots = createShotsForGame(
        game.gameNumber,
        player1._id,
        player2._id,
        game.side1Score,
        game.side2Score,
        totalPoints
      );

      return {
        gameNumber: game.gameNumber,
        side1Score: game.side1Score,
        side2Score: game.side2Score,
        winnerSide: game.winner,
        completed: true,
        shots: shots,
        duration: gameDuration,
        startTime: gameStartTime,
        endTime: new Date(gameStartTime.getTime() + gameDuration),
      };
    });

    // Calculate final score
    const side1Sets = games.filter((g) => g.winner === "side1").length;
    const side2Sets = games.filter((g) => g.winner === "side2").length;

    // Collect all shots for statistics
    const allShots = gamesWithShots.flatMap((g) => g.shots);
    const playerStats = createPlayerStats(allShots, player1Id, player2Id);

    // Create the completed match
    const match = new IndividualMatch({
      matchType: "singles",
      matchCategory: "individual",
      numberOfSets: 3,
      participants: [player1._id, player2._id],
      scorer: player1._id,
      city: "Default City",
      venue: "Default Venue",
      status: "completed",
      currentGame: 3,
      currentServer: null,
      games: gamesWithShots,
      finalScore: {
        side1Sets: side1Sets,
        side2Sets: side2Sets,
      },
      winnerSide: side1Sets > side2Sets ? "side1" : "side2",
      matchDuration: matchDuration,
      statistics: {
        playerStats: playerStats,
      },
      createdAt: matchStartTime,
      updatedAt: new Date(),
    });

    await match.save();

    // Populate the match to get full user details
    await match.populate("participants", "username fullName profileImage");
    await match.populate("scorer", "username fullName");

    // Update player statistics
    console.log("\nUpdating player statistics...");
    try {
      await statsService.updateIndividualMatchStats(match._id.toString());
      console.log("✅ Player statistics updated successfully!");
    } catch (statsError) {
      console.warn("⚠️  Warning: Could not update player statistics:", statsError);
    }

    console.log("\n✅ Completed match created successfully!");
    console.log("\nMatch Details:");
    console.log(`  Match ID: ${match._id}`);
    console.log(`  Match Type: ${match.matchType}`);
    console.log(`  Category: ${match.matchCategory}`);
    console.log(`  Number of Sets: ${match.numberOfSets}`);
    console.log(`  Status: ${match.status}`);
    console.log(`  Winner: ${match.winnerSide === "side1" ? player1.username : player2.username}`);
    console.log(`  Final Score: ${match.finalScore.side1Sets}-${match.finalScore.side2Sets}`);
    console.log(`  Match Duration: ${Math.round(match.matchDuration! / 60000)} minutes`);
    console.log(`  City: ${match.city}`);
    console.log(`  Venue: ${match.venue}`);
    console.log(`  Scorer: ${match.scorer?.username || "N/A"}`);
    console.log(`\n  Games:`);
    gamesWithShots.forEach((game) => {
      console.log(
        `    Game ${game.gameNumber}: ${game.side1Score}-${game.side2Score} (Winner: ${game.winnerSide === "side1" ? player1.username : player2.username}, Shots: ${game.shots.length})`
      );
    });
    console.log(`\n  Statistics:`);
    const stats1 = playerStats.get(player1Id);
    const stats2 = playerStats.get(player2Id);
    console.log(`    ${player1.username}: ${Object.keys(stats1.detailedShots).length} stroke types recorded`);
    console.log(`    ${player2.username}: ${Object.keys(stats2.detailedShots).length} stroke types recorded`);
    console.log(`\nMatch can be viewed at: /matches/${match._id}?category=individual`);

    process.exit(0);
  } catch (error: any) {
    console.error("Error creating completed match:", error);
    process.exit(1);
  }
}

// Run the script
createCompletedMatch();

