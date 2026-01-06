import { Types } from "mongoose";
import { Shot } from "./shot.type";

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Match = IndividualMatch | TeamMatch;

export type IndividualMatchType = "singles" | "doubles";
export type MatchCategory = "individual" | "team";
export type WinnerSide = "side1" | "side2" | null;

export interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

export interface Player {
  _id: string;
  user: Participant;
  role?: "player" | "captain";
}

export type PlayerKey = "side1" | "side2" | "team1" | "team2";

export type DoublesPlayerKey =
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner"
  | "team1_main"
  | "team1_partner"
  | "team2_main"
  | "team2_partner";

export type ServerKey = PlayerKey | DoublesPlayerKey;

export type InitialServerConfig = {
  firstServer?: ServerKey | null;
  firstReceiver?: DoublesPlayerKey | null;
  serverOrder?: DoublesPlayerKey[];
};

// ============================================
// INDIVIDUAL MATCH TYPES
// ============================================

export interface IndividualGame {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  team1Score?: number;
  team2Score?: number;
  winnerSide?: WinnerSide;
  completed: boolean;
  shots: Shot[];
  duration?: number;
  startTime?: string;
  endTime?: string;
}

export interface IndividualMatch {
  _id: string;
  matchCategory: "individual";
  matchType: IndividualMatchType;
  numberOfSets: number;
  participants: Participant[];
  scorer?: Participant | string; // Can be Participant object (populated) or string ID (not populated)
  city?: string;
  venue?: string;
  status: MatchStatus;
  currentGame: number;
  games: IndividualGame[];
  finalScore: {
    side1Sets: number;
    side2Sets: number;
  };
  winnerSide?: "side1" | "side2" | null;
  matchDuration?: number;
  currentServer?: ServerKey | null;
  serverConfig?: InitialServerConfig | null;
  tournament?: {
    _id: string;
    name: string;
    format: string;
    status: string;
  } | null;
  shotTrackingMode?: "detailed" | "simple";
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// TEAM MATCH TYPES
// ============================================

// Re-export canonical types from shared module
export type {
  TeamMatchFormat,
  TeamSubMatchType,
  TeamWinnerSide,
  TeamSideKey,
  TeamServerKey,
  TeamServerConfig,
  TeamGame,
  TeamSubMatchBase,
  TeamSubMatch,
  TeamSubMatchPopulated,
  TeamMatchSnapshot,
  TeamMatchSnapshotPopulated,
  TeamMatchFinalScore,
  TeamPlayerStats,
  TeamMatchStatistics,
  TeamMatchBase,
  TeamMatchDocument,
  TeamMatchPopulated,
  SinglesSubMatchConfig,
  DoublesSubMatchConfig,
  CreateTeamMatchDTO,
  TeamSubMatchScorePayload,
} from "@/shared/match/teamMatchTypes";

export {
  FORMAT_DISPLAY_NAMES,
  FORMAT_REQUIREMENTS,
  getRequiredPositions,
  isTeamSubMatchPopulated,
} from "@/shared/match/teamMatchTypes";

// Legacy types for backwards compatibility
export interface TeamInfo {
  _id: string;
  name: string;
  captain?: Participant;
  logo?: string;
  players: Player[];
  city: string;
  stats?: {
    matchesPlayed?: number;
    matchesWon?: number;
    matchesLost?: number;
    winPercentage?: number;
    gamesWon?: number;
    gamesLost?: number;
    totalMatches?: number;
    wins?: number;
    losses?: number;
  };
  assignments?: Record<string, string>;
}

export interface SubMatch {
  _id?: Types.ObjectId | string;
  matchNumber: number;
  matchType: "singles" | "doubles";
  numberOfGames: number;

  playerTeam1?: Participant | Types.ObjectId | Participant[] | string[];
  playerTeam2?: Participant | Types.ObjectId | Participant[] | string[];
  serverConfig?: InitialServerConfig | null;
  currentServer?: ServerKey | null;

  games: IndividualGame[];
  finalScore?: {
    team1Games: number;
    team2Games: number;
  };
  winnerSide?: "team1" | "team2" | null;
  status: MatchStatus;
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TeamMatch {
  _id: string;
  matchCategory: "team";
  matchFormat: "five_singles" | "single_double_single" | "custom";
  numberOfGamesPerRubber: number;
  numberOfSubMatches?: number;
  team1: TeamInfo;
  team2: TeamInfo;
  scorer?: Participant | string;
  city?: string;
  venue?: string;
  status: MatchStatus;
  subMatches: SubMatch[];
  currentSubMatch: number;
  finalScore: {
    team1Matches: number;
    team2Matches: number;
  };
  winnerTeam?: "team1" | "team2" | null;
  serverConfig?: InitialServerConfig | null;
  currentServer?: ServerKey | null;
  statistics?: {
    longestStreak?: number;
    clutchPointsWon?: number;
    playerStats?: Record<string, any>;
  };
  tournament?: {
    _id: string;
    name: string;
    format: string;
    status: string;
  } | null;
  shotTrackingMode?: "detailed" | "simple";
  scheduledDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// UNIFIED TYPES
// ============================================

export type NormalizedMatch = IndividualMatch | TeamMatch;

export interface AddPointPayload {
  side: "side1" | "side2" | "team1" | "team2";
  playerId?: string;
  shotData?: {
    stroke: string;
  };
}

export type OnAddPoint = (payload: AddPointPayload) => void;

// ============================================
// TYPE GUARDS
// ============================================

export function isIndividualMatch(
  match: NormalizedMatch
): match is IndividualMatch {
  return match.matchCategory === "individual";
}

export function isTeamMatch(match: NormalizedMatch): match is TeamMatch {
  return match.matchCategory === "team";
}

// ============================================
// SCORE UPDATE TYPES
// ============================================

export interface SubMatchScoreUpdate {
  subMatchNumber: number;
  gameNumber: number;
  side1Score?: number;
  side2Score?: number;
}

export interface TeamMatchScoreUpdate {
  matchId: string;
  subMatchNumber: number;
  gameNumber: number;
  team1Score: number;
  team2Score: number;
}
