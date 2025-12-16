/**
 * Script to play knockout tournaments
 *
 * This script:
 * 1. Fetches players from the database
 * 2. Creates a knockout tournament
 * 3. Generates knockout bracket and matches
 * 4. Plays matches round by round, advancing winners
 * 5. Shows the tournament winner
 *
 * Usage: npm run play:knockout
 */

// Environment variables should be loaded by the .js wrapper script
// If running directly, this script assumes env vars are already loaded
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import Tournament from "../models/Tournament";
import IndividualMatch from "../models/IndividualMatch";
import { User } from "../models/User";
import { generateKnockoutMatches } from "../services/tournament/core/matchGenerationService";
import { advanceWinner } from "../services/tournament/core/bracketProgressionService";
import type { KnockoutBracket, BracketMatch } from "../types/tournamentDraw";

// Configuration
const MIN_PLAYERS = 2;
const NUM_PLAYERS = 8; // Default to 8 players (power of 2, no byes needed)

interface MatchScore {
  side1Sets: number;
  side2Sets: number;
  games: Array<{
    gameNumber: number;
    side1Score: number;
    side2Score: number;
    winnerSide: "side1" | "side2" | null;
    completed: boolean;
  }>;
}

/**
 * Generate a random match score (best of 3 or 5 sets)
 */
function generateMatchScore(setsPerMatch: number = 3): MatchScore {
  const setsNeeded = Math.ceil(setsPerMatch / 2);
  let side1Sets = 0;
  let side2Sets = 0;
  const games: MatchScore["games"] = [];

  // Play sets until one side wins
  while (side1Sets < setsNeeded && side2Sets < setsNeeded) {
    // Random winner for this set
    const setWinner = Math.random() > 0.5 ? "side1" : "side2";

    // Generate game scores for this set (first to 11, win by 2)
    let side1Score = 0;
    let side2Score = 0;

    while (
      (side1Score < 11 && side2Score < 11) ||
      Math.abs(side1Score - side2Score) < 2
    ) {
      if (Math.random() > 0.5) {
        side1Score++;
      } else {
        side2Score++;
      }

      // Prevent infinite loops
      if (side1Score > 20 || side2Score > 20) {
        if (setWinner === "side1") {
          side1Score = 11;
          side2Score = 9;
        } else {
          side2Score = 11;
          side1Score = 9;
        }
        break;
      }
    }

    games.push({
      gameNumber: games.length + 1,
      side1Score: setWinner === "side1" ? side1Score : side2Score,
      side2Score: setWinner === "side2" ? side1Score : side2Score,
      winnerSide: setWinner,
      completed: true,
    });

    if (setWinner === "side1") {
      side1Sets++;
    } else {
      side2Sets++;
    }
  }

  return {
    side1Sets,
    side2Sets,
    games,
  };
}

/**
 * Play a match by updating its score
 */
