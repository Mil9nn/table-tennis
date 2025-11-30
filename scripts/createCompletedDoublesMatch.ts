import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import IndividualMatch from "../models/IndividualMatch";
import { User } from "../models/User";
import { statsService } from "../services/statsService";
import { buildDoublesRotation, flipDoublesRotationForNextGame } from "../components/live-scorer/individual/helpers";

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

// Map doubles server key to player ID
function getPlayerFromServerKey(
  serverKey: string,
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  player3Id: mongoose.Types.ObjectId,
  player4Id: mongoose.Types.ObjectId
): mongoose.Types.ObjectId {
  switch (serverKey) {
    case "side1_main":
      return player1Id;
    case "side1_partner":
      return player2Id;
    case "side2_main":
      return player3Id;
    case "side2_partner":
      return player4Id;
    default:
      return player1Id;
  }
}

// Create shots for a doubles game
function createShotsForDoublesGame(
  gameNumber: number,
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  player3Id: mongoose.Types.ObjectId,
  player4Id: mongoose.Types.ObjectId,
  side1Score: number,
  side2Score: number,
  totalPoints: number,
  serverOrder: string[]
): any[] {
  const shots: any[] = [];
  let shotNumber = 1;
  
  // In doubles, server rotates every 2 points
  for (let i = 0; i < totalPoints; i++) {
    const serveCycle = Math.floor(i / 2);
    const serverIndex = serveCycle % serverOrder.length;
    const currentServerKey = serverOrder[serverIndex];
    const currentServer = getPlayerFromServerKey(
      currentServerKey,
      player1Id,
      player2Id,
      player3Id,
      player4Id
    );
    
    // Determine which side scored this point
    const pointWinner = i < side1Score ? "side1" : "side2";
    const pointWinnerPlayer = pointWinner === "side1"
      ? (i % 2 === 0 ? player1Id : player2Id) // Alternate between side1 players
      : (i % 2 === 0 ? player3Id : player4Id); // Alternate between side2 players
    
    const shot = {
      shotNumber: shotNumber++,
      side: pointWinner,
      player: pointWinnerPlayer,
      stroke: getRandomStroke(),
      server: currentServer,
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
function createPlayerStats(shots: any[], playerIds: string[]): Map<string, any> {
  const stats = new Map();
  
  // Initialize stats for all players
  playerIds.forEach((playerId) => {
    stats.set(playerId, {
      detailedShots: {},
    });
  });
  
  shots.forEach((shot) => {
    const playerId = shot.player.toString();
    const statsObj = stats.get(playerId);
    
    if (statsObj) {
      if (!statsObj.detailedShots[shot.stroke]) {
        statsObj.detailedShots[shot.stroke] = 0;
      }
      statsObj.detailedShots[shot.stroke]++;
    }
  });
  
  return stats;
}

async function createCompletedDoublesMatch() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Fetch 4 users from the database for doubles
    const users = await User.find().limit(4).select("_id username fullName");

    if (users.length < 4) {
      console.error("Error: Need at least 4 users in the database to create a doubles match.");
      console.log(`Found ${users.length} user(s) in the database.`);
      process.exit(1);
    }

    const [player1, player2, player3, player4] = users;
    const playerIds = [
      player1._id.toString(),
      player2._id.toString(),
      player3._id.toString(),
      player4._id.toString(),
    ];

    console.log(`\nCreating completed doubles match:`);
    console.log(`  Team 1 (Side 1):`);
    console.log(`    Player 1: ${player1.username} (${player1.fullName})`);
    console.log(`    Player 2: ${player2.username} (${player2.fullName})`);
    console.log(`  Team 2 (Side 2):`);
    console.log(`    Player 3: ${player3.username} (${player3.fullName})`);
    console.log(`    Player 4: ${player4.username} (${player4.fullName})`);

    // Define game scores (best of 3, side1 wins 2-1)
    const games = [
      { gameNumber: 1, side1Score: 11, side2Score: 9, winner: "side1" },
      { gameNumber: 2, side1Score: 8, side2Score: 11, winner: "side2" },
      { gameNumber: 3, side1Score: 11, side2Score: 7, winner: "side1" },
    ];

    const matchStartTime = new Date(Date.now() - 50 * 60 * 1000); // 50 minutes ago
    const matchDuration = 50 * 60 * 1000; // 50 minutes in milliseconds

    // Build initial doubles rotation
    let serverOrder = buildDoublesRotation("side1_main", "side2_main");

    // Create games with shots
    const gamesWithShots = games.map((game, index) => {
      const gameStartTime = new Date(matchStartTime.getTime() + index * 16 * 60 * 1000);
      const gameDuration = 16 * 60 * 1000; // 16 minutes per game
      const totalPoints = game.side1Score + game.side2Score;
      
      // Flip rotation for even-numbered games
      if (index > 0 && index % 2 === 0) {
        serverOrder = flipDoublesRotationForNextGame(serverOrder);
      }
      
      const shots = createShotsForDoublesGame(
        game.gameNumber,
        player1._id,
        player2._id,
        player3._id,
        player4._id,
        game.side1Score,
        game.side2Score,
        totalPoints,
        serverOrder
      );

      // Flip rotation for next game
      if (index < games.length - 1) {
        serverOrder = flipDoublesRotationForNextGame(serverOrder);
      }

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
    const playerStats = createPlayerStats(allShots, playerIds);

    // Build initial server config
    const initialServerOrder = buildDoublesRotation("side1_main", "side2_main");

    // Create the completed match
    const match = new IndividualMatch({
      matchType: "doubles",
      matchCategory: "individual",
      numberOfSets: 3,
      participants: [player1._id, player2._id, player3._id, player4._id],
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
      serverConfig: {
        firstServer: "side1_main",
        firstReceiver: "side2_main",
        serverOrder: initialServerOrder,
      },
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

    console.log("\n✅ Completed doubles match created successfully!");
    console.log("\nMatch Details:");
    console.log(`  Match ID: ${match._id}`);
    console.log(`  Match Type: ${match.matchType}`);
    console.log(`  Category: ${match.matchCategory}`);
    console.log(`  Number of Sets: ${match.numberOfSets}`);
    console.log(`  Status: ${match.status}`);
    console.log(`  Winner: ${match.winnerSide === "side1" ? "Team 1" : "Team 2"}`);
    console.log(`  Final Score: ${match.finalScore.side1Sets}-${match.finalScore.side2Sets}`);
    console.log(`  Match Duration: ${Math.round(match.matchDuration! / 60000)} minutes`);
    console.log(`  City: ${match.city}`);
    console.log(`  Venue: ${match.venue}`);
    console.log(`  Scorer: ${match.scorer?.username || "N/A"}`);
    console.log(`\n  Teams:`);
    console.log(`    Team 1 (Side 1): ${player1.username} & ${player2.username}`);
    console.log(`    Team 2 (Side 2): ${player3.username} & ${player4.username}`);
    console.log(`\n  Games:`);
    gamesWithShots.forEach((game) => {
      const winner = game.winnerSide === "side1" ? "Team 1" : "Team 2";
      console.log(
        `    Game ${game.gameNumber}: ${game.side1Score}-${game.side2Score} (Winner: ${winner}, Shots: ${game.shots.length})`
      );
    });
    console.log(`\n  Statistics:`);
    playerIds.forEach((playerId, index) => {
      const player = users[index];
      const stats = playerStats.get(playerId);
      console.log(`    ${player.username}: ${Object.keys(stats.detailedShots).length} stroke types recorded`);
    });
    console.log(`\nMatch can be viewed at: /matches/${match._id}?category=individual`);

    process.exit(0);
  } catch (error: any) {
    console.error("Error creating completed doubles match:", error);
    process.exit(1);
  }
}

// Run the script
createCompletedDoublesMatch();

