import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import TeamMatch from "../models/TeamMatch";
import Team from "../models/Team";
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

// Create shots for a singles game in team match
function createShotsForSinglesGame(
  gameNumber: number,
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  team1Score: number,
  team2Score: number,
  totalPoints: number,
  firstServer: "team1" | "team2"
): any[] {
  const shots: any[] = [];
  let shotNumber = 1;
  let currentServer: "team1" | "team2" = firstServer;
  
  // Alternate serves every 2 points
  let serveCount = 0;
  
  for (let i = 0; i < totalPoints; i++) {
    // Switch server every 2 points
    if (serveCount >= 2) {
      currentServer = currentServer === "team1" ? "team2" : "team1";
      serveCount = 0;
    }
    serveCount++;
    
    // Determine which team scored this point
    const pointWinner = i < team1Score ? "team1" : "team2";
    const pointWinnerPlayer = pointWinner === "team1" ? player1Id : player2Id;
    const currentServerPlayer = currentServer === "team1" ? player1Id : player2Id;
    
    const shot = {
      shotNumber: shotNumber++,
      side: pointWinner,
      player: pointWinnerPlayer,
      stroke: getRandomStroke(),
      server: currentServerPlayer,
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

// Create player statistics from all submatches
function createPlayerStats(subMatches: any[]): Map<string, any> {
  const stats = new Map();
  
  subMatches.forEach((subMatch) => {
    subMatch.games.forEach((game: any) => {
      if (game.shots) {
        game.shots.forEach((shot: any) => {
          const playerId = shot.player.toString();
          
          if (!stats.has(playerId)) {
            stats.set(playerId, {
              detailedShots: {},
            });
          }
          
          const statsObj = stats.get(playerId);
          if (!statsObj.detailedShots[shot.stroke]) {
            statsObj.detailedShots[shot.stroke] = 0;
          }
          statsObj.detailedShots[shot.stroke]++;
        });
      }
    });
  });
  
  return stats;
}

async function createCompletedTeamMatch() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Fetch 2 teams from the database
    const teams = await Team.find()
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName")
      .limit(2);

    if (teams.length < 2) {
      console.error("Error: Need at least 2 teams in the database to create a team match.");
      console.log(`Found ${teams.length} team(s) in the database.`);
      process.exit(1);
    }

    const [team1, team2] = teams;

    // Check if teams have enough players with assignments
    const team1Assignments = team1.assignments || new Map();
    const team2Assignments = team2.assignments || new Map();

    // Ensure teams have player assignments (A, B, C for team1, X, Y, Z for team2)
    const requiredPositions1 = ["A", "B", "C"];
    const requiredPositions2 = ["X", "Y", "Z"];

    const hasTeam1Assignments = requiredPositions1.every((pos) => {
      for (const [playerId, position] of team1Assignments.entries()) {
        if (position === pos) return true;
      }
      return false;
    });

    const hasTeam2Assignments = requiredPositions2.every((pos) => {
      for (const [playerId, position] of team2Assignments.entries()) {
        if (position === pos) return true;
      }
      return false;
    });

    if (!hasTeam1Assignments || !hasTeam2Assignments) {
      console.warn("⚠️  Warning: Teams may not have all required position assignments.");
      console.log("Creating assignments automatically...");
      
      // Auto-assign positions if missing
      if (!hasTeam1Assignments && team1.players.length >= 3) {
        requiredPositions1.forEach((pos, idx) => {
          if (idx < team1.players.length) {
            const player = team1.players[idx].user;
            const playerId = player._id ? player._id.toString() : player.toString();
            team1Assignments.set(playerId, pos);
          }
        });
      }
      
      if (!hasTeam2Assignments && team2.players.length >= 3) {
        requiredPositions2.forEach((pos, idx) => {
          if (idx < team2.players.length) {
            const player = team2.players[idx].user;
            const playerId = player._id ? player._id.toString() : player.toString();
            team2Assignments.set(playerId, pos);
          }
        });
      }
    }

    console.log(`\nCreating completed team match:`);
    console.log(`  Team 1: ${team1.name}`);
    console.log(`  Team 2: ${team2.name}`);

    // Generate five singles submatches (A vs X, B vs Y, C vs Z, A vs Y, B vs X)
    const submatchOrder = [
      { team1Pos: "A", team2Pos: "X" },
      { team1Pos: "B", team2Pos: "Y" },
      { team1Pos: "C", team2Pos: "Z" },
      { team1Pos: "A", team2Pos: "Y" },
      { team1Pos: "B", team2Pos: "X" },
    ];

    const matchStartTime = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago
    const matchDuration = 120 * 60 * 1000; // 2 hours

    const subMatches: any[] = [];
    let team1MatchesWon = 0;
    let team2MatchesWon = 0;

    // Create submatches with games
    for (let i = 0; i < submatchOrder.length; i++) {
      const { team1Pos, team2Pos } = submatchOrder[i];
      
      // Find players by position
      let player1Id: mongoose.Types.ObjectId | null = null;
      let player2Id: mongoose.Types.ObjectId | null = null;

      // Helper function to convert to ObjectId
      const toObjectId = (id: any): mongoose.Types.ObjectId => {
        if (id instanceof mongoose.Types.ObjectId) {
          return id;
        }
        if (typeof id === 'string') {
          return new mongoose.Types.ObjectId(id);
        }
        return new mongoose.Types.ObjectId(id.toString());
      };

      for (const [playerId, position] of team1Assignments.entries()) {
        if (position === team1Pos) {
          player1Id = toObjectId(playerId);
          break;
        }
      }

      // If not found in assignments, try to get from team players directly
      if (!player1Id && team1.players.length >= 3) {
        const posIndex = requiredPositions1.indexOf(team1Pos);
        if (posIndex >= 0 && posIndex < team1.players.length) {
          const player = team1.players[posIndex].user;
          const playerIdValue = (player && typeof player === 'object' && '_id' in player) ? player._id : player;
          player1Id = toObjectId(playerIdValue);
        }
      }

      for (const [playerId, position] of team2Assignments.entries()) {
        if (position === team2Pos) {
          player2Id = toObjectId(playerId);
          break;
        }
      }

      // If not found in assignments, try to get from team players directly
      if (!player2Id && team2.players.length >= 3) {
        const posIndex = requiredPositions2.indexOf(team2Pos);
        if (posIndex >= 0 && posIndex < team2.players.length) {
          const player = team2.players[posIndex].user;
          const playerIdValue = (player && typeof player === 'object' && '_id' in player) ? player._id : player;
          player2Id = toObjectId(playerIdValue);
        }
      }

      if (!player1Id || !player2Id) {
        console.warn(`⚠️  Skipping submatch ${i + 1}: Missing players for positions ${team1Pos} vs ${team2Pos}`);
        continue;
      }

      // Define game scores (best of 3, alternate winners)
      const games = [
        { gameNumber: 1, team1Score: 11, team2Score: 9, winner: i % 2 === 0 ? "team1" : "team2" },
        { gameNumber: 2, team1Score: 9, team2Score: 11, winner: i % 2 === 0 ? "team2" : "team1" },
        { gameNumber: 3, team1Score: 11, team2Score: 8, winner: i % 2 === 0 ? "team1" : "team2" },
      ];

      const submatchStartTime = new Date(matchStartTime.getTime() + i * 24 * 60 * 1000);
      const submatchDuration = 24 * 60 * 1000; // 24 minutes per submatch

      // Create games with shots
      const gamesWithShots = games.map((game, gameIdx) => {
        const gameStartTime = new Date(submatchStartTime.getTime() + gameIdx * 8 * 60 * 1000);
        const gameDuration = 8 * 60 * 1000; // 8 minutes per game
        const totalPoints = game.team1Score + game.team2Score;
        
        const firstServer: "team1" | "team2" = gameIdx % 2 === 0 ? "team1" : "team2";
        
        const shots = createShotsForSinglesGame(
          game.gameNumber,
          player1Id!,
          player2Id!,
          game.team1Score,
          game.team2Score,
          totalPoints,
          firstServer
        );

        return {
          gameNumber: game.gameNumber,
          team1Score: game.team1Score,
          team2Score: game.team2Score,
          winnerSide: game.winner,
          completed: true,
          shots: shots,
          duration: gameDuration,
          startTime: gameStartTime,
          endTime: new Date(gameStartTime.getTime() + gameDuration),
        };
      });

      // Calculate submatch winner
      const team1Sets = games.filter((g) => g.winner === "team1").length;
      const team2Sets = games.filter((g) => g.winner === "team2").length;
      const submatchWinner = team1Sets > team2Sets ? "team1" : "team2";

      if (submatchWinner === "team1") {
        team1MatchesWon++;
      } else {
        team2MatchesWon++;
      }

      subMatches.push({
        matchNumber: i + 1,
        matchType: "singles",
        playerTeam1: [player1Id],
        playerTeam2: [player2Id],
        numberOfSets: 3,
        games: gamesWithShots,
        finalScore: {
          team1Sets: team1Sets,
          team2Sets: team2Sets,
        },
        winnerSide: submatchWinner,
        status: "completed",
        completed: true,
        startedAt: submatchStartTime,
        completedAt: new Date(submatchStartTime.getTime() + submatchDuration),
        serverConfig: {
          firstServer: "team1",
          firstReceiver: "team2",
        },
        currentServer: null,
      });
    }

    // Determine overall match winner
    const winnerTeam = team1MatchesWon > team2MatchesWon ? "team1" : "team2";

    // Create player statistics
    const playerStats = createPlayerStats(subMatches);

    // Convert assignments Maps to objects for storage
    const team1AssignmentsObj: Record<string, string> = {};
    team1Assignments.forEach((value: string, key: string) => {
      team1AssignmentsObj[key] = value;
    });

    const team2AssignmentsObj: Record<string, string> = {};
    team2Assignments.forEach((value: string, key: string) => {
      team2AssignmentsObj[key] = value;
    });

    // Create the completed team match
    const teamMatch = new TeamMatch({
      matchCategory: "team",
      matchFormat: "five_singles",
      numberOfSetsPerSubMatch: 3,
      numberOfSubMatches: subMatches.length,
      currentSubMatch: subMatches.length,
      city: "Default City",
      venue: "Default Venue",
      scorer: team1.captain._id || team1.captain,
      team1: {
        name: team1.name,
        captain: team1.captain._id || team1.captain,
        players: team1.players.map((p: any) => ({
          user: p.user?._id || p.user,
          role: p.role || "player",
          joinedDate: p.joinedDate || new Date(),
        })),
        city: team1.city || "",
        assignments: team1AssignmentsObj,
      },
      team2: {
        name: team2.name,
        captain: team2.captain._id || team2.captain,
        players: team2.players.map((p: any) => ({
          user: p.user?._id || p.user,
          role: p.role || "player",
          joinedDate: p.joinedDate || new Date(),
        })),
        city: team2.city || "",
        assignments: team2AssignmentsObj,
      },
      subMatches: subMatches,
      finalScore: {
        team1Matches: team1MatchesWon,
        team2Matches: team2MatchesWon,
      },
      winnerTeam: winnerTeam,
      status: "completed",
      matchDuration: matchDuration,
      serverConfig: {
        firstServer: "team1",
        firstReceiver: "team2",
      },
      statistics: {
        playerStats: playerStats,
      },
      createdAt: matchStartTime,
      updatedAt: new Date(),
    });

    await teamMatch.save();

    // Populate the match to get full user details
    await teamMatch.populate([
      { path: "scorer", select: "username fullName" },
      { path: "team1.captain team2.captain", select: "username fullName" },
      {
        path: "team1.players.user team2.players.user",
        select: "username fullName profileImage",
      },
      {
        path: "subMatches.playerTeam1 subMatches.playerTeam2",
        select: "username fullName profileImage",
      },
      {
        path: "subMatches.games.shots.player",
        select: "username fullName profileImage",
      },
    ]);

    // Update team statistics
    console.log("\nUpdating team statistics...");
    try {
      await statsService.updateTeamMatchStats(teamMatch._id.toString());
      console.log("✅ Team statistics updated successfully!");
    } catch (statsError) {
      console.warn("⚠️  Warning: Could not update team statistics:", statsError);
    }

    console.log("\n✅ Completed team match created successfully!");
    console.log("\nMatch Details:");
    console.log(`  Match ID: ${teamMatch._id}`);
    console.log(`  Match Format: ${teamMatch.matchFormat}`);
    console.log(`  Category: ${teamMatch.matchCategory}`);
    console.log(`  Number of SubMatches: ${teamMatch.numberOfSubMatches}`);
    console.log(`  Sets per SubMatch: ${teamMatch.numberOfSetsPerSubMatch}`);
    console.log(`  Status: ${teamMatch.status}`);
    console.log(`  Winner: ${teamMatch.winnerTeam === "team1" ? team1.name : team2.name}`);
    console.log(`  Final Score: ${teamMatch.finalScore.team1Matches}-${teamMatch.finalScore.team2Matches}`);
    console.log(`  Match Duration: ${Math.round(teamMatch.matchDuration! / 60000)} minutes`);
    console.log(`  City: ${teamMatch.city}`);
    console.log(`  Venue: ${teamMatch.venue}`);
    console.log(`  Scorer: ${(teamMatch.scorer as any)?.username || "N/A"}`);
    console.log(`\n  Teams:`);
    console.log(`    Team 1: ${team1.name} (${team1.players.length} players)`);
    console.log(`    Team 2: ${team2.name} (${team2.players.length} players)`);
    console.log(`\n  SubMatches:`);
    subMatches.forEach((subMatch, idx) => {
      const player1 = (subMatch.playerTeam1[0] as any)?.username || "Unknown";
      const player2 = (subMatch.playerTeam2[0] as any)?.username || "Unknown";
      const winner = subMatch.winnerSide === "team1" ? player1 : player2;
      console.log(
        `    Match ${subMatch.matchNumber}: ${player1} vs ${player2} - ${subMatch.finalScore.team1Sets}-${subMatch.finalScore.team2Sets} (Winner: ${winner})`
      );
    });
    console.log(`\nMatch can be viewed at: /matches/${teamMatch._id}?category=team`);

    process.exit(0);
  } catch (error: any) {
    console.error("Error creating completed team match:", error);
    process.exit(1);
  }
}

// Run the script
createCompletedTeamMatch();

