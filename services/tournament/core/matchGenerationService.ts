import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import mongoose from "mongoose";
import { ITournament, ISeeding } from "@/models/Tournament";
import { Tournament } from "@/services/tournament/repositories/TournamentRepository";
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
  tournament: Tournament;
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
  tournament: Tournament,
  scorerId: string,
  groupId?: string
): Promise<any> {
  const match = new IndividualMatch({
    matchType: (tournament as any).matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue,
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
 * Create and save a scheduled team match (round-robin)
 */
export async function createScheduledTeamMatch(
  pairing: any,
  tournament: Tournament,
  scorerId: string,
  groupId?: string
): Promise<any> {
  // DEBUG: Log tournament
  console.log("🔵 [MATCH GEN] Tournament received:", {
    id: tournament._id,
    category: (tournament as any).category,
    teamConfig: (tournament as any).teamConfig,
    teamConfig_setsPerSubMatch: (tournament as any).teamConfig?.setsPerSubMatch,
    teamConfig_setsPerSubMatch_type: typeof (tournament as any).teamConfig?.setsPerSubMatch,
    rules_setsPerMatch: (tournament as any).rules?.setsPerMatch,
    teamConfig_full: JSON.stringify((tournament as any).teamConfig),
  });

  // Fetch team docs
  const team1 = await Team.findById(pairing.player1).lean();
  const team2 = await Team.findById(pairing.player2).lean();

  if (!team1 || !team2) {
    throw new Error("Invalid team IDs in pairing");
  }

  // Prepare submatches according to teamConfig (optional: if assignments exist)
  const matchFormat =
    (tournament as any).teamConfig?.matchFormat || "five_singles";
  const rawSetsValue = (tournament as any).teamConfig?.setsPerSubMatch;
  const setsPerSubMatch = rawSetsValue 
    ? Number(rawSetsValue)
    : 3;

  // DEBUG: Log extracted values step-by-step
  console.log("🟢 [MATCH GEN] Extracting setsPerSubMatch:", {
    rawValue: rawSetsValue,
    rawType: typeof rawSetsValue,
    afterNumber: setsPerSubMatch,
    afterType: typeof setsPerSubMatch,
    fallbackApplied: !rawSetsValue,
    matchFormat,
  });

  const subMatches: any[] = [];
  
  // Convert Map to object if needed (MongoDB stores Map as object)
  const getAssignmentsObject = (assignments: any): Record<string, string> => {
    if (!assignments) return {};
    if (assignments instanceof Map) {
      return Object.fromEntries(assignments);
    }
    if (typeof assignments === 'object') {
      return assignments;
    }
    return {};
  };

  const team1Assignments = getAssignmentsObject((team1 as any).assignments);
  const team2Assignments = getAssignmentsObject((team2 as any).assignments);

  function findByPos(assignments: Record<string, string>, pos: string) {
    const entries = Object.entries(assignments || {});
    const found = entries.find(([, p]) => p === pos);
    return found ? found[0] : null;
  }

  // Validate team assignments based on format
  const team1Positions = Object.values(team1Assignments);
  const team2Positions = Object.values(team2Assignments);

  if (matchFormat === "five_singles") {
    // five_singles requires A, B, C for team1 and X, Y, Z for team2
    const requiredTeam1 = ["A", "B", "C"];
    const requiredTeam2 = ["X", "Y", "Z"];
    
    const missingTeam1 = requiredTeam1.filter(pos => !team1Positions.includes(pos));
    const missingTeam2 = requiredTeam2.filter(pos => !team2Positions.includes(pos));
    
    if (missingTeam1.length > 0 || missingTeam2.length > 0) {
      const errors: string[] = [];
      if (missingTeam1.length > 0) {
        errors.push(`Team "${(team1 as any).name}" is missing positions: ${missingTeam1.join(", ")}`);
      }
      if (missingTeam2.length > 0) {
        errors.push(`Team "${(team2 as any).name}" is missing positions: ${missingTeam2.join(", ")}`);
      }
      throw new Error(`Cannot generate team match: ${errors.join(". ")}. Please assign all player positions (A, B, C for home team; X, Y, Z for away team) before generating the draw.`);
    }

    const order = [
      ["A", "X"],
      ["B", "Y"],
      ["C", "Z"],
      ["A", "Y"],
      ["B", "X"],
    ];
    order.forEach((pair, idx) => {
      const p1 = findByPos(team1Assignments, pair[0]);
      const p2 = findByPos(team2Assignments, pair[1]);
      if (p1 && p2) {
        subMatches.push({
          matchNumber: idx + 1,
          matchType: "singles",
          playerTeam1: [p1],
          playerTeam2: [p2],
          numberOfSets: setsPerSubMatch,
          games: [],
          status: "scheduled",
          completed: false,
        });
      }
    });
  } else if (matchFormat === "single_double_single") {
    // single_double_single requires A, B for team1 and X, Y for team2
    const requiredTeam1 = ["A", "B"];
    const requiredTeam2 = ["X", "Y"];
    
    const missingTeam1 = requiredTeam1.filter(pos => !team1Positions.includes(pos));
    const missingTeam2 = requiredTeam2.filter(pos => !team2Positions.includes(pos));
    
    if (missingTeam1.length > 0 || missingTeam2.length > 0) {
      const errors: string[] = [];
      if (missingTeam1.length > 0) {
        errors.push(`Team "${(team1 as any).name}" is missing positions: ${missingTeam1.join(", ")}`);
      }
      if (missingTeam2.length > 0) {
        errors.push(`Team "${(team2 as any).name}" is missing positions: ${missingTeam2.join(", ")}`);
      }
      throw new Error(`Cannot generate team match: ${errors.join(". ")}. Please assign player positions (A, B for home team; X, Y for away team) before generating the draw.`);
    }

    const A = findByPos(team1Assignments, "A");
    const B = findByPos(team1Assignments, "B");
    const X = findByPos(team2Assignments, "X");
    const Y = findByPos(team2Assignments, "Y");
    if (A && X) {
      subMatches.push({
        matchNumber: 1,
        matchType: "singles",
        playerTeam1: [A],
        playerTeam2: [X],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
    if (A && B && X && Y) {
      subMatches.push({
        matchNumber: 2,
        matchType: "doubles",
        playerTeam1: [A, B],
        playerTeam2: [X, Y],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
    if (B && Y) {
      subMatches.push({
        matchNumber: 3,
        matchType: "singles",
        playerTeam1: [B],
        playerTeam2: [Y],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
  }

  const teamMatch = new TeamMatch({
    matchCategory: "team",
    matchFormat: matchFormat,
    numberOfSetsPerSubMatch: setsPerSubMatch,
    numberOfSubMatches:
      subMatches.length || (matchFormat === "five_singles" ? 5 : 3),
    city: tournament.city,
    venue: tournament.venue,
    scorer: scorerId,
    status: "scheduled",
    team1: {
      name: (team1 as any).name,
      captain: (team1 as any).captain,
      players: (team1 as any).players,
      city: (team1 as any).city,
      assignments: (team1 as any).assignments || {},
    },
    team2: {
      name: (team2 as any).name,
      captain: (team2 as any).captain,
      players: (team2 as any).players,
      city: (team2 as any).city,
      assignments: (team2 as any).assignments || {},
    },
    subMatches,
  });

  // DEBUG: Log match object before save
  console.log("🟡 [MATCH GEN] TeamMatch object created (pre-save):", {
    id: teamMatch._id,
    matchFormat: teamMatch.matchFormat,
    numberOfSetsPerSubMatch: teamMatch.numberOfSetsPerSubMatch,
    numberOfSetsPerSubMatch_type: typeof teamMatch.numberOfSetsPerSubMatch,
    numberOfSubMatches: teamMatch.numberOfSubMatches,
    subMatches_count: teamMatch.subMatches?.length,
  });

  await teamMatch.save();

  // DEBUG: Log after save
  console.log("🟠 [MATCH GEN] Match saved to database:", {
    id: teamMatch._id,
    numberOfSetsPerSubMatch: teamMatch.numberOfSetsPerSubMatch,
    numberOfSetsPerSubMatch_type: typeof teamMatch.numberOfSetsPerSubMatch,
    subMatches: teamMatch.subMatches?.map((sm: any) => ({
      id: sm._id,
      numberOfSets: sm.numberOfSets,
    })),
  });

  console.log("🔴 [MATCH GEN] Full match object:", teamMatch);

  return teamMatch;
}

/**
 * Create a team match for a bracket position with bracket metadata
 */
export async function createBracketTeamMatch(
  bracketMatch: BracketMatch,
  tournament: Tournament,
  scorerId: string
): Promise<any> {
  // Only create matches that have both participants (not TBD)
  if (!bracketMatch.participant1 || !bracketMatch.participant2) {
    return null;
  }

  // Fetch team docs
  const team1 = await Team.findById(bracketMatch.participant1).lean();
  const team2 = await Team.findById(bracketMatch.participant2).lean();

  if (!team1 || !team2) {
    throw new Error("Invalid team IDs in bracket match");
  }

  // Prepare submatches according to teamConfig (optional: if assignments exist)
  const matchFormat =
    (tournament as any).teamConfig?.matchFormat || "five_singles";
  const setsPerSubMatch = (tournament as any).teamConfig?.setsPerSubMatch 
    ? Number((tournament as any).teamConfig.setsPerSubMatch)
    : 3;

  const subMatches: any[] = [];
  
  // Convert Map to object if needed (MongoDB stores Map as object)
  const getAssignmentsObj = (assignments: any): Record<string, string> => {
    if (!assignments) return {};
    if (assignments instanceof Map) {
      return Object.fromEntries(assignments);
    }
    if (typeof assignments === 'object') {
      return assignments;
    }
    return {};
  };

  const team1Assignments = getAssignmentsObj((team1 as any).assignments);
  const team2Assignments = getAssignmentsObj((team2 as any).assignments);

  function findByPos(assignments: Record<string, string>, pos: string) {
    const entries = Object.entries(assignments || {});
    const found = entries.find(([, p]) => p === pos);
    return found ? found[0] : null;
  }

  // Validate team assignments based on format
  const team1Positions = Object.values(team1Assignments);
  const team2Positions = Object.values(team2Assignments);

  if (matchFormat === "five_singles") {
    // five_singles requires A, B, C for team1 and X, Y, Z for team2
    const requiredTeam1 = ["A", "B", "C"];
    const requiredTeam2 = ["X", "Y", "Z"];
    
    const missingTeam1 = requiredTeam1.filter(pos => !team1Positions.includes(pos));
    const missingTeam2 = requiredTeam2.filter(pos => !team2Positions.includes(pos));
    
    if (missingTeam1.length > 0 || missingTeam2.length > 0) {
      const errors: string[] = [];
      if (missingTeam1.length > 0) {
        errors.push(`Team "${(team1 as any).name}" is missing positions: ${missingTeam1.join(", ")}`);
      }
      if (missingTeam2.length > 0) {
        errors.push(`Team "${(team2 as any).name}" is missing positions: ${missingTeam2.join(", ")}`);
      }
      throw new Error(`Cannot generate team match: ${errors.join(". ")}. Please assign all player positions (A, B, C for home team; X, Y, Z for away team) before generating the draw.`);
    }

    const order = [
      ["A", "X"],
      ["B", "Y"],
      ["C", "Z"],
      ["A", "Y"],
      ["B", "X"],
    ];
    order.forEach((pair, idx) => {
      const p1 = findByPos(team1Assignments, pair[0]);
      const p2 = findByPos(team2Assignments, pair[1]);
      if (p1 && p2) {
        subMatches.push({
          matchNumber: idx + 1,
          matchType: "singles",
          playerTeam1: [p1],
          playerTeam2: [p2],
          numberOfSets: setsPerSubMatch,
          games: [],
          status: "scheduled",
          completed: false,
        });
      }
    });
  } else if (matchFormat === "single_double_single") {
    // single_double_single requires A, B for team1 and X, Y for team2
    const requiredTeam1 = ["A", "B"];
    const requiredTeam2 = ["X", "Y"];
    
    const missingTeam1 = requiredTeam1.filter(pos => !team1Positions.includes(pos));
    const missingTeam2 = requiredTeam2.filter(pos => !team2Positions.includes(pos));
    
    if (missingTeam1.length > 0 || missingTeam2.length > 0) {
      const errors: string[] = [];
      if (missingTeam1.length > 0) {
        errors.push(`Team "${(team1 as any).name}" is missing positions: ${missingTeam1.join(", ")}`);
      }
      if (missingTeam2.length > 0) {
        errors.push(`Team "${(team2 as any).name}" is missing positions: ${missingTeam2.join(", ")}`);
      }
      throw new Error(`Cannot generate team match: ${errors.join(". ")}. Please assign player positions (A, B for home team; X, Y for away team) before generating the draw.`);
    }

    const A = findByPos(team1Assignments, "A");
    const B = findByPos(team1Assignments, "B");
    const X = findByPos(team2Assignments, "X");
    const Y = findByPos(team2Assignments, "Y");
    if (A && X) {
      subMatches.push({
        matchNumber: 1,
        matchType: "singles",
        playerTeam1: [A],
        playerTeam2: [X],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
    if (A && B && X && Y) {
      subMatches.push({
        matchNumber: 2,
        matchType: "doubles",
        playerTeam1: [A, B],
        playerTeam2: [X, Y],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
    if (B && Y) {
      subMatches.push({
        matchNumber: 3,
        matchType: "singles",
        playerTeam1: [B],
        playerTeam2: [Y],
        numberOfSets: setsPerSubMatch,
        games: [],
        status: "scheduled",
        completed: false,
      });
    }
  }

  const teamMatch = new TeamMatch({
    matchCategory: "team",
    matchFormat: matchFormat,
    numberOfSetsPerSubMatch: setsPerSubMatch,
    numberOfSubMatches:
      subMatches.length || (matchFormat === "five_singles" ? 5 : 3),
    city: tournament.city,
    venue: tournament.venue,
    scorer: scorerId,
    status: "scheduled",
    tournament: tournament._id,
    bracketPosition: bracketMatch.bracketPosition,
    roundName: bracketMatch.roundName,
    scheduledDate: bracketMatch.scheduledDate,
    courtNumber: bracketMatch.courtNumber,
    team1: {
      name: (team1 as any).name,
      captain: (team1 as any).captain,
      players: (team1 as any).players,
      city: (team1 as any).city,
      assignments: (team1 as any).assignments || {},
    },
    team2: {
      name: (team2 as any).name,
      captain: (team2 as any).captain,
      players: (team2 as any).players,
      city: (team2 as any).city,
      assignments: (team2 as any).assignments || {},
    },
    subMatches,
  });

  await teamMatch.save();
  return teamMatch;
}

/**
 * Create a match for a bracket position with bracket metadata
 */
export async function createBracketMatch(
  bracketMatch: BracketMatch,
  tournament: Tournament,
  scorerId: string
): Promise<any> {
  // Only create matches that have both participants (not TBD)
  if (!bracketMatch.participant1 || !bracketMatch.participant2) {
    return null;
  }

  // Check if this is a doubles or mixed_doubles match
  const isDoubles =
    (tournament as any).matchType === "doubles" ||
    (tournament as any).matchType === "mixed_doubles";

  // Get match participants - for doubles, we need 4 participants
  let matchParticipants: mongoose.Types.ObjectId[];

  if (isDoubles) {
    // For doubles, we need to get all 4 players from the pairs
    // The bracket stores pair IDs (from tournament.doublesPairs)
    
    // First, try to get pairs from tournament.doublesPairs (new approach)
    const doublesPairs = (tournament as any).doublesPairs;
    
    if (doublesPairs && doublesPairs.length > 0) {
      // Find pairs by ID
      const pair1 = doublesPairs.find((p: any) => 
        p._id.toString() === bracketMatch.participant1
      );
      const pair2 = doublesPairs.find((p: any) => 
        p._id.toString() === bracketMatch.participant2
      );
      
      if (pair1 && pair2) {
        matchParticipants = [
          new mongoose.Types.ObjectId(pair1.player1.toString()),
          new mongoose.Types.ObjectId(pair1.player2.toString()),
          new mongoose.Types.ObjectId(pair2.player1.toString()),
          new mongoose.Types.ObjectId(pair2.player2.toString()),
        ];
      } else {
        // Fallback to legacy behavior if pairs not found
        console.warn("[createBracketMatch] Pairs not found in doublesPairs, using legacy method");
        const participantIds = tournament.participants.map((p: any) => p.toString());
        const pairing = {
          player1: bracketMatch.participant1,
          player2: bracketMatch.participant2,
        };
        matchParticipants = getMatchParticipants(pairing, true, participantIds);
      }
    } else {
      // Fallback to legacy consecutive array indexing
      const participantIds = tournament.participants.map((p: any) => p.toString());
      const pairing = {
        player1: bracketMatch.participant1,
        player2: bracketMatch.participant2,
      };
      matchParticipants = getMatchParticipants(pairing, true, participantIds);
    }
  } else {
    // Singles - just 2 participants
    matchParticipants = [
      new mongoose.Types.ObjectId(bracketMatch.participant1),
      new mongoose.Types.ObjectId(bracketMatch.participant2),
    ];
  }

  const match = new IndividualMatch({
    matchType: (tournament as any).matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue,
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
  tournament: any,
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
  tournament: Tournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<void> {
  const isDoubles =
    (tournament as any).matchType === "doubles" ||
    (tournament as any).matchType === "mixed_doubles";

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
        if ((tournament as any).category === "team") {
          const match = await createScheduledTeamMatch(
            pairing,
            tournament,
            scorerId,
            groupAlloc.groupId
          );
          roundMatches.push(match._id);
        } else {
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
      }

      groupRounds.push({
        roundNumber: round.roundNumber,
        matches: roundMatches,
        matchModel:
          (tournament as any).category === "team"
            ? "TeamMatch"
            : "IndividualMatch",
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
  tournament: Tournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<void> {
  const isDoubles =
    (tournament as any).matchType === "doubles" ||
    (tournament as any).matchType === "mixed_doubles";

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

  const rounds = [] as any[];

  for (const round of schedule) {
    const roundMatches = [];

    for (const pairing of round.matches) {
      if ((tournament as any).category === "team") {
        const match = await createScheduledTeamMatch(
          pairing,
          tournament,
          scorerId
        );
        roundMatches.push(match._id);
      } else {
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
    }

    rounds.push({
      roundNumber: round.roundNumber,
      matches: roundMatches,
      matchModel:
        (tournament as any).category === "team"
          ? "TeamMatch"
          : "IndividualMatch",
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
  tournament: Tournament,
  participantIds: string[],
  seeding: ISeeding[],
  scorerId: string,
  options: MatchGenerationOptions
): Promise<KnockoutBracket> {
  // Check if custom matching is enabled
  const allowCustomMatching =
    (tournament as any).knockoutConfig?.allowCustomMatching === true;

  // Generate the knockout bracket
  const bracket = generateKnockoutBracket(
    participantIds,
    seeding.map((s) => ({
      participant: s.participant.toString(),
      seedNumber: s.seedNumber,
    })),
    {
      thirdPlaceMatch:
        (tournament as any).knockoutConfig?.thirdPlaceMatch || false,
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
    // Normal mode: Create match documents for ALL rounds where both participants are known
    // This includes first round real matches AND matches in later rounds where
    // both participants have been determined via byes
    const isTeamCategory = (tournament as any).category === "team";

    for (const round of bracket.rounds) {
      for (const bracketMatch of round.matches) {
        // Only create matches for non-bye matches (both participants present and not completed)
        if (
          bracketMatch.participant1 &&
          bracketMatch.participant2 &&
          !bracketMatch.completed
        ) {
          const match = isTeamCategory
            ? await createBracketTeamMatch(bracketMatch, tournament, scorerId)
            : await createBracketMatch(bracketMatch, tournament, scorerId);
          if (match) {
            bracketMatch.matchId = match._id.toString();
          }
        }
      }
    }
  } else {
    // Custom matching mode: Create EMPTY bracket structure only
    // Organizer will manually configure ALL matches (including Round 1) via custom matcher
  }

  // Store bracket structure in tournament
  // Note: This requires the bracket field to be added to the Tournament model
  (tournament as any).bracket = bracket;

  // CRITICAL: Mark bracket as modified since it's Schema.Types.Mixed
  // Without this, Mongoose won't save the bracket changes to database
  tournament.markModified("bracket");

  return bracket;
}

/**
 * Calculate tournament statistics
 */
function calculateTournamentStats(tournament: Tournament): {
  totalMatches: number;
  totalRounds: number;
  groups?: number;
  format: string;
} {
  // Handle knockout format
  if (tournament.format === "knockout" && (tournament as any).bracket) {
    const bracket = (tournament as any).bracket as KnockoutBracket;
    const totalMatches = bracket.rounds.reduce(
      (sum, r) =>
        sum + r.matches.filter((m) => m.participant1 && m.participant2).length,
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
  tournament: Tournament,
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
    const { generateHybridRoundRobinPhase } = await import(
      "./hybridMatchGenerationService"
    );
    await generateHybridRoundRobinPhase(tournament, {
      scorerId: new mongoose.Types.ObjectId(scorerId),
      ...options,
    });
  } else if (tournament.format === "round_robin") {
    // CRITICAL: Groups are not allowed for pure round-robin format
    // Groups only make sense when there's a next phase (use hybrid format instead)
    if (tournament.useGroups) {
      throw new Error(
        "Groups cannot be used with round-robin format. Groups are only meaningful when there's a next phase. Use 'hybrid' format for round-robin → knockout tournaments."
      );
    }
    await generateSingleRoundRobinMatches(
      tournament,
      participantIds,
      seeding,
      scorerId,
      options
    );
  } else if (tournament.useGroups && tournament.numberOfGroups) {
    // Groups for knockout format (if supported in future)
    await generateGroupMatches(
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

  // Populate tournament data based on category
  const isTeamTournament = (tournament as any).category === "team";

  if (isTeamTournament) {
    // Team tournament population
    await (tournament as any).populate([
      {
        path: "organizer",
        select: "username fullName profileImage",
      },
      {
        path: "participants",
        model: Team,
        select: "name logo city captain players",
        populate: [
          { path: "captain", select: "username fullName profileImage" },
          { path: "players.user", select: "username fullName profileImage" },
        ],
      },
      {
        path: "seeding.participant",
        model: Team,
        select: "name logo city captain",
      },
      {
        path: "standings.participant",
        model: Team,
        select: "name logo city captain",
      },
      {
        path: "groups.standings.participant",
        model: Team,
        select: "name logo city captain",
      },
      {
        path: "groups.participants",
        model: Team,
        select: "name logo city captain players",
        populate: [
          { path: "captain", select: "username fullName profileImage" },
          { path: "players.user", select: "username fullName profileImage" },
        ],
      },
    ]);

    // For team tournaments, rounds.matches are TeamMatch documents
    // They don't have a "participants" field, they have team1/team2
    // So we don't populate via the same mechanism
  } else {
    // Individual tournament population
    await (tournament as any).populate([
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
  }

  // Calculate stats
  const stats = calculateTournamentStats(tournament);

  return {
    tournament,
    stats,
  };
}
