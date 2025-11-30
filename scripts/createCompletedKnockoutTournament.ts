import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import Tournament from "../models/Tournament";
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

// Helper to convert to ObjectId
const toObjectId = (id: any): mongoose.Types.ObjectId | null => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  if (typeof id === 'string') {
    return new mongoose.Types.ObjectId(id);
  }
  if (typeof id === 'object' && id.toString) {
    return new mongoose.Types.ObjectId(id.toString());
  }
  return null;
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
      side1Score = 11;
      side2Score = Math.floor(Math.random() * 9) + 1;
      winner = "side1";
      side1Sets++;
    } else if (!player1Wins && side2Sets < setsNeeded) {
      side1Score = Math.floor(Math.random() * 9) + 1;
      side2Score = 11;
      winner = "side2";
      side2Sets++;
    } else {
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

// Calculate bracket size (next power of 2)
function getBracketSize(numParticipants: number): number {
  let size = 2;
  while (size < numParticipants) {
    size *= 2;
  }
  return size;
}

// Get round name based on bracket size and round number (ITTF standard naming)
function getRoundName(bracketSize: number, roundNumber: number): string {
  const totalRounds = Math.log2(bracketSize);
  const remainingRounds = totalRounds - roundNumber;

  if (remainingRounds === 0) return "Final";
  if (remainingRounds === 1) return "Semi Finals";
  if (remainingRounds === 2) return "Quarter Finals";
  if (remainingRounds === 3) return "Round of 16";
  if (remainingRounds === 4) return "Round of 32";
  if (remainingRounds === 5) return "Round of 64";
  if (remainingRounds === 6) return "Round of 128";

  return `Round ${roundNumber}`;
}

// Generate bracket structure
function generateBracketStructure(participants: any[], bracketSize: number): any {
  const rounds: any[] = [];
  let currentMatchPosition = 0;
  
  // Round 1: First round matches
  const round1Matches: any[] = [];
  const firstRoundMatches = bracketSize / 2;
  
  for (let i = 0; i < firstRoundMatches; i++) {
    const p1Index = i * 2;
    const p2Index = i * 2 + 1;
    
    if (p1Index < participants.length && p2Index < participants.length) {
      round1Matches.push({
        bracketPosition: currentMatchPosition,
        roundNumber: 1,
        participant1: {
          type: "direct",
          participantId: toObjectId(participants[p1Index]._id),
        },
        participant2: {
          type: "direct",
          participantId: toObjectId(participants[p2Index]._id),
        },
        nextMatchPosition: currentMatchPosition + firstRoundMatches + Math.floor(i / 2),
        completed: false,
      });
      currentMatchPosition++;
    } else if (p1Index < participants.length) {
      // Bye
      round1Matches.push({
        bracketPosition: currentMatchPosition,
        roundNumber: 1,
        participant1: {
          type: "direct",
          participantId: toObjectId(participants[p1Index]._id),
        },
        participant2: {
          type: "bye",
        },
        nextMatchPosition: currentMatchPosition + firstRoundMatches + Math.floor(i / 2),
        completed: false,
      });
      currentMatchPosition++;
    }
  }
  
  rounds.push({
    roundNumber: 1,
    name: getRoundName(bracketSize, 1),
    matches: round1Matches,
    completed: false,
  });
  
  // Subsequent rounds
  const numRounds = Math.log2(bracketSize);
  let previousRoundMatches = round1Matches.length;
  
  for (let roundNum = 2; roundNum <= numRounds; roundNum++) {
    const roundMatches: any[] = [];
    const roundName = getRoundName(bracketSize, roundNum);
    const matchesInRound = previousRoundMatches / 2;
    const roundStartPosition = currentMatchPosition;
    
    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        bracketPosition: currentMatchPosition,
        roundNumber: roundNum,
        participant1: {
          type: "from_match",
          fromMatchPosition: roundStartPosition - previousRoundMatches + i * 2,
          isWinnerOf: true,
        },
        participant2: {
          type: "from_match",
          fromMatchPosition: roundStartPosition - previousRoundMatches + i * 2 + 1,
          isWinnerOf: true,
        },
        nextMatchPosition: roundNum === numRounds ? undefined : roundStartPosition + matchesInRound + Math.floor(i / 2),
        completed: false,
      });
      currentMatchPosition++;
    }
    
    rounds.push({
      roundNumber: roundNum,
      name: roundName,
      matches: roundMatches,
      completed: false,
    });
    
    previousRoundMatches = matchesInRound;
  }
  
  return {
    size: bracketSize,
    rounds,
    consolationBracket: false,
  };
}