async function playMatch(matchId: string, scorerId: string): Promise<"side1" | "side2"> {
  const match = await IndividualMatch.findById(matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  if (match.status === "completed") {
    // Match already completed, return existing winner
    return match.winnerSide || "side1";
  }

  // Set match to in_progress
  match.status = "in_progress";
  match.scorer = new mongoose.Types.ObjectId(scorerId);

  // Generate random score
  const score = generateMatchScore(match.numberOfSets || 3);

  // Update match with score
  match.games = score.games as any;
  match.finalScore = {
    side1Sets: score.side1Sets,
    side2Sets: score.side2Sets,
  };

  // Determine winner
  const setsNeeded = Math.ceil((match.numberOfSets || 3) / 2);
  const winnerSide = score.side1Sets >= setsNeeded ? "side1" : "side2";
  match.winnerSide = winnerSide;

  match.status = "completed";
  match.matchDuration = Date.now() - (match.createdAt?.getTime() || Date.now());

  await match.save();

  return winnerSide;
}

/**
 * Create a knockout tournament
 */
async function createTournament(
  name: string,
  organizerId: string,
  participantIds: string[]
): Promise<string> {
  const tournament = new Tournament({
    name,
    format: "knockout",
    category: "individual",
    matchType: "singles",
    startDate: new Date(),
    status: "draft",
    participants: participantIds,
    organizer: organizerId,
    knockoutConfig: {
      allowCustomMatching: false,
      autoGenerateBracket: true,
      thirdPlaceMatch: false,
      consolationBracket: false,
    },
    seedingMethod: "random",
    rules: {
      pointsForWin: 2,
      pointsForLoss: 0,
      pointsForDraw: 1,
      setsPerMatch: 3,
      pointsPerSet: 11,
      advanceTop: 1,
      deuceSetting: "standard",
      tiebreakRules: [],
    },
    venue: "Script Venue",
    city: "Script City",
    drawGenerated: false,
  });

  await tournament.save();

  return tournament._id.toString();
}

/**
 * Play all matches in a round
 */
async function playRound(
  tournament: any,
  roundNumber: number,
  organizerId: string
): Promise<void> {
  const bracket: KnockoutBracket = tournament.bracket;
  if (!bracket) {
    throw new Error("Tournament bracket not found");
  }

  const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) {
    throw new Error(`Round ${roundNumber} not found`);
  }

  console.log(`\n🏓 Playing Round ${roundNumber} (${round.roundName || `Round ${roundNumber}`})`);
  console.log(`   ${round.matches.length} match(es)`);

  for (const bracketMatch of round.matches) {
    // Skip if match is already completed or is a bye
    if (bracketMatch.completed || !bracketMatch.participant1 || !bracketMatch.participant2) {
      if (bracketMatch.completed) {
        console.log(`   ⏭️  Match ${bracketMatch.bracketPosition.matchNumber} already completed`);
      }
      continue;
    }

    const matchId = bracketMatch.matchId?.toString();
    if (!matchId) {
      console.log(`   ⚠️  Match ${bracketMatch.bracketPosition.matchNumber} has no match document (bye?)`);
      continue;
    }

    // Get participant names for display
    const participant1 = tournament.participants.find(
      (p: any) => p._id.toString() === bracketMatch.participant1?.toString()
    ) as any;
    const participant2 = tournament.participants.find(
      (p: any) => p._id.toString() === bracketMatch.participant2?.toString()
    ) as any;

    const player1Name = participant1?.username || participant1?.fullName || "Unknown";
    const player2Name = participant2?.username || participant2?.fullName || "Unknown";

    console.log(`   🎾 ${player1Name} vs ${player2Name}`);

    // Play the match
    const winnerSide = await playMatch(matchId, organizerId);

    // Determine winner ID
    const winnerId =
      winnerSide === "side1"
        ? bracketMatch.participant1?.toString()
        : bracketMatch.participant2?.toString();

    if (!winnerId) {
      throw new Error("Could not determine winner ID");
    }

    const winner = winnerSide === "side1" ? participant1 : participant2;
    const winnerName = winner?.username || winner?.fullName || "Unknown";

    console.log(`      ✅ Winner: ${winnerName}`);

    // Advance winner in bracket
    advanceWinner(
      bracket,
      roundNumber,
      bracketMatch.bracketPosition.matchNumber,
      winnerId
    );

    // Mark bracket as modified and save
    tournament.markModified("bracket");
    await tournament.save();
  }
}

/**
 * Display tournament bracket
 */
