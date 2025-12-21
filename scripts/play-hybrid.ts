/**
 * Script to play hybrid tournaments (round-robin -> knockout)
 *
 * This script:
 * 1. Fetches all players from the database
 * 2. Creates a hybrid tournament
 * 3. Generates and plays round-robin phase matches
 * 4. Determines qualified participants
 * 5. Transitions to knockout phase
 * 6. Generates and plays knockout phase matches
 * 7. Shows the tournament winner
 *
 * Usage: npm run play:hybrid
 */

// Load environment variables first - BEFORE any other imports that might use them
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env file from project root (try .env.local first, then .env)
const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

// Now import modules that depend on environment variables
// These are imported after dotenv.config() to ensure env vars are loaded
import mongoose from "mongoose";
import type { KnockoutBracket } from "../types/tournamentDraw";

// Configuration
const MIN_PLAYERS = 8;
const USE_GROUPS = true;
const NUMBER_OF_GROUPS = 4;
const QUALIFYING_COUNT = 8; // 2 from each group advance to knockout (4 groups × 2 = 8 total)

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
async function playMatch(
  matchId: string,
  scorerId: string,
  IndividualMatch: any
): Promise<"side1" | "side2"> {
  const match = await IndividualMatch.findById(matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  if (match.status === "completed") {
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
 * Create a hybrid tournament
 */
async function createTournament(
  name: string,
  organizerId: string,
  participantIds: string[],
  Tournament: any
): Promise<string> {
  const tournament = new Tournament({
    name,
    format: "hybrid",
    category: "individual",
    matchType: "singles",
    startDate: new Date(),
    status: "draft",
    participants: participantIds,
    organizer: organizerId,
    seedingMethod: "random",
    hybridConfig: {
      roundRobinUseGroups: USE_GROUPS,
      roundRobinNumberOfGroups: USE_GROUPS ? NUMBER_OF_GROUPS : undefined,
      qualificationMethod: "top_n_per_group",
      qualifyingPerGroup: 2, // 2 players from each group
      knockoutAllowCustomMatching: false,
      knockoutThirdPlaceMatch: true,
    },
    rules: {
      pointsForWin: 2,
      pointsForLoss: 0,
      pointsForDraw: 1,
      setsPerMatch: 3,
      pointsPerSet: 11,
      advanceTop: 2, // Top 2 from each group
      deuceSetting: "standard",
      tiebreakRules: [
        "points",
        "head_to_head",
        "sets_ratio",
        "points_ratio",
        "sets_won",
      ],
    },
    venue: "Script Venue",
    city: "Script City",
    drawGenerated: false,
  });

  await tournament.save();

  return tournament._id.toString();
}

/**
 * Play all matches in round-robin phase
 */
async function playRoundRobinMatches(
  tournamentId: string,
  organizerId: string,
  Tournament: any,
  IndividualMatch: any,
  updateRoundRobinStandings: any
): Promise<void> {
  const tournament = await Tournament.findById(tournamentId).populate(
    "participants"
  );
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  let allMatchIds: string[] = [];

  if (tournament.useGroups && tournament.groups) {
    console.log("\n🏓 Playing Round-Robin Phase (Groups)");
    for (const group of tournament.groups) {
      console.log(`\n📋 ${group.groupName}`);
      for (const round of group.rounds) {
        allMatchIds.push(...round.matches.map((m: any) => m.toString()));
      }
    }
  } else {
    console.log("\n🏓 Playing Round-Robin Phase");
    for (const round of tournament.rounds) {
      allMatchIds.push(...round.matches.map((m: any) => m.toString()));
    }
  }

  console.log(`   Total matches: ${allMatchIds.length}`);

  for (const matchId of allMatchIds) {
    try {
      await playMatch(matchId, organizerId, IndividualMatch);

      // Reload tournament to get latest state
      const updatedTournament = await Tournament.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error(`Tournament ${tournamentId} not found after match`);
      }

      // Update standings after each match
      await updateRoundRobinStandings(updatedTournament);
    } catch (error: any) {
      console.error(`  ❌ Error playing match ${matchId}:`, error.message);
    }
  }

  console.log("   ✅ Round-robin phase completed");
}

/**
 * Display round-robin standings
 */
async function displayRoundRobinStandings(tournamentId: string, Tournament: any, users: any[]): Promise<void> {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Round-Robin Phase Standings");
  console.log("=".repeat(60));

  if (tournament.useGroups && tournament.groups) {
    for (const group of tournament.groups) {
      console.log(`\n${group.groupName}:`);
      console.log("-".repeat(60));

      const sortedStandings = [...group.standings].sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;
        return b.pointsDiff - a.pointsDiff;
      });

      sortedStandings.forEach((standing, index) => {
        const user = users.find(
          (u: any) => u._id.toString() === standing.participant.toString()
        );

        const name = user?.username || user?.fullName || "Unknown";
        console.log(
          `   ${index + 1}. ${name.padEnd(20)} | ` +
            `P: ${standing.played} | W: ${standing.won} | L: ${standing.lost} | ` +
            `Sets: ${standing.setsWon}-${standing.setsLost} | Pts: ${standing.points}`
        );
      });
    }
  } else {
    const sortedStandings = [...tournament.standings].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;
      return b.pointsDiff - a.pointsDiff;
    });

    sortedStandings.forEach((standing, index) => {
      const user = users.find(
        (u: any) => u._id.toString() === standing.participant.toString()
      );

      const name = user?.username || user?.fullName || "Unknown";
      console.log(
        `   ${index + 1}. ${name.padEnd(20)} | ` +
          `P: ${standing.played} | W: ${standing.won} | L: ${standing.lost} | ` +
          `Sets: ${standing.setsWon}-${standing.setsLost} | Pts: ${standing.points}`
      );
    });
  }

  console.log("=".repeat(60));
}

