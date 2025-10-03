import { Shot } from "./shot.type";

export type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type IndividualMatchType = "singles" | "doubles" | "mixed_doubles";
export type MatchCategory = "individual" | "team";
export type WinnerSide = "side1" | "side2" | null;

export interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string; 
}

export type PlayerKey = "side1" | "side2";

export type DoublesPlayerKey =
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner";

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
  serverConfig?: InitialServerConfig | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// TEAM MATCH TYPES
// ============================================

export type TeamMatchFormat = 
  | "swaythling_format"      // 5 singles (A-X, B-Y, C-Z, A-Y, B-X)
  | "single_double_single"   // A-X, AB-XY, B-Y
  | "five_singles_full"      // 5 singles (A-X, B-Y, C-Z, D-P, E-Q)
  | "three_singles";         // 3 singles (A-X, B-Y, C-Z)


// ============================================
// UNIFIED TYPES
// ============================================

export type NormalizedMatch = IndividualMatch;

export interface AddPointPayload {
  side: "side1" | "side2";
  playerId?: string;
  shotData?: {
    stroke: string;
    outcome: "winner" | "error";
    errorType?: "net" | "long" | "serve";
  }
}

export type OnAddPoint = (payload: AddPointPayload) => void;

// ============================================
// TYPE GUARDS
// ============================================

export function isIndividualMatch(match: NormalizedMatch): match is IndividualMatch {
  return match.matchCategory === "individual";
}

// ============================================
// FORMAT HELPERS
// ============================================

export const FORMAT_DISPLAY_NAMES: Record<TeamMatchFormat, string> = {
  swaythling_format: "Swaythling Cup (Best of 5)",
  single_double_single: "Single-Double-Single",
  five_singles_full: "Extended Format (5 Singles)",
  three_singles: "Three Singles",
};

export const FORMAT_REQUIREMENTS: Record<TeamMatchFormat, { 
  team1: string[]; 
  team2: string[];
  minPlayers: number;
}> = {
  swaythling_format: { 
    team1: ["A", "B", "C"], 
    team2: ["X", "Y", "Z"],
    minPlayers: 3
  },
  single_double_single: { 
    team1: ["A", "B"], 
    team2: ["X", "Y"],
    minPlayers: 2
  },
  five_singles_full: { 
    team1: ["A", "B", "C", "D", "E"], 
    team2: ["X", "Y", "Z", "P", "Q"],
    minPlayers: 5
  },
  three_singles: { 
    team1: ["A", "B", "C"], 
    team2: ["X", "Y", "Z"],
    minPlayers: 3
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