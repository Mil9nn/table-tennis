/**
 * Canonical Team Match Types
 *
 * This file is the SINGLE SOURCE OF TRUTH for all team match related types.
 * All other files (models, services, components) should import from here.
 *
 * Benefits:
 * - Eliminates type drift between model, types, and factory
 * - Ensures consistency across the codebase
 * - Makes refactoring safer and easier
 */

import { Types } from "mongoose";
import { Shot } from "@/types/shot.type";

// ============================================
// BASE ENUMS & CONSTANTS
// ============================================

export type TeamMatchFormat =
  | "five_singles"
  | "single_double_single"
  | "custom";

export type TeamSubMatchType = "singles" | "doubles";

export type TeamWinnerSide = "team1" | "team2" | null;

export type TeamMatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TeamServerKey =
  | "team1"
  | "team2"
  | "team1_main"
  | "team1_partner"
  | "team2_main"
  | "team2_partner";

export type TeamSideKey = "team1" | "team2";

// ============================================
// SERVER CONFIGURATION
// ============================================

export interface TeamServerConfig {
  firstServer?: TeamServerKey | null;
  firstReceiver?: TeamServerKey | null;
  serverOrder?: TeamServerKey[];
}

// ============================================
// GAME TYPES
// ============================================

export interface TeamGame {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
  winnerSide?: TeamWinnerSide;
  completed: boolean;
  /** Filled when merging from `matchpoints` on API responses; not stored on match documents. */
  shots?: Shot[];
  duration?: number;
  startTime?: Date | string;
  endTime?: Date | string;
}

// ============================================
// SUBMATCH TYPES
// ============================================

/**
 * Base SubMatch type - used in the factory and for creating new submatches
 * Players are represented as string IDs (not populated)
 */