/**
 * Play all matches in a knockout round
 */
async function playKnockoutRound(
  tournament: any,
  roundNumber: number,
  organizerId: string,
  IndividualMatch: any,
  users: any[]
): Promise<void> {
  const bracket: KnockoutBracket = tournament.bracket;
  if (!bracket) {
    throw new Error("Tournament bracket not found");
  }

  const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) {
    throw new Error(`Round ${roundNumber} not found`);
  }

  console.log(
    `\n🏓 Playing Round ${roundNumber} (${round.roundName || `Round ${roundNumber}`})`
  );
  console.log(`   ${round.matches.length} match(es)`);

  for (const bracketMatch of round.matches) {
    // Skip if match is already completed or is a bye
    if (
      bracketMatch.completed ||
      !bracketMatch.participant1 ||
      !bracketMatch.participant2
    ) {
      if (bracketMatch.completed) {
        console.log(
          `   ⏭️  Match ${bracketMatch.bracketPosition.matchNumber} already completed`
        );
      }
      continue;
    }

    const matchId = bracketMatch.matchId?.toString();
    if (!matchId) {
      console.log(
        `   ⚠️  Match ${bracketMatch.bracketPosition.matchNumber} has no match document (bye?)`
      );
      continue;
    }

    // Get participant names
    const participant1 = users.find(
      (u: any) => u._id.toString() === bracketMatch.participant1?.toString()
    );
    const participant2 = users.find(
      (u: any) => u._id.toString() === bracketMatch.participant2?.toString()
    );

    const player1Name =
      participant1?.username || participant1?.fullName || "Unknown";
    const player2Name =
      participant2?.username || participant2?.fullName || "Unknown";

    console.log(`   🎾 ${player1Name} vs ${player2Name}`);

    // Play the match
    const winnerSide = await playMatch(matchId, organizerId, IndividualMatch);

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
    const { advanceWinner } = await import(
      "../services/tournament/core/bracketProgressionService"
    );
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
async function displayBracket(tournamentId: string, Tournament: any, users: any[]): Promise<void> {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament || !tournament.bracket) {
    throw new Error("Tournament or bracket not found");
  }

  const bracket: KnockoutBracket = tournament.bracket;

  console.log("\n" + "=".repeat(60));
  console.log("🏆 Knockout Phase Bracket");
  console.log("=".repeat(60));

  for (const round of bracket.rounds) {
    console.log(`\n📋 ${round.roundName || `Round ${round.roundNumber}`}`);
    console.log("-".repeat(60));

    for (const match of round.matches) {
      const p1 = users.find(
        (u: any) => u._id.toString() === match.participant1?.toString()
      );
      const p2 = users.find(
        (u: any) => u._id.toString() === match.participant2?.toString()
      );

      const p1Name = p1
        ? p1.username || p1.fullName
        : match.participant1
        ? "Bye"
        : "TBD";
      const p2Name = p2
        ? p2.username || p2.fullName
        : match.participant2
        ? "Bye"
        : "TBD";

      const winner = match.completed
        ? users.find(
            (u: any) => u._id.toString() === match.winner?.toString()
          )
        : null;
      const winnerName = winner
        ? winner.username || winner.fullName
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
      const champion = users.find(
        (u: any) => u._id.toString() === finalMatch.winner?.toString()
      );
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
    // Dynamically import modules that depend on environment variables
    // This ensures dotenv has loaded the env vars before these modules are evaluated
    const { connectDB } = await import("../lib/mongodb");
    const Tournament = (await import("../models/Tournament")).default;
    const IndividualMatch = (await import("../models/IndividualMatch")).default;
    const { User } = await import("../models/User");
    const { updateRoundRobinStandings } = await import("../services/tournament/tournamentUpdateService");
    const {
      generateHybridRoundRobinPhase,
      transitionToKnockoutPhase,
    } = await import("../services/tournament/core/hybridMatchGenerationService");
    const {
      canTransitionToKnockout,
    } = await import("../services/tournament/core/phaseManagementService");

    // Connect to database
    console.log("🔌 Connecting to database...");
    await connectDB();

    // Fetch all users from database
    console.log("\n📥 Fetching all players from database...");
    const users = await User.find().select("_id username fullName");

    if (users.length < MIN_PLAYERS) {
      throw new Error(
        `Need at least ${MIN_PLAYERS} players in database. Found ${users.length}`
      );
    }

    console.log(`   Found ${users.length} player(s)`);

    // Use first user as organizer
    const organizer = users[0];
    const organizerId = organizer._id.toString();

    // Use all users as participants
    const participantIds = users.map((u) => u._id.toString());

    console.log(`\n🎯 Creating hybrid tournament with ${participantIds.length} players:`);
    participantIds.forEach((id, index) => {
      const user = users.find((u) => u._id.toString() === id);
      console.log(`   ${index + 1}. ${user?.username || user?.fullName || "Unknown"}`);
    });

    // ============================================
    // CREATE TOURNAMENT
    // ============================================
    console.log("\n🏆 Creating hybrid tournament...");
    const tournamentId = await createTournament(
      `Hybrid Tournament - ${new Date().toLocaleDateString()}`,
      organizerId,
      participantIds,
      Tournament
    );
    console.log(`   ✅ Tournament created: ${tournamentId}`);

    // ============================================
    // ROUND-ROBIN PHASE
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("PHASE 1: ROUND-ROBIN");
    console.log("=".repeat(60));

    // Reload tournament
    let tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Generate round-robin matches
    console.log("\n🔨 Generating round-robin phase matches...");
    const rrResult = await generateHybridRoundRobinPhase(tournament, {
      scorerId: new mongoose.Types.ObjectId(organizerId),
      courtsAvailable: 1,
      matchDuration: 60,
    });

    if (!rrResult.success) {
      throw new Error(
        `Failed to generate round-robin matches: ${rrResult.message}`
      );
    }

    console.log(`   ✅ Generated ${rrResult.matchesCreated} matches`);
    if (USE_GROUPS) {
      console.log(`   ✅ Created ${rrResult.groupsCreated} groups`);
    }

    // Play round-robin matches
    await playRoundRobinMatches(tournamentId, organizerId, Tournament, IndividualMatch, updateRoundRobinStandings);

    // Display standings
    await displayRoundRobinStandings(tournamentId, Tournament, users);

    // ============================================
    // TRANSITION TO KNOCKOUT PHASE
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("PHASE TRANSITION");
    console.log("=".repeat(60));

    // Reload tournament
    tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if can transition
    const transitionCheck = canTransitionToKnockout(tournament);
    if (!transitionCheck.canTransition) {
      throw new Error(
        `Cannot transition to knockout: ${transitionCheck.reason}`
      );
    }

    console.log("\n✅ Round-robin phase complete. Transitioning to knockout...");

    // Transition to knockout phase (this determines qualifiers and generates bracket)
    const koResult = await transitionToKnockoutPhase(tournament, {
      scorerId: new mongoose.Types.ObjectId(organizerId),
      courtsAvailable: 1,
      matchDuration: 60,
    });

    if (!koResult.success) {
      throw new Error(
        `Failed to transition to knockout: ${koResult.message}`
      );
    }

    console.log(`\n📋 Qualified participants (${tournament.qualifiedParticipants?.length || 0}):`);

    // Reload tournament to get updated qualified participants
    tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Display qualified participants
    for (let i = 0; i < (tournament.qualifiedParticipants?.length || 0); i++) {
      const participantId = tournament.qualifiedParticipants![i];
      const user = users.find((u) => u._id.toString() === participantId.toString());
      console.log(
        `   ${i + 1}. ${user?.username || user?.fullName || "Unknown"}`
      );
    }

    // ============================================
    // KNOCKOUT PHASE
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("PHASE 2: KNOCKOUT");
    console.log("=".repeat(60));
    console.log(`   ✅ Generated ${koResult.matchesCreated} matches`);

    // Reload tournament
    tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify bracket exists before displaying
    if (!tournament.bracket) {
      throw new Error(
        "Bracket not found after transition. The knockout phase may not have been properly initialized."
      );
    }

    // Display initial bracket
    await displayBracket(tournamentId, Tournament, users);

    // Update tournament status to in_progress
    tournament.status = "in_progress";
    await tournament.save();

    // Play each knockout round
    const bracket: KnockoutBracket = tournament.bracket as any;
    if (!bracket) {
      throw new Error("Bracket not generated");
    }

    for (let roundNum = 1; roundNum <= bracket.rounds.length; roundNum++) {
      const currentTournament = await Tournament.findById(tournamentId);
      if (!currentTournament) {
        throw new Error("Tournament not found");
      }

      await playKnockoutRound(currentTournament, roundNum, organizerId, IndividualMatch, users);

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
    await displayBracket(tournamentId, Tournament, users);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Hybrid tournament completed successfully!");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main };
