import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import Tournament from "../models/Tournament";
import IndividualMatch from "../models/IndividualMatch";
import { User } from "../models/User";
import { statsService } from "../services/statsService";
import { calculateStandings } from "../services/tournamentService";

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

// Helper to convert to ObjectId
const toObjectId = (id: any): mongoose.Types.ObjectId => {
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  if (typeof id === 'string') {
    return new mongoose.Types.ObjectId(id);
  }
  return new mongoose.Types.ObjectId(id.toString());
};

// Create shots for a game
function createShotsForGame(
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  side1Score: number,
  side2Score: number,
  totalPoints: number
): any[] {
  const shots: any[] = [];
  let shotNumber = 1;
  let currentServer: "side1" | "side2" = "side1";
  let serveCount = 0;
  
  for (let i = 0; i < totalPoints; i++) {
    if (serveCount >= 2) {
      currentServer = currentServer === "side1" ? "side2" : "side1";
      serveCount = 0;
    }
    serveCount++;
    
    const pointWinner = i < side1Score ? "side1" : "side2";
    const pointWinnerPlayer = pointWinner === "side1" ? player1Id : player2Id;
    const currentServerPlayer = currentServer === "side1" ? player1Id : player2Id;
    
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
      timestamp: new Date(Date.now() - (totalPoints - i) * 10000),
    };
    
    shots.push(shot);
  }
  
  return shots;
}

// Create a completed match
async function createCompletedMatch(
  player1Id: mongoose.Types.ObjectId,
  player2Id: mongoose.Types.ObjectId,
  tournamentId: mongoose.Types.ObjectId,
  organizerId: mongoose.Types.ObjectId,
  city: string,
  venue: string,
  numberOfSets: number,
  matchType: string
): Promise<any> {
  // Determine winner (random but consistent)
  const player1Wins = Math.random() > 0.5;
  const games = [];
  
  let side1Sets = 0;
  let side2Sets = 0;
  const setsNeeded = Math.ceil(numberOfSets / 2);
  
  for (let gameNum = 1; gameNum <= numberOfSets && (side1Sets < setsNeeded && side2Sets < setsNeeded); gameNum++) {
    let side1Score, side2Score, winner;
    
    if (player1Wins && side1Sets < setsNeeded) {
      // Player 1 wins this game
      side1Score = 11;
      side2Score = Math.floor(Math.random() * 9) + 1; // 1-9
      winner = "side1";
      side1Sets++;
    } else if (!player1Wins && side2Sets < setsNeeded) {
      // Player 2 wins this game
      side1Score = Math.floor(Math.random() * 9) + 1; // 1-9
      side2Score = 11;
      winner = "side2";
      side2Sets++;
    } else {
      // Finish the match
      if (side1Sets < setsNeeded) {
        side1Score = 11;
        side2Score = Math.floor(Math.random() * 9) + 1;
        winner = "side1";
        side1Sets++;
      } else {
        side1Score = Math.floor(Math.random() * 9) + 1;
        side2Score = 11;
        winner = "side2";
        side2Sets++;
      }
    }
    
    const totalPoints = side1Score + side2Score;
    const shots = createShotsForGame(player1Id, player2Id, side1Score, side2Score, totalPoints);
    
    games.push({
      gameNumber: gameNum,
      side1Score,
      side2Score,
      winnerSide: winner,
      completed: true,
      shots,
      duration: 15 * 60 * 1000,
      startTime: new Date(Date.now() - (numberOfSets - gameNum + 1) * 15 * 60 * 1000),
      endTime: new Date(Date.now() - (numberOfSets - gameNum) * 15 * 60 * 1000),
    });
  }
  
  const match = new IndividualMatch({
    matchType: matchType as any,
    matchCategory: "individual",
    numberOfSets,
    participants: [player1Id, player2Id],
    scorer: organizerId,
    tournament: tournamentId,
    city,
    venue,
    status: "completed",
    currentGame: numberOfSets,
    games,
    finalScore: {
      side1Sets,
      side2Sets,
    },
    winnerSide: side1Sets > side2Sets ? "side1" : "side2",
    matchDuration: numberOfSets * 15 * 60 * 1000,
    createdAt: new Date(Date.now() - numberOfSets * 15 * 60 * 1000),
    updatedAt: new Date(),
  });
  
  await match.save();
  
  // Update stats
  try {
    await statsService.updateIndividualMatchStats(match._id.toString());
  } catch (error) {
    console.warn("Warning: Could not update match stats:", error);
  }
  
  return match;
}