async function createCompletedKnockoutTournament() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Fetch users for the tournament (need at least 4, works best with power of 2)
    const users = await User.find().limit(16).select("_id username fullName");

    if (users.length < 4) {
      console.error("Error: Need at least 4 users in the database to create a knockout tournament.");
      console.log(`Found ${users.length} user(s) in the database.`);
      process.exit(1);
    }

    const organizer = users[0];
    // Use power of 2 participants for clean bracket
    const bracketSize = getBracketSize(users.length);
    const participants = users.slice(0, Math.min(bracketSize, users.length));
    const participantIds = participants.map((u) => u._id);

    console.log(`\nCreating completed knockout tournament:`);
    console.log(`  Organizer: ${organizer.username}`);
    console.log(`  Participants: ${participants.length}`);
    console.log(`  Bracket Size: ${bracketSize}`);
    participants.forEach((p, idx) => {
      console.log(`    ${idx + 1}. ${p.username}`);
    });

    const tournamentStartTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const tournamentEndTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    // Create seeding
    const seeding = participants.map((p, idx) => ({
      participant: p._id,
      seedNumber: idx + 1,
      seedingRank: idx + 1,
      seedingPoints: participants.length - idx,
    }));

    // Generate bracket structure
    const bracket = generateBracketStructure(participants, bracketSize);
    const allMatches: mongoose.Types.ObjectId[] = [];
    let champion: mongoose.Types.ObjectId | null = null;

    // Process each round
    for (let roundIdx = 0; roundIdx < bracket.rounds.length; roundIdx++) {
      const round = bracket.rounds[roundIdx];
      console.log(`\n🏆 ${round.name}`);
      
      const roundMatches: mongoose.Types.ObjectId[] = [];
      
      // First pass: Resolve all participants from previous round
      if (roundIdx > 0) {
        const prevRound = bracket.rounds[roundIdx - 1];
        const availableWinners: Array<{ winner: mongoose.Types.ObjectId; seed: number; matchPosition: number }> = [];
        
        // Collect all winners from previous round with their seeds
        for (const prevMatch of prevRound.matches) {
          if (prevMatch.winner) {
            const winnerSeed = seeding.find((s) => s.participant.toString() === prevMatch.winner.toString());
            availableWinners.push({
              winner: toObjectId(prevMatch.winner)!,
              seed: winnerSeed ? winnerSeed.seedNumber : 9999,
              matchPosition: prevMatch.bracketPosition,
            });
          }
        }
        
        // If odd number of winners, highest seed gets bye (ITTF rule)
        if (availableWinners.length > 0 && availableWinners.length % 2 === 1) {
          // Sort by seed (lowest seed number = highest seed)
          availableWinners.sort((a, b) => a.seed - b.seed);
          const byePlayer = availableWinners[0]; // Highest seed gets bye
          
          // Find which match in current round should receive this bye player
          // The bye should go to the match position that would normally receive the highest seed
          // In standard brackets, this is typically the first match
          let byeMatchIndex = 0;
          for (let i = 0; i < round.matches.length; i++) {
            const match = round.matches[i];
            // Check if this match references the bye player's previous match position
            if (match.participant1.type === "from_match" && 
                match.participant1.fromMatchPosition === byePlayer.matchPosition) {
              byeMatchIndex = i;
              break;
            }
            if (match.participant2.type === "from_match" && 
                match.participant2.fromMatchPosition === byePlayer.matchPosition) {
              byeMatchIndex = i;
              break;
            }
          }
          
          const byeMatch = round.matches[byeMatchIndex];
          if (byeMatch && !byeMatch.completed) {
            // Assign bye: highest seed gets automatic advancement
            if (byeMatch.participant1.type === "from_match" && 
                byeMatch.participant1.fromMatchPosition === byePlayer.matchPosition) {
              byeMatch.participant1.participantId = byePlayer.winner;
              byeMatch.participant2 = { type: "bye" };
            } else if (byeMatch.participant2.type === "from_match" && 
                       byeMatch.participant2.fromMatchPosition === byePlayer.matchPosition) {
              byeMatch.participant2.participantId = byePlayer.winner;
              byeMatch.participant1 = { type: "bye" };
              // Swap to maintain consistency (bye should be participant2)
              const temp = byeMatch.participant1;
              byeMatch.participant1 = byeMatch.participant2;
              byeMatch.participant2 = temp;
            } else {
              // Assign to first available slot
              byeMatch.participant1 = {
                type: "direct",
                participantId: byePlayer.winner,
              };
              byeMatch.participant2 = { type: "bye" };
            }
            
            byeMatch.winner = byePlayer.winner;
            byeMatch.completed = true;
            
            // Advance to next round
            if (roundIdx < bracket.rounds.length - 1) {
              const nextRound = bracket.rounds[roundIdx + 1];
              const nextMatch = nextRound.matches.find(
                (m: any) => m.bracketPosition === byeMatch.nextMatchPosition
              );
              if (nextMatch) {
                const matchIndex = round.matches.indexOf(byeMatch);
                if (matchIndex % 2 === 0) {
                  nextMatch.participant1 = {
                    type: "from_match",
                    fromMatchPosition: byeMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: byePlayer.winner,
                  };
                } else {
                  nextMatch.participant2 = {
                    type: "from_match",
                    fromMatchPosition: byeMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: byePlayer.winner,
                  };
                }
              }
            } else {
              // This is the final, so this participant is the champion
              champion = byePlayer.winner;
            }
            
            console.log(`  ⚡ Bye awarded to highest seed (Seed ${byePlayer.seed}) - advances directly`);
            // Remove from available winners list
            availableWinners.shift();
          }
        }
      }
      
      for (const bracketMatch of round.matches) {
        // Skip if already completed (e.g., bye)
        if (bracketMatch.completed && bracketMatch.participant2.type === "bye") {
          continue;
        }
        // Skip byes
        if (bracketMatch.participant2.type === "bye") {
          // Advance participant1 to next round
          if (roundIdx < bracket.rounds.length - 1) {
            const nextRound = bracket.rounds[roundIdx + 1];
            const nextMatch = nextRound.matches.find(
              (m: any) => m.bracketPosition === bracketMatch.nextMatchPosition
            );
            if (nextMatch) {
              // Determine which slot to fill
              const matchIndex = round.matches.indexOf(bracketMatch);
              if (matchIndex % 2 === 0) {
                nextMatch.participant1 = {
                  type: "from_match",
                  fromMatchPosition: bracketMatch.bracketPosition,
                  isWinnerOf: true,
                  participantId: bracketMatch.participant1.participantId,
                };
              } else {
                nextMatch.participant2 = {
                  type: "from_match",
                  fromMatchPosition: bracketMatch.bracketPosition,
                  isWinnerOf: true,
                  participantId: bracketMatch.participant1.participantId,
                };
              }
            }
          }
          bracketMatch.completed = true;
          continue;
        }
        
        const p1IdRaw = bracketMatch.participant1.participantId
          ? toObjectId(bracketMatch.participant1.participantId)
          : null;
        const p2IdRaw = bracketMatch.participant2.participantId
          ? toObjectId(bracketMatch.participant2.participantId)
          : null;
        const p1Id = p1IdRaw;
        const p2Id = p2IdRaw;
        
        if (!p1Id || !p2Id) {
          // Try to resolve from previous round
          if (bracketMatch.participant1.type === "from_match") {
            const prevMatch = bracket.rounds[roundIdx - 1].matches.find(
              (m: any) => m.bracketPosition === bracketMatch.participant1.fromMatchPosition
            );
            if (prevMatch && prevMatch.winner) {
              bracketMatch.participant1.participantId = prevMatch.winner;
            }
          }
          if (bracketMatch.participant2.type === "from_match") {
            const prevMatch = bracket.rounds[roundIdx - 1].matches.find(
              (m: any) => m.bracketPosition === bracketMatch.participant2.fromMatchPosition
            );
            if (prevMatch && prevMatch.winner) {
              bracketMatch.participant2.participantId = prevMatch.winner;
            }
          }
          
          const finalP1IdRaw = bracketMatch.participant1.participantId
            ? toObjectId(bracketMatch.participant1.participantId)
            : null;
          const finalP2IdRaw = bracketMatch.participant2.participantId
            ? toObjectId(bracketMatch.participant2.participantId)
            : null;
          const finalP1Id = finalP1IdRaw;
          const finalP2Id = finalP2IdRaw;
          
          // Handle case where only one participant is resolved (odd number of winners from previous round)
          if (finalP1Id && !finalP2Id) {
            // Only participant1 resolved - treat as bye, advance to next round
            bracketMatch.winner = finalP1Id;
            bracketMatch.completed = true;
            
            // Advance to next round if not final
            if (roundIdx < bracket.rounds.length - 1) {
              const nextRound = bracket.rounds[roundIdx + 1];
              const nextMatch = nextRound.matches.find(
                (m: any) => m.bracketPosition === bracketMatch.nextMatchPosition
              );
              if (nextMatch) {
                // Determine which slot to fill based on match position in current round
                const matchIndex = round.matches.indexOf(bracketMatch);
                if (matchIndex % 2 === 0) {
                  nextMatch.participant1 = {
                    type: "from_match",
                    fromMatchPosition: bracketMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: finalP1Id,
                  };
                } else {
                  nextMatch.participant2 = {
                    type: "from_match",
                    fromMatchPosition: bracketMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: finalP1Id,
                  };
                }
              }
            } else {
              // This is the final, so this participant is the champion
              champion = finalP1Id;
            }
            continue;
          } else if (!finalP1Id && finalP2Id) {
            // Only participant2 resolved - treat as bye, advance to next round
            bracketMatch.winner = finalP2Id;
            bracketMatch.completed = true;
            
            // Advance to next round if not final
            if (roundIdx < bracket.rounds.length - 1) {
              const nextRound = bracket.rounds[roundIdx + 1];
              const nextMatch = nextRound.matches.find(
                (m: any) => m.bracketPosition === bracketMatch.nextMatchPosition
              );
              if (nextMatch) {
                // Determine which slot to fill based on match position in current round
                const matchIndex = round.matches.indexOf(bracketMatch);
                if (matchIndex % 2 === 0) {
                  nextMatch.participant1 = {
                    type: "from_match",
                    fromMatchPosition: bracketMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: finalP2Id,
                  };
                } else {
                  nextMatch.participant2 = {
                    type: "from_match",
                    fromMatchPosition: bracketMatch.bracketPosition,
                    isWinnerOf: true,
                    participantId: finalP2Id,
                  };
                }
              }
            } else {
              // This is the final, so this participant is the champion
              champion = finalP2Id;
            }
            continue;
          } else if (!finalP1Id && !finalP2Id) {
            // Neither participant resolved - skip this match (shouldn't happen in normal flow)
            continue;
          }
          
          // Both participants resolved - create match
          if (!finalP1Id || !finalP2Id) {
            // This should never happen due to checks above, but TypeScript needs this
            continue;
          }
          const organizerId = toObjectId(organizer._id);
          if (!organizerId) {
            throw new Error("Organizer ID is required but not found");
          }
          const numberOfSets = roundIdx === bracket.rounds.length - 1 ? 5 : 3; // Final is best of 5
          const match = await createCompletedMatch(
            finalP1Id,
            finalP2Id,
            new mongoose.Types.ObjectId(),
            organizerId,
            "Tournament City",
            "Tournament Venue",
            numberOfSets,
            "singles"
          );
          
          bracketMatch.matchId = match._id;
          bracketMatch.winner = match.winnerSide === "side1" ? finalP1Id : finalP2Id;
          bracketMatch.loser = match.winnerSide === "side1" ? finalP2Id : finalP1Id;
          bracketMatch.completed = true;
          roundMatches.push(match._id);
          allMatches.push(match._id);
          
          if (roundIdx === bracket.rounds.length - 1) {
            champion = bracketMatch.winner;
          }
        } else {
          // Create match
          const organizerId = toObjectId(organizer._id);
          if (!organizerId) {
            throw new Error("Organizer ID is required but not found");
          }
          const numberOfSets = roundIdx === bracket.rounds.length - 1 ? 5 : 3;
          const match = await createCompletedMatch(
            p1Id,
            p2Id,
            new mongoose.Types.ObjectId(),
            organizerId,
            "Tournament City",
            "Tournament Venue",
            numberOfSets,
            "singles"
          );
          
          bracketMatch.matchId = match._id;
          bracketMatch.winner = match.winnerSide === "side1" ? p1Id : p2Id;
          bracketMatch.loser = match.winnerSide === "side1" ? p2Id : p1Id;
          bracketMatch.completed = true;
          roundMatches.push(match._id);
          allMatches.push(match._id);
          
          if (roundIdx === bracket.rounds.length - 1 && !champion) {
            champion = bracketMatch.winner;
          }
        }
      }
      
      round.matches = bracket.rounds[roundIdx].matches;
      round.completed = true;
    }
    
    // Ensure champion is set from final match if not already set
    if (!champion) {
      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      if (finalRound && finalRound.matches.length > 0) {
        const finalMatch = finalRound.matches[0];
        if (finalMatch && finalMatch.winner) {
          champion = finalMatch.winner;
        }
      }
    }

    // Create tournament
    const tournament = new Tournament({
      name: "Smash Cup",
      format: "knockout",
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
      bracket,
      rules: {
        pointsForWin: 2,
        pointsForLoss: 0,
        setsPerMatch: 3,
        pointsPerSet: 11,
        advanceTop: 0,
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
      { _id: { $in: allMatches } },
      { $set: { tournament: tournament._id } }
    );

    // Populate tournament
    await tournament.populate([
      { path: "organizer", select: "username fullName" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName" },
    ]);

    console.log("\n✅ Completed knockout tournament created successfully!");
    console.log("\nTournament Details:");
    console.log(`  Tournament ID: ${tournament._id}`);
    console.log(`  Name: ${tournament.name}`);
    console.log(`  Format: ${tournament.format}`);
    console.log(`  Status: ${tournament.status}`);
    console.log(`  Participants: ${tournament.participants.length}`);
    console.log(`  Bracket Size: ${bracketSize}`);
    console.log(`  Total Matches: ${allMatches.length}`);
    console.log(`  Organizer: ${(tournament.organizer as any)?.username || "N/A"}`);
    let championUser = null;
    if (champion) {
      const champId = champion instanceof mongoose.Types.ObjectId ? champion : toObjectId(champion);
      if (champId) {
        championUser = participants.find((p) => {
          const pId = p._id instanceof mongoose.Types.ObjectId ? p._id : toObjectId(p._id);
          return pId && pId.toString() === champId.toString();
        });
      }
    }
    console.log(`  Champion: ${championUser?.username || "N/A"}`);
    console.log(`\nTournament can be viewed at: /tournaments/${tournament._id}`);

    process.exit(0);
  } catch (error: any) {
    console.error("Error creating completed knockout tournament:", error);
    process.exit(1);
  }
}

// Run the script
createCompletedKnockoutTournament();

