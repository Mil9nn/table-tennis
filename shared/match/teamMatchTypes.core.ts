/**
 * Mobile-safe team match types and constants.
 * No mongoose or backend-only type imports.
 */

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

export interface TeamServerConfig {
  firstServer?: TeamServerKey | null;
  firstReceiver?: TeamServerKey | null;
  serverOrder?: TeamServerKey[];
}

export interface TeamGame {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
  winnerSide?: TeamWinnerSide;
  completed: boolean;
  duration?: number;
  startTime?: Date | string;
  endTime?: Date | string;
}

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
