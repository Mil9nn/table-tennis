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
import PlayerStats from "../models/PlayerStats";
import { User } from "../models/User";
import { generateKnockoutMatches, createBracketMatch } from "../services/tournament/core/matchGenerationService";
import { advanceWinner } from "../services/tournament/core/bracketProgressionService";
import type { KnockoutBracket } from "../types/tournamentDraw";
import { shotCategories } from "../constants/constants";

// Shot type definitions
type Stroke =
  | "forehand_drive"
  | "backhand_drive"
  | "forehand_topspin"
  | "backhand_topspin"
  | "forehand_loop"
  | "backhand_loop"
  | "forehand_smash"
  | "backhand_smash"
  | "forehand_push"
  | "backhand_push"
  | "forehand_chop"
  | "backhand_chop"
  | "forehand_flick"
  | "backhand_flick"
  | "forehand_block"
  | "backhand_block"
  | "forehand_drop"
  | "backhand_drop"
  | "net_point"
  | "serve_point";

type ServeType = "side_spin" | "top_spin" | "back_spin" | "mix_spin" | "no_spin";

interface Shot {
  shotNumber: number;
  side: "side1" | "side2";
  player: string;
  stroke: Stroke | null;
  serveType?: ServeType | null;
  originX: number;
  originY: number;
  landingX: number;
  landingY: number;
}

// Configuration
const MIN_PLAYERS = 2;
const NUM_PLAYERS = 8; // Default to 8 players (power of 2, no byes needed)

