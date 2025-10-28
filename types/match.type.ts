import { Types } from "mongoose";
import { Shot } from "./shot.type";

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type IndividualMatchType = "singles" | "doubles" | "mixed_doubles";
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
  expedite?: boolean;
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
  scorer?: Participant;
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
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// TEAM MATCH TYPES
// ============================================

export interface TeamInfo {
  _id: string;
  name: string;
  captain?: Participant;
  logo?: string;
  players: Player[];
  city: string;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    winPercentage: number;
    gamesWon: number;
    gamesLost: number;
  };
  assignments?: Record<string, string>;
}

export interface SubMatch {
  _id?: Types.ObjectId;
  matchNumber: number;
  matchType: IndividualMatchType;
  numberOfSets: number;

  playerTeam1?: Participant | Types.ObjectId | Participant[];
  playerTeam2?: Participant | Types.ObjectId | Participant[];
  serverConfig?: InitialServerConfig | null;
  currentServer?: ServerKey | null;

  games: IndividualGame[];
  finalScore?: {
    team1Sets: number;
    team2Sets: number;
  };
  winnerSide?: "team1" | "team2" | null;
  status: MatchStatus;
  completed: boolean;
}

export interface TeamMatch {
  _id: string;
  matchCategory: "team";
  matchFormat: TeamMatchFormat;
  numberOfSetsPerSubMatch: number;
  team1: TeamInfo;
  team2: TeamInfo;
  scorer?: Participant;
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
    winners: number;
    errors: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export type TeamMatchFormat =
  | "five_singles"
  | "single_double_single"
  | "custom";

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
