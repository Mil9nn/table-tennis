export type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type MatchType = "singles" | "doubles" | "mixed_doubles";
export type MatchCategory = "individual" | "team";
export type WinnerSide = "side1" | "side2" | null;

export interface Participant {
  _id: string;
  username: string;
  fullName?: string; 
}

export interface Shot {
  _id: string;
  player: Participant;
  side: "forehand" | "backhand";
  shotType?: string | null;
  result: "winner" | "error";
}

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
  matchType: MatchType;
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
  winnerSide?: WinnerSide;
  matchDuration?: number;
  createdAt?: string;
  updatedAt?: string;
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
  matchType: MatchType;
  numberOfSets: number;
  setsPerTie?: number;
  participants: Participant[];
  team1: Team | null;
  team2: Team | null;
  games: TeamGame[];
  ties?: any[];
  finalScore: {
    side1Sets: number;
    side2Sets: number;
    side1Ties?: number;
    side2Ties?: number;
  };
  winner?: WinnerSide;
  createdAt?: string;
  updatedAt?: string;
}

// Normalized Frontend Type
export type NormalizedMatch = IndividualMatch | TeamMatch;

// Helpers for Scoreboard
export interface AddPointPayload {
  side: "side1" | "side2";
  playerId?: string;
}

export type OnAddPoint = (payload: AddPointPayload) => void;