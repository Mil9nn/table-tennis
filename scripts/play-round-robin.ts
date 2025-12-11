/**
 * Script to play round-robin tournaments and update standings
 *
 * This script:
 * 1. Fetches players from the database
 * 2. Creates two tournaments (one with groups, one without)
 * 3. Generates round-robin matches
 * 4. Plays matches by updating scores
 * 5. Updates standings automatically
 *
 * Usage: npm run play:round-robin
 */

// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env file from project root (try .env.local first, then .env)
// process.cwd() returns the project root when running from npm scripts
const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import Tournament from "../models/Tournament";
import IndividualMatch from "../models/IndividualMatch";
import { User } from "../models/User";
import { updateRoundRobinStandings } from "../services/tournament/tournamentUpdateService";

// Configuration
const MIN_PLAYERS = 4;
const PLAYERS_WITH_GROUPS = 8; // Use 8 players for grouped tournament
const PLAYERS_WITHOUT_GROUPS = 6; // Use 6 players for non-grouped tournament
const NUMBER_OF_GROUPS = 2;

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
async function playMatch(matchId: string, scorerId: string): Promise<void> {
  const match = await IndividualMatch.findById(matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  if (match.status === "completed") {
    return;
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
  if (score.side1Sets >= setsNeeded) {
    match.winnerSide = "side1";
  } else {
    match.winnerSide = "side2";
  }

  match.status = "completed";
  match.matchDuration = Date.now() - (match.createdAt?.getTime() || Date.now());

  await match.save();
}

/**
 * Create a tournament
 */
async function createTournament(
  name: string,
  organizerId: string,
  participantIds: string[],
  useGroups: boolean = false
): Promise<string> {
  const tournament = new Tournament({
    name,
    format: "round_robin",
    category: "individual",
    matchType: "singles",
    startDate: new Date(),
    status: "draft",
    participants: participantIds,
    organizer: organizerId,
    useGroups,
    numberOfGroups: useGroups ? NUMBER_OF_GROUPS : undefined,
    advancePerGroup: useGroups ? 2 : undefined,
    seedingMethod: "random",
    rules: {
      pointsForWin: 2,
      pointsForLoss: 0,
      pointsForDraw: 1,
      setsPerMatch: 3,
      pointsPerSet: 11,
      advanceTop: useGroups ? 2 : participantIds.length,
      deuceSetting: "standard",
      tiebreakRules: [],
    },
    city: "Script City",
    drawGenerated: false,
  });

  await tournament.save();

  return tournament._id.toString();
}

/**
 * Generate matches for a tournament
 */
async function generateMatches(
  tournamentId: string,
  organizerId: string
): Promise<void> {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  // Import the generate matches logic
  const { generateRoundRobinSchedule, allocateGroups } = await import(
    "../services/tournamentService"
  );

  const participantIds = tournament.participants.map((p: any) => p.toString());

  if (tournament.useGroups && tournament.numberOfGroups) {
    // Allocate players to groups using snake seeding
    const groupAllocations = allocateGroups(
      participantIds,
      tournament.numberOfGroups,
      undefined // no seeding
    );

    const groups: any[] = [];

    for (const groupAlloc of groupAllocations) {
      // Generate schedule for this group
      const schedule = generateRoundRobinSchedule(
        groupAlloc.participants,
        1, // courtsAvailable
        tournament.startDate,
        60 // matchDuration
      );

      const groupRounds: any[] = [];
      for (const round of schedule) {
        const roundMatches: string[] = [];

        for (const pairing of round.matches) {
          const match = new IndividualMatch({
            participants: [pairing.player1, pairing.player2],
            matchType: tournament.matchType,
            category: tournament.category,
            numberOfSets: tournament.rules.setsPerMatch,
            pointsPerSet: tournament.rules.pointsPerSet,
            status: "scheduled",
            tournament: tournament._id,
            scorer: organizerId,
            finalScore: {
              side1Sets: 0,
              side2Sets: 0,
            },
            games: [],
          });

          await match.save();
          roundMatches.push((match._id as mongoose.Types.ObjectId).toString());
        }

        groupRounds.push({
          roundNumber: round.roundNumber,
          matches: roundMatches,
          completed: false,
        });
      }

      // Initialize group standings
      const groupStandings = groupAlloc.participants.map((pId: string) => ({
        participant: pId,
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
        headToHead: {},
      }));

      groups.push({
        groupId: groupAlloc.groupId,
        groupName: groupAlloc.groupName,
        participants: groupAlloc.participants,
        rounds: groupRounds,
        standings: groupStandings,
      });
    }

    tournament.groups = groups;
    tournament.rounds = [];
    tournament.standings = [];
    tournament.drawGenerated = true;
    await tournament.save();
  } else {
    // Single round-robin (no groups)
    const schedule = generateRoundRobinSchedule(
      participantIds,
      1, // courtsAvailable
      tournament.startDate,
      60 // matchDuration
    );

    const rounds: any[] = [];
    for (const round of schedule) {
      const roundMatches: string[] = [];

      for (const pairing of round.matches) {
        const match = new IndividualMatch({
          participants: [pairing.player1, pairing.player2],
          matchType: tournament.matchType,
          category: tournament.category,
          numberOfSets: tournament.rules.setsPerMatch,
          pointsPerSet: tournament.rules.pointsPerSet,
          status: "scheduled",
          tournament: tournament._id,
          scorer: organizerId,
          finalScore: {
            side1Sets: 0,
            side2Sets: 0,
          },
          games: [],
        });

        await match.save();
        roundMatches.push((match._id as mongoose.Types.ObjectId).toString());
      }

      rounds.push({
        roundNumber: round.roundNumber,
        matches: roundMatches,
        completed: false,
      });
    }

    // Initialize standings
    const standings = participantIds.map((pId: string) => ({
      participant: pId,
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
      headToHead: {},
    }));

    tournament.rounds = rounds;
    tournament.standings = standings;
    tournament.drawGenerated = true;
    await tournament.save();
  }
}

/**
 * Play all matches in a tournament
 */
async function playAllMatches(
  tournamentId: string,
  organizerId: string
): Promise<void> {
  const tournament = await Tournament.findById(tournamentId).populate(
    "participants"
  );
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  let allMatchIds: string[] = [];

  if (tournament.useGroups && tournament.groups) {
    for (const group of tournament.groups) {
      for (const round of group.rounds) {
        allMatchIds.push(...round.matches.map((m: any) => m.toString()));
      }
    }
  } else {
    for (const round of tournament.rounds) {
      allMatchIds.push(...round.matches.map((m: any) => m.toString()));
    }
  }

  for (const matchId of allMatchIds) {
    try {
      await playMatch(matchId, organizerId);

      // Reload tournament to get latest state
      const updatedTournament = await Tournament.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error(`Tournament ${tournamentId} not found after match`);
      }

      // Update standings after each match (this function saves the tournament)
      await updateRoundRobinStandings(updatedTournament);
    } catch (error: any) {
      console.error(`  ❌ Error playing match ${matchId}:`, error.message);
    }
  }
}

/**
 * Display tournament standings
 */
async function displayStandings(tournamentId: string): Promise<void> {
  const tournament = await Tournament.findById(tournamentId)
    .populate("participants", "username fullName")
    .populate("standings.participant", "username fullName");

  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  if (tournament.useGroups && tournament.groups) {
    for (const group of tournament.groups) {
      for (const standing of group.standings) {
        const participant = tournament.participants.find(
          (p: any) => p._id.toString() === standing.participant.toString()
        ) as any;
      }
    }
  } else {
    for (const standing of tournament.standings) {
      const participant = tournament.participants.find(
        (p: any) => p._id.toString() === standing.participant.toString()
      ) as any;
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
      .limit(Math.max(PLAYERS_WITH_GROUPS, PLAYERS_WITHOUT_GROUPS));

    if (users.length < MIN_PLAYERS) {
      throw new Error(
        `Need at least ${MIN_PLAYERS} players in database. Found ${users.length}`
      );
    }

    // Use first user as organizer
    const organizer = users[0];
    const organizerId = organizer._id.toString();

    // ============================================
    // TOURNAMENT 1: WITH GROUPS
    // ============================================

    const playersWithGroups = users
      .slice(0, PLAYERS_WITH_GROUPS)
      .map((u) => u._id.toString());
    const tournament1Id = await createTournament(
      "Script Tournament - With Groups",
      organizerId,
      playersWithGroups,
      true // useGroups
    );

    await generateMatches(tournament1Id, organizerId);
    await playAllMatches(tournament1Id, organizerId);

    // Final standings update to ensure everything is correct
    const finalTournament1 = await Tournament.findById(tournament1Id);
    if (finalTournament1) {
      await updateRoundRobinStandings(finalTournament1);
    }

    await displayStandings(tournament1Id);

    // ============================================
    // TOURNAMENT 2: WITHOUT GROUPS
    // ============================================

    const playersWithoutGroups = users
      .slice(0, PLAYERS_WITHOUT_GROUPS)
      .map((u) => u._id.toString());
    const tournament2Id = await createTournament(
      "Script Tournament - Without Groups",
      organizerId,
      playersWithoutGroups,
      false // useGroups
    );

    await generateMatches(tournament2Id, organizerId);
    await playAllMatches(tournament2Id, organizerId);

    // Final standings update to ensure everything is correct
    const finalTournament2 = await Tournament.findById(tournament2Id);
    if (finalTournament2) {
      await updateRoundRobinStandings(finalTournament2);
    }

    await displayStandings(tournament2Id);
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
