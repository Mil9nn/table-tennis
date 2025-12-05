// types/tournament.type.ts
import { KnockoutBracket, KnockoutConfig } from "./tournamentDraw";

export interface Tournament {
  _id: string;
  name: string;
  format: "round_robin" | "knockout" | "hybrid";
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

  // Groups/Pools (for round robin)
  useGroups: boolean;
  numberOfGroups?: number;
  groups?: Group[];
  advancePerGroup?: number;

  // Knockout specific
  knockoutConfig?: KnockoutConfig;
  bracket?: KnockoutBracket;

  // Hybrid format specific
  hybridConfig?: {
    roundRobinUseGroups: boolean;
    roundRobinNumberOfGroups?: number;
    qualificationMethod: "top_n_overall" | "top_n_per_group" | "percentage";
    qualifyingCount?: number;
    qualifyingPercentage?: number;
    qualifyingPerGroup?: number;
    knockoutAllowCustomMatching: boolean;
    knockoutThirdPlaceMatch: boolean;
  };
  currentPhase?: "round_robin" | "knockout" | "transition";
  phaseTransitionDate?: Date;
  qualifiedParticipants?: Participant[];

  rounds: Round[];
  standings: Standing[];

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
