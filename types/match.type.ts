import { Shot } from "./shot.type";

export type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type MatchType = "singles" | "doubles" | "mixed_doubles";
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
  matchType: "singles" | "doubles" | "mixed_doubles";
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
  // statistics?: MatchStatistics;
  serverConfig?: InitialServerConfig | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Team Match Schema
export interface TeamPlayer {
  id?: string;
  name: string;
  role?: string;
}

export interface Team {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  players: TeamPlayer[];
  assignments: Record<string, string>;
}

export interface TeamGame {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winner?: WinnerSide;
  currentPlayers?: { side1?: string; side2?: string };
  shots?: Shot[];
}

export interface TeamMatch {
  _id: string;
  matchCategory: "team";
  matchType: TeamMatchFormat;
  numberOfSets: number;
  setsPerTie?: number;
  participants: Participant[];
  scorer?: Participant;
  city?: string;
  venue?: string;
  status?: MatchStatus;
  team1: Team | null;
  team2: Team | null;
  games: TeamGame[];
  ties?: TeamTie[];
  currentGame?: number;
  finalScore: {
    side1Sets: number;
    side2Sets: number;
    side1Ties?: number;
    side2Ties?: number;
  };
  winner?: WinnerSide;
  serverConfig?: InitialServerConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

// Normalized Frontend Type
export type NormalizedMatch = IndividualMatch | TeamMatch;

// Helpers for Scoreboard
export interface AddPointPayload {
  side: "side1" | "side2";
  playerId?: string;
}

export type OnAddPoint = (payload: AddPointPayload) => void;

// Team Match Helpers
// Add this near the top with other enums
export type TeamMatchFormat =
  | "swaythling-5"
  | "swaythling-9"
  | "sds"
  | "three-singles"
  | { customOrder: TeamTie[] };

export interface TeamTie {
  a: string;
  b: string;
  type?: "singles" | "doubles";
  result?: "side1" | "side2"; // winner side
}

export type SideKey = "sideA" | "sideB";