// Seeded test users with full profiles
const SEEDED_USERS = [
  { username: "alice_johnson", fullName: "Alice Johnson", email: "alice@test.local", gender: "female", handedness: "right", playingStyle: "offensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice_johnson" },
  { username: "bob_smith", fullName: "Bob Smith", email: "bob@test.local", gender: "male", handedness: "right", playingStyle: "defensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob_smith" },
  { username: "carol_williams", fullName: "Carol Williams", email: "carol@test.local", gender: "female", handedness: "left", playingStyle: "all_round", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol_williams" },
  { username: "david_brown", fullName: "David Brown", email: "david@test.local", gender: "male", handedness: "right", playingStyle: "offensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=david_brown" },
  { username: "emma_davis", fullName: "Emma Davis", email: "emma@test.local", gender: "female", handedness: "right", playingStyle: "defensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma_davis" },
  { username: "frank_miller", fullName: "Frank Miller", email: "frank@test.local", gender: "male", handedness: "left", playingStyle: "all_round", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=frank_miller" },
  { username: "grace_lee", fullName: "Grace Lee", email: "grace@test.local", gender: "female", handedness: "right", playingStyle: "offensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=grace_lee" },
  { username: "henry_wilson", fullName: "Henry Wilson", email: "henry@test.local", gender: "male", handedness: "right", playingStyle: "defensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=henry_wilson" },
  { username: "iris_chen", fullName: "Iris Chen", email: "iris@test.local", gender: "female", handedness: "right", playingStyle: "all_round", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=iris_chen" },
  { username: "jack_taylor", fullName: "Jack Taylor", email: "jack@test.local", gender: "male", handedness: "right", playingStyle: "offensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=jack_taylor" },
  { username: "karen_martin", fullName: "Karen Martin", email: "karen@test.local", gender: "female", handedness: "left", playingStyle: "defensive", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=karen_martin" },
  { username: "leo_anderson", fullName: "Leo Anderson", email: "leo@test.local", gender: "male", handedness: "right", playingStyle: "all_round", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=leo_anderson" },
];

/**
 * Helpers for working with tournament participants which may be:
 * - strings (ids),
 * - ObjectId instances, or
 * - populated User documents ({ _id, username, fullName })
 */
function getParticipantId(p: any): string | undefined {
  if (!p) return undefined;
  if (typeof p === "string") return p;
  if (p instanceof mongoose.Types.ObjectId) return p.toString();
  if (p._id?.toString) return p._id.toString();
  return undefined;
}

function findParticipant(participants: any[] = [], id?: any) {
  if (!id) return undefined;
  const target = id?.toString();
  return participants.find((p: any) => getParticipantId(p) === target);
}

function participantName(p: any) {
  const obj = typeof p === "string" ? null : p;
  return obj?.username || obj?.fullName || "Unknown";
}

interface MatchScore {
  side1Sets: number;
  side2Sets: number;
  games: Array<{
    gameNumber: number;
    side1Score: number;
    side2Score: number;
    winnerSide: "side1" | "side2" | null;
    completed: boolean;
    shots: Shot[];
  }>;
}

/**
 * Generate a realistic shot with origin and landing coordinates
 */
function generateShot(
  shotNumber: number,
  winnerSide: "side1" | "side2",
  side1PlayerId: string,
  side2PlayerId: string
): Shot {
  const strokes: Stroke[] = Object.values(shotCategories)
    .flatMap((category) => category.shots)
    .map((shot) => shot.value as Stroke)
    .filter((value) => value !== "serve_point" && value !== "net_point");

  const serveTypes: ServeType[] = ["side_spin", "top_spin", "back_spin", "mix_spin", "no_spin"];

  const isServe = shotNumber === 1;
  const stroke = isServe ? "serve_point" : strokes[Math.floor(Math.random() * strokes.length)];
  const serveType = isServe ? serveTypes[Math.floor(Math.random() * serveTypes.length)] : null;

  let originX: number;
  let originY: number;
  let landingX: number;
  let landingY: number;

  // Determine shot direction (side1 or side2 hitting)
  const shotSide = shotNumber % 2 === 1 ? winnerSide : (winnerSide === "side1" ? "side2" : "side1");
  const playerHittingId = shotSide === "side1" ? side1PlayerId : side2PlayerId;

  // Distance zone (60% close, 30% mid, 10% far)
  const distanceRand = Math.random();
  const distanceZone = distanceRand < 0.6 ? "close" : distanceRand < 0.9 ? "mid" : "far";

  // Landing zone (25% short, 50% mid, 25% deep)
  const landingZoneRand = Math.random();
  const landingZone = landingZoneRand < 0.25 ? "short" : landingZoneRand < 0.75 ? "mid" : "deep";

  // Sector (30% backhand, 40% crossover, 30% forehand)
  const sectorRand = Math.random();
  const sector = sectorRand < 0.3 ? "backhand" : sectorRand < 0.7 ? "crossover" : "forehand";

  // Generate landing Y based on sector
  if (sector === "backhand") {
    landingY = Math.random() * 33.33;
  } else if (sector === "crossover") {
    landingY = 33.33 + Math.random() * 33.34;
  } else {
    landingY = 66.67 + Math.random() * 33.33;
  }

  // Generate origin and landing based on shot side and distance zone
  if (shotSide === "side1") {
    // Side1 player hitting (position on left)
    if (isServe) {
      originX = Math.random() * 60 - 10;
      originY = Math.random() * 30 - 25;
    } else {
      if (distanceZone === "close") {
        originX = Math.random() * 76 - 26;
        originY = Math.random() * 48 + 26;
      } else if (distanceZone === "mid") {
        originX = Math.random() * 76 - 26;
        originY = Math.random() * 130 - 15;
      } else {
        originX = Math.random() * 76 - 26;
        originY = Math.random() * 200 - 100;
      }
    }

    // Landing on side2 (right side, X: 50-100)
    if (landingZone === "short") {
      landingX = 50 + Math.random() * 15;
    } else if (landingZone === "mid") {
      landingX = 65 + Math.random() * 20;
    } else {
      landingX = 85 + Math.random() * 15;
    }
  } else {
    // Side2 player hitting (position on right)
    if (isServe) {
      originX = Math.random() * 60 + 40;
      originY = Math.random() * 30 - 25;
    } else {
      if (distanceZone === "close") {
        originX = Math.random() * 76 + 24;
        originY = Math.random() * 48 + 26;
      } else if (distanceZone === "mid") {
        originX = Math.random() * 76 + 24;
        originY = Math.random() * 130 - 15;
      } else {
        originX = Math.random() * 76 + 24;
        originY = Math.random() * 200 - 100;
      }
    }

    // Landing on side1 (left side, X: 0-50)
    if (landingZone === "short") {
      landingX = Math.random() * 15;
    } else if (landingZone === "mid") {
      landingX = 15 + Math.random() * 20;
    } else {
      landingX = 35 + Math.random() * 15;
    }
  }

  return {
    shotNumber,
    side: shotSide,
    player: playerHittingId,
    stroke: stroke as Stroke,
    serveType: serveType as ServeType | null,
    originX: Math.round(originX * 100) / 100,
    originY: Math.round(originY * 100) / 100,
    landingX: Math.round(landingX * 100) / 100,
    landingY: Math.round(landingY * 100) / 100,
  };
}

/**
 * Generate a random match score (best of 3 or 5 sets)
 */
function generateMatchScore(setsPerMatch: number = 3, side1PlayerId: string, side2PlayerId: string): MatchScore {
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

    // Generate shots for this game (10-20 shots per game)
    const shotsCount = Math.floor(Math.random() * 11) + 10;
    const shots: Shot[] = [];
    for (let i = 1; i <= shotsCount; i++) {
      shots.push(generateShot(i, setWinner, side1PlayerId, side2PlayerId));
    }

    games.push({
      gameNumber: games.length + 1,
      side1Score: setWinner === "side1" ? side1Score : side2Score,
      side2Score: setWinner === "side2" ? side1Score : side2Score,
      winnerSide: setWinner,
      completed: true,
      shots,
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
 * Create or get PlayerStats for a user
 */
async function getOrCreatePlayerStats(userId: string, matchType: string = "singles"): Promise<any> {
  let stats = await PlayerStats.findOne({ user: userId, matchType });
  if (!stats) {
    stats = new PlayerStats({
      user: userId,
      matchType,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      setsWon: 0,
      setsLost: 0,
      setWinRate: 0,
      totalPoints: 0,
      pointsWon: 0,
      pointsLost: 0,
      shots: {
        forehand: { total: 0 },
        backhand: { total: 0 },
        serve: { total: 0 },
        detailed: {},
      },
    });
    await stats.save();
  }
  return stats;
}

/**
 * Update PlayerStats after a match
 */
async function updatePlayerStats(userId: string, isWinner: boolean, match: any): Promise<void> {
  const stats = await getOrCreatePlayerStats(userId, "singles");
  
  stats.totalMatches += 1;
  if (isWinner) {
    stats.wins += 1;
    stats.currentStreak = (stats.currentStreak || 0) + 1;
    stats.bestWinStreak = Math.max(stats.bestWinStreak || 0, stats.currentStreak);
  } else {
    stats.losses += 1;
    stats.currentStreak = (stats.currentStreak || 0) - 1;
    stats.worstLoseStreak = Math.min(stats.worstLoseStreak || 0, stats.currentStreak);
  }
  
  stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
  
  // Update set stats
  if (match.finalScore) {
    if (isWinner) {
      stats.setsWon += match.finalScore.side1Sets > match.finalScore.side2Sets ? match.finalScore.side1Sets : match.finalScore.side2Sets;
      stats.setsLost += match.finalScore.side1Sets < match.finalScore.side2Sets ? match.finalScore.side1Sets : match.finalScore.side2Sets;
    } else {
      stats.setsWon += match.finalScore.side1Sets < match.finalScore.side2Sets ? match.finalScore.side1Sets : match.finalScore.side2Sets;
      stats.setsLost += match.finalScore.side1Sets > match.finalScore.side2Sets ? match.finalScore.side1Sets : match.finalScore.side2Sets;
    }
  }
  
  stats.setWinRate = stats.setsWon + stats.setsLost > 0 ? (stats.setsWon / (stats.setsWon + stats.setsLost)) * 100 : 0;
  stats.lastMatchDate = new Date();
  
  await stats.save();
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

  // Get player IDs for shot tracking
  const side1PlayerId = match.participants?.[0]?.toString() || "";
  const side2PlayerId = match.participants?.[1]?.toString() || "";

  // Generate random score with shots
  const score = generateMatchScore(match.numberOfSets || 3, side1PlayerId, side2PlayerId);

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
    venue: "Joyful Table Tennis Center",
    city: "Metropolis",
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

    let matchId = bracketMatch.matchId?.toString();
    
    // If no match document exists, create it
    if (!matchId) {
      try {
        const newMatch = await createBracketMatch(bracketMatch, tournament, organizerId);
        if (newMatch) {
          matchId = newMatch._id.toString();
          bracketMatch.matchId = matchId;
          tournament.markModified("bracket");
          await tournament.save();
        }
      } catch (err) {
        console.log(`   ⚠️  Could not create match document for ${bracketMatch.bracketPosition.matchNumber}`);
        continue;
      }
    }
    
    if (!matchId) {
      console.log(`   ⚠️  Match ${bracketMatch.bracketPosition.matchNumber} has no match document (bye?)`);
      continue;
    }

    // Get participant names for display using shared helpers
    const participant1 = findParticipant(tournament.participants, bracketMatch.participant1) as any;
    const participant2 = findParticipant(tournament.participants, bracketMatch.participant2) as any;

    const player1Name = participantName(participant1);
    const player2Name = participantName(participant2);

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
    const winnerName = participantName(winner);

    console.log(`      ✅ Winner: ${winnerName}`);

    // Update stats for both players
    const loser = winnerSide === "side1" ? participant2 : participant1;
    const loserId = winnerSide === "side1" ? bracketMatch.participant2?.toString() : bracketMatch.participant1?.toString();
    
    if (winnerId) {
      await updatePlayerStats(winnerId, true, await IndividualMatch.findById(matchId));
    }
    if (loserId) {
      await updatePlayerStats(loserId, false, await IndividualMatch.findById(matchId));
    }

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
    .populate({ path: "participants", model: "User", select: "username fullName" })
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
      const p1 = findParticipant(tournament.participants, match.participant1) as any;
      const p2 = findParticipant(tournament.participants, match.participant2) as any;

      const p1Name = p1
        ? participantName(p1)
        : match.participant1
        ? "Bye"
        : "TBD";
      const p2Name = p2
        ? participantName(p2)
        : match.participant2
        ? "Bye"
        : "TBD";

      const winner = match.completed
        ? findParticipant(tournament.participants, match.winner)
        : null;
      const winnerName = winner ? participantName(winner) : "";

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
      const champion = findParticipant(tournament.participants, finalMatch.winner) as any;
      const championName = participantName(champion);

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

    // Use seeded test users instead of real database users
    if (SEEDED_USERS.length < MIN_PLAYERS) {
      throw new Error(
        `Need at least ${MIN_PLAYERS} seeded players. Found ${SEEDED_USERS.length}`
      );
    }

    // Create or fetch seeded users from database
    const users: any[] = [];
    for (const userData of SEEDED_USERS.slice(0, NUM_PLAYERS)) {
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (existingUser) {
        console.log(`  ⏭️  User ${userData.username} already exists, using existing user...`);
        users.push(existingUser);
      } else {
        const user = new User({
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          password: "hashedPassword123", // Dummy password
          isEmailVerified: true,
          isProfileComplete: true,
          gender: userData.gender,
          handedness: userData.handedness,
          playingStyle: userData.playingStyle,
          profileImage: userData.profileImage,
        });
        await user.save();
        console.log(`  ✅ Created user: ${userData.fullName} (@${userData.username})`);
        users.push(user);
      }
    }

    // Use first seeded user as organizer
    const organizer = users[0];
    const organizerId = organizer._id.toString();

    // Select participants (use exact number requested)
    const participantIds = users.map((u) => u._id.toString());
    
    // Create PlayerStats records for all seeded users
    console.log("\n📊 Creating PlayerStats for seeded users...");
    for (const user of users) {
      await getOrCreatePlayerStats(user._id.toString(), "singles");
    }
    console.log("✅ PlayerStats created for all seeded users");

    console.log(`\n🎯 Creating knockout tournament with ${participantIds.length} players:`);
    participantIds.forEach((id, index) => {
      const user = users.find((u) => u._id.toString() === id);
      console.log(`   ${index + 1}. ${user?.username || user?.fullName || "Unknown"}`);
    });

    // Create tournament
    const tournamentId = await createTournament(
      `Knockout Tournament`,
      organizerId,
      participantIds
    );

    console.log(`\n✅ Tournament created: ${tournamentId}`);

    // Load tournament (populate participants so we can display names)
    const tournament = await Tournament.findById(tournamentId).populate({
      path: "participants",
      model: "User",
      select: "username fullName",
    });
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

    // Reload tournament to get updated bracket and populated participants
    const updatedTournament = await Tournament.findById(tournamentId).populate({
      path: "participants",
      model: "User",
      select: "username fullName",
    });
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
      const currentTournament = await Tournament.findById(tournamentId).populate({
        path: "participants",
        model: "User",
        select: "username fullName",
      });
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

