import IndividualMatch from "@/models/IndividualMatch";
import mongoose from "mongoose";
import { ITournament, ISeeding } from "@/models/Tournament";
import {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
} from "./schedulingService";
import { allocateGroups } from "../utils/groupAllocator";
import { generateRandomSeeding } from "./seedingService";
import { generateKnockoutBracket } from "./bracketGenerationService";
import { scheduleBracketMatches } from "./bracketSchedulingService";
import { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";

/**
 * Match generation service
 * Handles all tournament draw generation logic
 */

interface MatchGenerationOptions {
  courtsAvailable?: number;
  matchDuration?: number; // in minutes
}

interface MatchGenerationResult {
  tournament: ITournament;
  stats: {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  };
}

/**
 * Get match participants for singles or doubles matches
 */
export function getMatchParticipants(
  pairing: any,
  isDoubles: boolean,
  participantIds: string[]
): mongoose.Types.ObjectId[] {
  if (!isDoubles) {
    return [pairing.player1, pairing.player2];
  }

  // For doubles, find the team pairs
  const team1Idx = participantIds.findIndex(
    (id: any) => id === pairing.player1.toString()
  );
  const team2Idx = participantIds.findIndex(
    (id: any) => id === pairing.player2.toString()
  );

  return [
    new mongoose.Types.ObjectId(participantIds[team1Idx]),
    new mongoose.Types.ObjectId(participantIds[team1Idx + 1]),
    new mongoose.Types.ObjectId(participantIds[team2Idx]),
    new mongoose.Types.ObjectId(participantIds[team2Idx + 1]),
  ];
}

/**
 * Create and save a scheduled match
 */
export async function createScheduledMatch(
  matchParticipants: mongoose.Types.ObjectId[],
  tournament: ITournament,
  scorerId: string,
  groupId?: string
): Promise<any> {
  const match = new IndividualMatch({
    matchType: tournament.matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue || tournament.city,
    participants: matchParticipants,
    scorer: scorerId,
    status: "scheduled",
    tournament: tournament._id,
    groupId: groupId || undefined,
  });

  await match.save();
  return match;
}

/**
 * Create a match for a bracket position with bracket metadata
 */
export async function createBracketMatch(
  bracketMatch: BracketMatch,
  tournament: ITournament,
  scorerId: string
): Promise<any> {
  // Only create matches that have both participants (not TBD)
  if (!bracketMatch.participant1 || !bracketMatch.participant2) {
    return null;
  }

  const matchParticipants = [
    new mongoose.Types.ObjectId(bracketMatch.participant1),
    new mongoose.Types.ObjectId(bracketMatch.participant2),
  ];

  const match = new IndividualMatch({
    matchType: tournament.matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue || tournament.city,
    participants: matchParticipants,
    scorer: scorerId,
    status: "scheduled",
    tournament: tournament._id,
    bracketPosition: bracketMatch.bracketPosition,
    roundName: bracketMatch.roundName,
    scheduledDate: bracketMatch.scheduledDate,
    courtNumber: bracketMatch.courtNumber,
  });

  await match.save();
  return match;
}

/**
 * Initialize standings for participants
 */
export function initializeStandings(participantIds: string[]) {
  return participantIds.map((pId: string) => ({
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
    headToHead: new Map(),
  }));
}

/**
 * Generate or initialize seeding for tournament
 */
export function prepareSeeding(
  tournament: ITournament,
  participantIds: string[]
): ISeeding[] {
  // Use existing seeding if available
  if (tournament.seeding && tournament.seeding.length > 0) {
    return tournament.seeding;
  }

  // Generate seeding based on method
  if (tournament.seedingMethod === "random") {
    return generateRandomSeeding(participantIds);
  }

  // Default: use registration order
  return participantIds.map((pId: string, index: number) => ({
    participant: new mongoose.Types.ObjectId(pId),
    seedNumber: index + 1,
  }));
}

/**
 * Validate round-robin schedule completeness
 */
function validateScheduleCompleteness(
  participantCount: number,
  actualMatches: number,
  context: string
): void {
  const expectedMatches = (participantCount * (participantCount - 1)) / 2;
  if (actualMatches !== expectedMatches) {
    console.warn(
      `${context} schedule validation: Expected ${expectedMatches} matches, got ${actualMatches}`
    );
  }
}

/**
 * Generate matches for tournament with groups
 */
export async function generateGroupMatches(
  tournament: ITournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<void> {
  const isDoubles =
    tournament.matchType === "doubles" ||
    tournament.matchType === "mixed_doubles";

  const groupAllocations = allocateGroups(
    participantIds,
    tournament.numberOfGroups!,
    seeding.length > 0 ? seeding : undefined
  );

  const groups = [];

  for (const groupAlloc of groupAllocations) {
    // Generate round-robin schedule for this group
    const schedule =
      seeding.length > 0
        ? generateSeededRoundRobinSchedule(
            groupAlloc.participants,
            seeding,
            options.courtsAvailable || 1,
            tournament.startDate,
            options.matchDuration || 60
          )
        : generateRoundRobinSchedule(
            groupAlloc.participants,
            options.courtsAvailable || 1,
            tournament.startDate,
            options.matchDuration || 60
          );

    const groupRounds = [];

    for (const round of schedule) {
      const roundMatches = [];

      for (const pairing of round.matches) {
        const matchParticipants = getMatchParticipants(
          pairing,
          isDoubles,
          participantIds
        );
        const match = await createScheduledMatch(
          matchParticipants,
          tournament,
          scorerId,
          groupAlloc.groupId
        );
        roundMatches.push(match._id);
      }

      groupRounds.push({
        roundNumber: round.roundNumber,
        matches: roundMatches,
        completed: false,
        scheduledDate: round.scheduledDate,
      });
    }

    // Initialize group standings
    const groupStandings = initializeStandings(groupAlloc.participants);

    // Validate schedule completeness
    const groupSize = groupAlloc.participants.length;
    const actualGroupMatches = groupRounds.reduce(
      (sum, r) => sum + r.matches.length,
      0
    );
    validateScheduleCompleteness(
      groupSize,
      actualGroupMatches,
      `Group ${groupAlloc.groupName}`
    );

    groups.push({
      groupId: groupAlloc.groupId,
      groupName: groupAlloc.groupName,
      participants: groupAlloc.participants,
      rounds: groupRounds,
      standings: groupStandings,
    });
  }

  tournament.groups = groups as any;
  tournament.rounds = []; // No overall rounds, only group rounds
  tournament.standings = []; // Will be filled after group stage
}

/**
 * Generate matches for single round-robin tournament (no groups)
 */
export async function generateSingleRoundRobinMatches(
  tournament: ITournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<void> {
  const isDoubles =
    tournament.matchType === "doubles" ||
    tournament.matchType === "mixed_doubles";

  const schedule =
    seeding.length > 0
      ? generateSeededRoundRobinSchedule(
          participantIds,
          seeding,
          options.courtsAvailable || 1,
          tournament.startDate,
          options.matchDuration || 60
        )
      : generateRoundRobinSchedule(
          participantIds,
          options.courtsAvailable || 1,
          tournament.startDate,
          options.matchDuration || 60
        );

  const rounds = [];

  for (const round of schedule) {
    const roundMatches = [];

    for (const pairing of round.matches) {
      const matchParticipants = getMatchParticipants(
        pairing,
        isDoubles,
        participantIds
      );
      const match = await createScheduledMatch(
        matchParticipants,
        tournament,
        scorerId
      );
      roundMatches.push(match._id);
    }

    rounds.push({
      roundNumber: round.roundNumber,
      matches: roundMatches,
      completed: false,
      scheduledDate: round.scheduledDate,
    });
  }

  // Initialize standings
  tournament.rounds = rounds as any;
  tournament.standings = initializeStandings(participantIds) as any;

  // Validate schedule completeness
  const actualMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0);
  validateScheduleCompleteness(
    participantIds.length,
    actualMatches,
    "Round-robin"
  );
}

/**
 * Generate matches for knockout tournament
 */
export async function generateKnockoutMatches(
  tournament: ITournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<KnockoutBracket> {
  // Check if custom matching is enabled
  const allowCustomMatching = (tournament as any).knockoutConfig?.allowCustomMatching === true;

  // Generate the knockout bracket
  const bracket = generateKnockoutBracket(
    participantIds,
    seeding.map((s) => ({
      participant: s.participant.toString(),
      seedNumber: s.seedNumber,
    })),
    {
      thirdPlaceMatch: (tournament as any).knockoutConfig?.thirdPlaceMatch || false,
      scheduledDate: tournament.startDate,
      skipByeAdvancement: allowCustomMatching, // Don't auto-advance byes if custom matching
    }
  );

  // Schedule the bracket matches
  scheduleBracketMatches(
    bracket,
    tournament.startDate,
    options.courtsAvailable || 1,
    options.matchDuration || 60
  );

  // If custom matching is enabled, SKIP all automatic match document creation
  // The organizer will manually configure ALL matches starting from Round 1
  if (!allowCustomMatching) {
    // Normal mode: Create IndividualMatch documents for ALL rounds where both participants are known
    // This includes first round real matches AND matches in later rounds where
    // both participants have been determined via byes
    for (const round of bracket.rounds) {
      for (const bracketMatch of round.matches) {
        // Only create matches for non-bye matches (both participants present and not completed)
        if (
          bracketMatch.participant1 &&
          bracketMatch.participant2 &&
          !bracketMatch.completed
        ) {
          const match = await createBracketMatch(
            bracketMatch,
            tournament,
            scorerId
          );
          if (match) {
            bracketMatch.matchId = match._id.toString();
          }
        }
      }
    }
  } else {
    // Custom matching mode: Create EMPTY bracket structure only
    // Organizer will manually configure ALL matches (including Round 1) via custom matcher
    console.log("[Custom Matching Mode] Empty bracket structure created. Organizer will configure all matchups manually from Round 1.");
  }

  // Store bracket structure in tournament
  // Note: This requires the bracket field to be added to the Tournament model
  (tournament as any).bracket = bracket;

  // CRITICAL: Mark bracket as modified since it's Schema.Types.Mixed
  // Without this, Mongoose won't save the bracket changes to database
  tournament.markModified('bracket');

  return bracket;
}

/**
 * Calculate tournament statistics
 */
function calculateTournamentStats(tournament: ITournament): {
  totalMatches: number;
  totalRounds: number;
  groups?: number;
  format: string;
} {
  // Handle knockout format
  if (tournament.format === "knockout" && (tournament as any).bracket) {
    const bracket = (tournament as any).bracket as KnockoutBracket;
    const totalMatches = bracket.rounds.reduce(
      (sum, r) => sum + r.matches.filter((m) => m.participant1 && m.participant2).length,
      0
    );
    return {
      totalMatches,
      totalRounds: bracket.rounds.length,
      format: "knockout",
    };
  }

  if (tournament.useGroups && tournament.groups) {
    return {
      totalMatches:
        tournament.groups.reduce(
          (sum, g: any) =>
            sum +
            g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
          0
        ) || 0,
      totalRounds: tournament.groups[0]?.rounds.length || 0,
      groups: tournament.numberOfGroups,
      format: "round_robin_groups",
    };
  }

  return {
    totalMatches: tournament.rounds.reduce(
      (sum, r: any) => sum + r.matches.length,
      0
    ),
    totalRounds: tournament.rounds.length,
    format: "round_robin",
  };
}

/**
 * Main function: Generate tournament draw
 */
export async function generateTournamentDraw(
  tournament: ITournament,
  scorerId: string,
  options: MatchGenerationOptions = {}
): Promise<MatchGenerationResult> {
  const participantIds = tournament.participants.map((p: any) => p.toString());

  // Prepare seeding
  const seeding = prepareSeeding(tournament, participantIds);
  tournament.seeding = seeding;

  // Generate matches based on tournament structure
  if (tournament.format === "hybrid") {
    // For hybrid tournaments, only generate round-robin phase initially
    // Import hybrid service dynamically to avoid circular dependencies
    const { generateHybridRoundRobinPhase } = await import("./hybridMatchGenerationService");
    await generateHybridRoundRobinPhase(tournament, {
      scorerId: new mongoose.Types.ObjectId(scorerId),
      ...options,
    });
  } else if (tournament.useGroups && tournament.numberOfGroups) {
    await generateGroupMatches(
      tournament,
      participantIds,
      seeding,
      scorerId,
      options
    );
  } else if (tournament.format === "round_robin") {
    await generateSingleRoundRobinMatches(
      tournament,
      participantIds,
      seeding,
      scorerId,
      options
    );
  } else if (tournament.format === "knockout") {
    await generateKnockoutMatches(
      tournament,
      participantIds,
      seeding,
      scorerId,
      options
    );
  } else {
    throw new Error(
      `Unsupported tournament format: ${tournament.format}. Supported formats: round_robin, knockout, hybrid.`
    );
  }

  // Update tournament metadata
  tournament.drawGenerated = true;
  tournament.drawGeneratedAt = new Date();
  tournament.drawGeneratedBy = new mongoose.Types.ObjectId(scorerId);
  tournament.status = "upcoming";

  await tournament.save();

  // Populate tournament data
  await tournament.populate([
    {
      path: "organizer participants",
      select: "username fullName profileImage",
    },
    { path: "seeding.participant", select: "username fullName profileImage" },
    {
      path: "standings.participant",
      select: "username fullName profileImage",
    },
    {
      path: "groups.standings.participant",
      select: "username fullName profileImage",
    },
    {
      path: "rounds.matches",
      populate: {
        path: "participants",
        select: "username fullName profileImage",
      },
    },
    {
      path: "groups.participants",
      select: "username fullName profileImage",
    },
    {
      path: "groups.rounds.matches",
      populate: {
        path: "participants",
        select: "username fullName profileImage",
      },
    },
  ]);

  // Calculate stats
  const stats = calculateTournamentStats(tournament);

  return {
    tournament,
    stats,
  };
}