async function displayBracket(tournamentId: string): Promise<void> {
  const tournament = await Tournament.findById(tournamentId)
    .populate("participants", "username fullName")
    .populate("organizer", "username fullName");

  if (!tournament || !tournament.bracket) {
    throw new Error("Tournament or bracket not found");
  }

  const bracket: KnockoutBracket = tournament.bracket;

  console.log("\n" + "=".repeat(60));
  console.log(`🏆 Tournament: ${tournament.name}`);
  console.log("=".repeat(60));

  for (const round of bracket.rounds) {
    console.log(`\n📋 ${round.roundName || `Round ${round.roundNumber}`}`);
    console.log("-".repeat(60));

    for (const match of round.matches) {
      const p1 = tournament.participants.find(
        (p: any) => p._id.toString() === match.participant1?.toString()
      ) as any;
      const p2 = tournament.participants.find(
        (p: any) => p._id.toString() === match.participant2?.toString()
      ) as any;

      const p1Name = p1
        ? p1.username || p1.fullName || "Unknown"
        : match.participant1
        ? "Bye"
        : "TBD";
      const p2Name = p2
        ? p2.username || p2.fullName || "Unknown"
        : match.participant2
        ? "Bye"
        : "TBD";

      const winner = match.completed
        ? tournament.participants.find(
            (p: any) => p._id.toString() === match.winner?.toString()
          )
        : null;
      const winnerName = winner
        ? (winner as any).username || (winner as any).fullName || "Unknown"
        : "";

      if (match.completed) {
        console.log(`   ✅ ${p1Name} vs ${p2Name} → Winner: ${winnerName}`);
      } else if (match.participant1 && match.participant2) {
        console.log(`   ⏳ ${p1Name} vs ${p2Name}`);
      } else {
        console.log(`   ⏸️  ${p1Name} vs ${p2Name} (pending)`);
      }
    }
  }

  if (bracket.completed) {
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    const finalMatch = finalRound?.matches[0];
    if (finalMatch?.winner) {
      const champion = tournament.participants.find(
        (p: any) => p._id.toString() === finalMatch.winner?.toString()
      ) as any;
      const championName = champion?.username || champion?.fullName || "Unknown";

      console.log("\n" + "=".repeat(60));
      console.log(`👑 CHAMPION: ${championName}`);
      console.log("=".repeat(60));
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to database
    await connectDB();

    // Fetch users from database
    const users = await User.find()
      .select("_id username fullName")
      .limit(NUM_PLAYERS);

    if (users.length < MIN_PLAYERS) {
      throw new Error(
        `Need at least ${MIN_PLAYERS} players in database. Found ${users.length}`
      );
    }

    // Use first user as organizer
    const organizer = users[0];
    const organizerId = organizer._id.toString();

    // Select participants (use exact number requested, or available users)
    const participantIds = users.slice(0, NUM_PLAYERS).map((u) => u._id.toString());

    console.log(`\n🎯 Creating knockout tournament with ${participantIds.length} players:`);
    participantIds.forEach((id, index) => {
      const user = users.find((u) => u._id.toString() === id);
      console.log(`   ${index + 1}. ${user?.username || user?.fullName || "Unknown"}`);
    });

    // Create tournament
    const tournamentId = await createTournament(
      `Script Knockout Tournament - ${new Date().toLocaleDateString()}`,
      organizerId,
      participantIds
    );

    console.log(`\n✅ Tournament created: ${tournamentId}`);

    // Load tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found after creation");
    }

    // Generate knockout bracket and matches
    console.log("\n🔨 Generating bracket and matches...");
    await generateKnockoutMatches(
      tournament as any,
      participantIds,
      [], // No seeding
      organizerId,
      {
        courtsAvailable: 1,
        matchDuration: 60,
      }
    );

    // Save tournament after bracket generation
    await tournament.save();

    // Reload tournament to get updated bracket
    const updatedTournament = await Tournament.findById(tournamentId).populate(
      "participants",
      "username fullName"
    );
    if (!updatedTournament) {
      throw new Error("Tournament not found after bracket generation");
    }

    // Check if bracket was generated
    const bracket: KnockoutBracket = updatedTournament.bracket as any;
    if (!bracket) {
      throw new Error("Bracket not generated - check generateKnockoutMatches function");
    }

    console.log(`✅ Bracket generated with ${bracket.rounds.length} round(s)`);

    // Display initial bracket
    await displayBracket(tournamentId);

    // Update tournament status to in_progress
    updatedTournament.status = "in_progress";
    await updatedTournament.save();

    // Play each round
    for (let roundNum = 1; roundNum <= bracket.rounds.length; roundNum++) {
      const currentTournament = await Tournament.findById(tournamentId).populate(
        "participants",
        "username fullName"
      );
      if (!currentTournament) {
        throw new Error("Tournament not found");
      }

      await playRound(currentTournament, roundNum, organizerId);

      // Check if tournament is completed
      const updatedBracket: KnockoutBracket = currentTournament.bracket;
      if (updatedBracket.completed) {
        currentTournament.status = "completed";
        currentTournament.endDate = new Date();
        await currentTournament.save();
        break;
      }
    }

    // Display final bracket and winner
    await displayBracket(tournamentId);

    console.log("\n✅ Tournament completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main };