async function createCompletedTournament() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Fetch users for the tournament (need at least 8 for a good tournament)
    const users = await User.find().limit(8).select("_id username fullName");

    if (users.length < 4) {
      console.error("Error: Need at least 4 users in the database to create a tournament.");
      console.log(`Found ${users.length} user(s) in the database.`);
      process.exit(1);
    }

    const organizer = users[0];
    const participants = users.slice(0, Math.min(8, users.length));
    const participantIds = participants.map((u) => u._id);

    console.log(`\nCreating completed multi-stage tournament:`);
    console.log(`  Organizer: ${organizer.username}`);
    console.log(`  Participants: ${participants.length}`);
    participants.forEach((p, idx) => {
      console.log(`    ${idx + 1}. ${p.username}`);
    });

    const tournamentStartTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const tournamentEndTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    // Create seeding
    const seeding = participants.map((p, idx) => ({
      participant: p._id,
      seedNumber: idx + 1,
      seedingRank: idx + 1,
      seedingPoints: participants.length - idx,
    }));

    // STAGE 1: Round Robin (No Groups)
    console.log("\n📊 Stage 1: Round Robin (All vs All)");
    
    const useGroups = false; // Disabled as requested
    let stage1Matches: mongoose.Types.ObjectId[] = [];
    let stage1Standings: any[] = [];
    let stage1Rounds: any[] = [];

    // Generate round robin schedule using Berger Tables algorithm
    // Distribute matches across multiple rounds so each player plays once per round
    const n = participants.length;
    const numRounds = n % 2 === 0 ? n - 1 : n;
    const matchesPerRound = Math.floor(n / 2);
    
    // Create all unique pairings
    const allPairings: Array<{ p1: number; p2: number }> = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        allPairings.push({ p1: i, p2: j });
      }
    }
    
    // Track which pairings have been used
    const usedPairings = new Set<string>();
    
    // Generate rounds
    for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
      const roundMatches: mongoose.Types.ObjectId[] = [];
      const roundParticipants = new Set<number>();
      
      // Try to fill this round with matches where each player plays once
      for (const pairing of allPairings) {
        const key = `${Math.min(pairing.p1, pairing.p2)}-${Math.max(pairing.p1, pairing.p2)}`;
        
        // Check if this pairing hasn't been used and both players are available this round
        if (!usedPairings.has(key) &&
            !roundParticipants.has(pairing.p1) && 
            !roundParticipants.has(pairing.p2)) {
          
          const match = await createCompletedMatch(
            toObjectId(participants[pairing.p1]._id),
            toObjectId(participants[pairing.p2]._id),
            new mongoose.Types.ObjectId(),
            toObjectId(organizer._id),
            "Tournament City",
            "Tournament Venue",
            3,
            "singles"
          );
          
          roundMatches.push(match._id);
          stage1Matches.push(match._id);
          usedPairings.add(key);
          roundParticipants.add(pairing.p1);
          roundParticipants.add(pairing.p2);
          
          // If we've filled the round, move to next round
          if (roundMatches.length >= matchesPerRound) break;
        }
      }
      
      // If we couldn't fill the round completely, add remaining matches
      if (roundMatches.length < matchesPerRound) {
        for (const pairing of allPairings) {
          const key = `${Math.min(pairing.p1, pairing.p2)}-${Math.max(pairing.p1, pairing.p2)}`;
          
          if (!usedPairings.has(key) &&
              !roundParticipants.has(pairing.p1) && 
              !roundParticipants.has(pairing.p2)) {
            
            const match = await createCompletedMatch(
              toObjectId(participants[pairing.p1]._id),
              toObjectId(participants[pairing.p2]._id),
              new mongoose.Types.ObjectId(),
              toObjectId(organizer._id),
              "Tournament City",
              "Tournament Venue",
              3,
              "singles"
            );
            
            roundMatches.push(match._id);
            stage1Matches.push(match._id);
            usedPairings.add(key);
            roundParticipants.add(pairing.p1);
            roundParticipants.add(pairing.p2);
          }
        }
      }
      
      if (roundMatches.length > 0) {
        const roundDate = new Date(tournamentStartTime.getTime() + (roundNum - 1) * 24 * 60 * 60 * 1000);
        stage1Rounds.push({
          roundNumber: roundNum,
          matches: roundMatches,
          completed: true,
          scheduledDate: roundDate,
        });
      }
    }
    
    stage1Standings = participants.map((p) => ({
      participant: p._id,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      pointsScored: 0,
      pointsConceded: 0,
      pointsDiff: 0,
      points: 0,
      rank: 0,
      form: [],
      headToHead: new Map(),
    }));

    // Calculate standings from matches
    const allStage1Matches = await IndividualMatch.find({
      _id: { $in: stage1Matches },
    }).lean();

    // Update standings based on matches
    allStage1Matches.forEach((match: any) => {
      const p1 = match.participants[0];
      const p2 = match.participants[1];
      const p1Id = (p1?._id || p1).toString();
      const p2Id = (p2?._id || p2).toString();
      
      const p1Standing = stage1Standings.find((s: any) => s.participant.toString() === p1Id);
      const p2Standing = stage1Standings.find((s: any) => s.participant.toString() === p2Id);
      
      if (p1Standing && p2Standing) {
        p1Standing.played++;
        p2Standing.played++;
        
        const p1Sets = match.finalScore.side1Sets;
        const p2Sets = match.finalScore.side2Sets;
        
        p1Standing.setsWon += p1Sets;
        p1Standing.setsLost += p2Sets;
        p2Standing.setsWon += p2Sets;
        p2Standing.setsLost += p1Sets;
        
        match.games.forEach((game: any) => {
          p1Standing.pointsScored += game.side1Score;
          p1Standing.pointsConceded += game.side2Score;
          p2Standing.pointsScored += game.side2Score;
          p2Standing.pointsConceded += game.side1Score;
        });
        
        if (match.winnerSide === "side1") {
          p1Standing.won++;
          p1Standing.points += 2;
          p2Standing.lost++;
          p1Standing.form.push("W");
          p2Standing.form.push("L");
        } else {
          p2Standing.won++;
          p2Standing.points += 2;
          p1Standing.lost++;
          p2Standing.form.push("W");
          p1Standing.form.push("L");
        }
        
        p1Standing.setsDiff = p1Standing.setsWon - p1Standing.setsLost;
        p2Standing.setsDiff = p2Standing.setsWon - p2Standing.setsLost;
        p1Standing.pointsDiff = p1Standing.pointsScored - p1Standing.pointsConceded;
        p2Standing.pointsDiff = p2Standing.pointsScored - p2Standing.pointsConceded;
      }
    });

    // Sort standings
    stage1Standings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;
      return b.pointsDiff - a.pointsDiff;
    });
    
    stage1Standings.forEach((standing: any, idx: number) => {
      standing.rank = idx + 1;
    });

    // STAGE 2: Knockout Bracket
    console.log("\n🏆 Stage 2: Knockout Bracket");
    
    // Top 4 advance to knockout
    const top4 = stage1Standings.slice(0, 4).map((s: any) => s.participant);
    const knockoutMatches: mongoose.Types.ObjectId[] = [];
    
    // Semi-finals
    const semi1Match = await createCompletedMatch(
      toObjectId(top4[0]),
      toObjectId(top4[3]),
      new mongoose.Types.ObjectId(),
      toObjectId(organizer._id),
      "Tournament City",
      "Tournament Venue",
      3,
      "singles"
    );
    knockoutMatches.push(semi1Match._id);
    
    const semi2Match = await createCompletedMatch(
      toObjectId(top4[1]),
      toObjectId(top4[2]),
      new mongoose.Types.ObjectId(),
      toObjectId(organizer._id),
      "Tournament City",
      "Tournament Venue",
      3,
      "singles"
    );
    knockoutMatches.push(semi2Match._id);
    
    // Determine finalists
    const finalist1 = semi1Match.winnerSide === "side1" ? top4[0] : top4[3];
    const finalist2 = semi2Match.winnerSide === "side1" ? top4[1] : top4[2];
    
    // Final
    const finalMatch = await createCompletedMatch(
      toObjectId(finalist1),
      toObjectId(finalist2),
      new mongoose.Types.ObjectId(),
      toObjectId(organizer._id),
      "Tournament City",
      "Tournament Venue",
      5, // Best of 5 for final
      "singles"
    );
    knockoutMatches.push(finalMatch._id);
    
    const champion = finalMatch.winnerSide === "side1" ? finalist1 : finalist2;
    
    // Create bracket structure
    const bracket = {
      size: 4,
      rounds: [
        {
          roundNumber: 1,
          name: "Semi-finals",
          matches: [
            {
              bracketPosition: 0,
              roundNumber: 1,
              participant1: { type: "direct", participantId: toObjectId(top4[0]) },
              participant2: { type: "direct", participantId: toObjectId(top4[3]) },
              winner: toObjectId(finalist1),
              loser: toObjectId(semi1Match.winnerSide === "side1" ? top4[3] : top4[0]),
              nextMatchPosition: 0,
              completed: true,
              matchId: semi1Match._id,
            },
            {
              bracketPosition: 1,
              roundNumber: 1,
              participant1: { type: "direct", participantId: toObjectId(top4[1]) },
              participant2: { type: "direct", participantId: toObjectId(top4[2]) },
              winner: toObjectId(finalist2),
              loser: toObjectId(semi2Match.winnerSide === "side1" ? top4[2] : top4[1]),
              nextMatchPosition: 0,
              completed: true,
              matchId: semi2Match._id,
            },
          ],
          completed: true,
          scheduledDate: tournamentEndTime,
        },
        {
          roundNumber: 2,
          name: "Final",
          matches: [
            {
              bracketPosition: 0,
              roundNumber: 2,
              participant1: { type: "from_match", fromMatchPosition: 0, isWinnerOf: true },
              participant2: { type: "from_match", fromMatchPosition: 1, isWinnerOf: true },
              winner: toObjectId(champion),
              loser: toObjectId(finalMatch.winnerSide === "side1" ? finalist2 : finalist1),
              completed: true,
              matchId: finalMatch._id,
            },
          ],
          completed: true,
          scheduledDate: tournamentEndTime,
        },
      ],
      consolationBracket: false,
    };

    // Create tournament
    const tournament = new Tournament({
      name: "Pravaah 2025",
      format: "round_robin",
      category: "individual",
      matchType: "singles",
      startDate: tournamentStartTime,
      endDate: tournamentEndTime,
      status: "completed",
      participants: participantIds,
      organizer: organizer._id,
      seeding,
      seedingMethod: "manual",
      useGroups: false,
      numberOfGroups: undefined,
      groups: undefined,
      rounds: stage1Rounds,
      standings: stage1Standings,
      isMultiStage: true,
      currentStageNumber: 2,
      stages: [
        {
          stageNumber: 1,
          name: "Group Stage",
          format: "round_robin",
          startDate: tournamentStartTime,
          endDate: new Date(tournamentStartTime.getTime() + 5 * 24 * 60 * 60 * 1000),
          status: "completed",
          groups: undefined,
        },
        {
          stageNumber: 2,
          name: "Knockout Stage",
          format: "knockout",
          startDate: new Date(tournamentStartTime.getTime() + 5 * 24 * 60 * 60 * 1000),
          endDate: tournamentEndTime,
          status: "completed",
          bracket,
        },
      ],
      bracket,
      rules: {
        pointsForWin: 2,
        pointsForLoss: 0,
        setsPerMatch: 3,
        pointsPerSet: 11,
        advanceTop: 4,
        deuceSetting: "standard",
        tiebreakRules: ["points", "head_to_head", "sets_ratio", "points_ratio", "sets_won"],
      },
      drawGenerated: true,
      drawGeneratedAt: tournamentStartTime,
      drawGeneratedBy: organizer._id,
      city: "Tournament City",
      venue: "Tournament Venue",
      createdAt: tournamentStartTime,
      updatedAt: tournamentEndTime,
    });

    await tournament.save();

    // Update all match tournament references
    await IndividualMatch.updateMany(
      { _id: { $in: [...stage1Matches, ...knockoutMatches] } },
      { $set: { tournament: tournament._id } }
    );

    // Populate tournament
    await tournament.populate([
      { path: "organizer", select: "username fullName" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName" },
    ]);
    const championUser = participants.find((p) => {
      const pId = p._id instanceof mongoose.Types.ObjectId ? p._id : toObjectId(p._id);
      const champId = champion instanceof mongoose.Types.ObjectId ? champion : toObjectId(champion);
      return pId.toString() === champId.toString();
    });
    console.log(`    Champion: ${championUser?.username || "N/A"}`);
    console.log(`\nTournament can be viewed at: /tournaments/${tournament._id}`);

    process.exit(0);
  } catch (error: any) {
    console.error("Error creating completed tournament:", error);
    process.exit(1);
  }
}

// Run the script
createCompletedTournament();