export interface TeamSubMatchBase {
  matchNumber: number;
  matchType: TeamSubMatchType;
  playerTeam1: string[];
  playerTeam2: string[];
  numberOfGames: number;
  games: TeamGame[];
  finalScore: {
    team1Games: number;
    team2Games: number;
  };
  winnerSide: TeamWinnerSide;
  status: TeamMatchStatus;
  completed: boolean;
  currentServer?: TeamServerKey | null;
  serverConfig?: TeamServerConfig | null;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * SubMatch with MongoDB _id - used when reading from database
 */
export interface TeamSubMatch extends TeamSubMatchBase {
  _id?: Types.ObjectId | string;
}

/**
 * Populated SubMatch - used in API responses where players are populated
 */
export interface TeamSubMatchPopulated extends Omit<TeamSubMatch, "playerTeam1" | "playerTeam2"> {
  playerTeam1: TeamParticipant[];
  playerTeam2: TeamParticipant[];
}

// ============================================
// PARTICIPANT & PLAYER TYPES
// ============================================

export interface TeamParticipant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

export interface TeamPlayer {
  _id?: string;
  user: TeamParticipant | string;
  role?: "player" | "captain";
  joinedDate?: Date;
}

// ============================================
// TEAM INFO TYPES
// ============================================

export interface TeamStats {
  totalMatches?: number;
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  wins?: number;
  losses?: number;
  winPercentage?: number;
  gamesWon?: number;
  gamesLost?: number;
}

/**
 * Team snapshot stored in a match - captures team state at match time
 */
export interface TeamMatchSnapshot {
  _id: string;
  name: string;
  logo?: string;
  captain?: string | TeamParticipant;
  players: TeamPlayer[];
  city?: string;
  assignments?: Record<string, string> | Map<string, string>;
  stats?: TeamStats;
}

/**
 * Populated team info - used in API responses
 */
export interface TeamMatchSnapshotPopulated extends Omit<TeamMatchSnapshot, "captain" | "players"> {
  captain?: TeamParticipant;
  players: Array<{
    _id?: string;
    user: TeamParticipant;
    role?: "player" | "captain";
    joinedDate?: Date;
  }>;
}

// ============================================
// TEAM MATCH TYPES
// ============================================

/**
 * Team Match final score
 */
export interface TeamMatchFinalScore {
  team1Matches: number;
  team2Matches: number;
}

/**
 * Player statistics within a team match
 */
export interface TeamPlayerStats {
  detailedShots?: {
    forehand_drive?: number;
    backhand_drive?: number;
    forehand_topspin?: number;
    backhand_topspin?: number;
    forehand_loop?: number;
    backhand_loop?: number;
    forehand_smash?: number;
    backhand_smash?: number;
    forehand_push?: number;
    backhand_push?: number;
    forehand_chop?: number;
    backhand_chop?: number;
    forehand_flick?: number;
    backhand_flick?: number;
    forehand_block?: number;
    backhand_block?: number;
    forehand_drop?: number;
    backhand_drop?: number;
  };
}

export interface TeamMatchStatistics {
  longestStreak?: number;
  clutchPointsWon?: number;
  playerStats?: Map<string, TeamPlayerStats> | Record<string, TeamPlayerStats>;
}

/**
 * Base Team Match interface (for creation)
 */
export interface TeamMatchBase {
  matchCategory: "team";
  matchFormat: TeamMatchFormat;
  numberOfGamesPerRubber: number;
  numberOfSubMatches: number;
  currentSubMatch: number;
  team1: TeamMatchSnapshot;
  team2: TeamMatchSnapshot;
  subMatches: TeamSubMatch[];
  finalScore: TeamMatchFinalScore;
  winnerTeam: TeamWinnerSide;
  status: TeamMatchStatus;
  scorer?: string;
  city?: string;
  venue?: string;
  serverConfig?: TeamServerConfig | null;
  statistics?: TeamMatchStatistics;
  scheduledDate?: Date;
  tournament?: string | {
    _id: string;
    name: string;
    format: string;
    status: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Team Match with ID - used when reading from database
 */
export interface TeamMatchDocument extends TeamMatchBase {
  _id: string;
}

/**
 * Populated Team Match - used in API responses
 */
export interface TeamMatchPopulated extends Omit<TeamMatchDocument, "team1" | "team2" | "subMatches" | "scorer"> {
  team1: TeamMatchSnapshotPopulated;
  team2: TeamMatchSnapshotPopulated;
  subMatches: TeamSubMatchPopulated[];
  scorer?: TeamParticipant;
}

// ============================================
// FORMAT HELPERS
// ============================================

export const FORMAT_DISPLAY_NAMES: Record<TeamMatchFormat, string> = {
  five_singles: "Swaythling Cup (Best of 5)",
  single_double_single: "Single-Double-Single",
  custom: "Custom Format",
};

export const FORMAT_REQUIREMENTS: Record<
  TeamMatchFormat,
  {
    team1: string[];
    team2: string[];
    minPlayers: number;
  }
> = {
  five_singles: {
    team1: ["A", "B", "C"],
    team2: ["X", "Y", "Z"],
    minPlayers: 3,
  },
  single_double_single: {
    team1: ["A", "B"],
    team2: ["X", "Y"],
    minPlayers: 2,
  },
  custom: {
    team1: [],
    team2: [],
    minPlayers: 1,
  },
};

/**
 * Get required positions for a team match format
 */
export function getRequiredPositions(format: TeamMatchFormat): {
  team1: string[];
  team2: string[];
} {
  const requirements = FORMAT_REQUIREMENTS[format];
  return {
    team1: requirements.team1,
    team2: requirements.team2,
  };
}

// ============================================
// FACTORY CONFIG TYPES
// ============================================

export interface SinglesSubMatchConfig {
  matchNumber: number;
  playerTeam1: string;
  playerTeam2: string;
  numberOfGames: number;
}

export interface DoublesSubMatchConfig {
  matchNumber: number;
  playerTeam1: [string, string];
  playerTeam2: [string, string];
  numberOfGames: number;
}

// ============================================
// DTO TYPES (for API/Repository layer)
// ============================================

export interface CreateTeamMatchDTO {
  tournament?: string;
  matchFormat: TeamMatchFormat;
  numberOfGamesPerRubber: number;
  team1: TeamMatchSnapshot;
  team2: TeamMatchSnapshot;
  subMatches: TeamSubMatchBase[];
  scorer?: string;
  groupId?: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
    nextMatchNumber?: number;
  };
  roundName?: string;
  courtNumber?: number;
  isThirdPlaceMatch?: boolean;
  city?: string;
  venue?: string;
  scheduledDate?: Date;
}

// ============================================
// SCORING TYPES
// ============================================

export interface TeamSubMatchScorePayload {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
  shotData?: {
    side: TeamSideKey;
    player: string;
    stroke: string;
    server?: string | null;
    originX?: number;
    originY?: number;
    landingX?: number;
    landingY?: number;
  };
  action?: "subtract";
}

// ============================================
// TYPE GUARDS
// ============================================

export function isTeamSubMatchPopulated(
  subMatch: TeamSubMatch | TeamSubMatchPopulated
): subMatch is TeamSubMatchPopulated {
  return (
    Array.isArray(subMatch.playerTeam1) &&
    subMatch.playerTeam1.length > 0 &&
    typeof subMatch.playerTeam1[0] === "object" &&
    "username" in (subMatch.playerTeam1[0] as TeamParticipant)
  );
}
