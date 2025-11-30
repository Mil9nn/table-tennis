// types/tournament.type.ts
export interface Tournament {
  _id: string;
  name: string;
  format: "round_robin" | "knockout" | "multi_stage";
  category: "individual" | "team";
  matchType: "singles" | "doubles" | "mixed_doubles";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";

  participants: Participant[];
  organizer: Participant;

  // Seeding
  seeding: Seeding[];
  seedingMethod: "manual" | "ranking" | "random" | "none";

  // Groups/Pools
  useGroups: boolean;
  numberOfGroups?: number;
  groups?: Group[];
  advancePerGroup?: number;

  rounds: Round[];
  standings: Standing[];

  // Multi-stage tournament support
  isMultiStage?: boolean;
  stages?: TournamentStage[];
  currentStageNumber?: number;

  // Knockout bracket (for single-stage knockout tournaments)
  bracket?: KnockoutBracket;

  rules: {
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    setsPerMatch: number;
    pointsPerSet: number;
    advanceTop: number;
    deuceSetting: "standard" | "no_deuce";
    tiebreakRules: string[];
  };

  // Custom bracket matching (for knockout tournaments)
  customBracketMatches?: Array<{
    participant1: string;
    participant2: string;
  }>;

  drawGenerated: boolean;
  drawGeneratedAt?: Date;
  drawGeneratedBy?: Participant;

  // Participant registration
  joinCode?: string;
  allowJoinByCode?: boolean;
  registrationDeadline?: Date;

  venue?: string;
  city: string;
  maxParticipants?: number;
  minParticipants?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Seeding {
  participant: Participant;
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

export interface Group {
  groupId: string;
  groupName: string;
  participants: Participant[];
  rounds: Round[];
  standings: Standing[];
}

export interface Round {
  roundNumber: number;
  matches: string[];
  completed: boolean;
  scheduledDate?: Date;
  scheduledTime?: string;
}

export interface Standing {
  participant: Participant;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  points: number;
  rank: number;
  form: string[]; // Last 5 results: "W", "L", "D"
  headToHead?: { [opponentId: string]: number };
}

export interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

// Knockout tournament types
export interface ParticipantSlot {
  type: "direct" | "from_match" | "from_group" | "bye" | "tbd";
  participantId?: string;
  participant?: Participant;
  fromMatchPosition?: number;
  isWinnerOf?: boolean; // true = winner, false = loser
  fromGroupId?: string;
  fromGroupPosition?: number;
}

export interface BracketMatch {
  matchId?: string;
  bracketPosition: number;
  roundNumber: number;
  participant1: ParticipantSlot;
  participant2: ParticipantSlot;
  winner?: string;
  loser?: string;
  nextMatchPosition?: number;
  loserNextPosition?: number; // For consolation/double elimination
  scheduledTime?: Date;
  completed: boolean;
}

export interface KnockoutRound {
  roundNumber: number;
  name: string; // "Round of 16", "Quarter Finals", "Semi Finals", "Final"
  matches: BracketMatch[];
  completed: boolean;
  scheduledDate?: Date;
}

export interface KnockoutBracket {
  size: number; // Must be power of 2: 4, 8, 16, 32, 64, 128
  rounds: KnockoutRound[];
  consolationBracket?: boolean;
  thirdPlaceMatchPosition?: number;
}

export interface TournamentStage {
  stageNumber: number;
  name: string;
  format: "round_robin" | "knockout";
  startDate?: Date;
  endDate?: Date;
  status: "pending" | "in_progress" | "completed";

  // For round_robin stage
  groups?: Group[];

  // For knockout stage
  bracket?: KnockoutBracket;

  // Qualification rules
  qualification?: {
    fromStage: number;
    qualifyingPositions: number[]; // [1, 2] = top 2 from each group
    luckyLosers?: number; // Best 3rd place finishers
    qualifyingMethod: "position" | "points" | "custom";
  };
}