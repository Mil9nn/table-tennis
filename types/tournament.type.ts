// types/tournament.type.ts
import { KnockoutBracket, KnockoutConfig } from "./tournamentDraw";
import { KnockoutStatistics } from "./knockoutStatistics.type";

// ============================================
// Participant Types (Users and Teams)
// ============================================

/**
 * Individual participant (User)
 */
export interface UserParticipant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

/**
 * Team player info
 */
export interface TeamPlayer {
  user: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  role?: "captain" | "player";
  joinedDate?: Date;
  assignment?: string;
}

/**
 * Team participant
 */
export interface TeamParticipant {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  players?: TeamPlayer[];
}

/**
 * Union type for participants - can be either User or Team
 * Use helper functions to determine type
 */
export type Participant = UserParticipant | TeamParticipant;
export type ParticipantRef = Participant | string;

/**
 * Type guard to check if participant is a team
 */
export function isTeamParticipant(participant: Participant | any): participant is TeamParticipant {
  if (!participant || typeof participant !== 'object') {
    return false;
  }
  return 'name' in participant && !('username' in participant);
}

/**
 * Type guard to check if participant is a user
 */
export function isUserParticipant(participant: Participant | any): participant is UserParticipant {
  if (!participant || typeof participant !== 'object') {
    return false;
  }
  return 'username' in participant;
}

/**
 * Get display name for any participant type
 */
export function getParticipantDisplayName(participant: Participant | null | undefined | any): string {
  if (!participant) return "TBD";
  if (typeof participant !== 'object') return "Unknown";
  if (isTeamParticipant(participant)) {
    return participant.name || "Unknown Team";
  }
  return participant.fullName || participant.username || "Unknown";
}

/**
 * Get avatar/logo URL for any participant type
 */
export function getParticipantImage(participant: Participant | null | undefined | any): string | undefined {
  if (!participant || typeof participant !== 'object') return undefined;
  if (isTeamParticipant(participant)) {
    return participant.logo;
  }
  return participant.profileImage;
}

/**
 * Get link path for participant (profile or team page)
 */
export function getParticipantLink(participant: Participant, category: "individual" | "team"): string {
  if (category === "team" || isTeamParticipant(participant)) {
    return `/teams/${participant._id}`;
  }
  return `/profile/${participant._id}`;
}

// ============================================
// Doubles Pair (for doubles tournaments)
// ============================================

/**
 * Represents a doubles pair in a tournament
 * Used for knockout brackets where pairs compete against each other
 */
export interface DoublesPair {
  _id: string; // Unique pair ID
  player1: UserParticipant; // First player in the pair
  player2: UserParticipant; // Second player in the pair
}

/**
 * Get display name for a doubles pair
 */
export function getDoublesPairDisplayName(pair: DoublesPair | null | undefined): string {
  if (!pair) return "TBD";
  const p1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
  const p2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
  return `${p1Name} & ${p2Name}`;
}

// ============================================
// Team Config (for team tournaments)
// ============================================

export interface TeamConfig {
  matchFormat: "five_singles" | "single_double_single" | "custom";
  setsPerSubMatch: number;
  customSubMatches?: {
    matchNumber: number;
    matchType: "singles" | "doubles";
  }[];
}

// ============================================
// Tournament Interface
// ============================================

export interface Tournament {
  _id: string;
  name: string;
  format: "round_robin" | "knockout" | "hybrid";
  category: "individual" | "team";
  matchType: "singles" | "doubles";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";

  participants: Participant[];
  organizer: UserParticipant; // Organizer is always a user (admin)
  scorers?: UserParticipant[]; // Users who can score matches (max 10)

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

  // Doubles pairs (for doubles knockout with custom matching)
  doublesPairs?: DoublesPair[];

  // Team tournament specific
  teamConfig?: TeamConfig;

  // Hybrid format specific
  hybridConfig?: {
    roundRobinUseGroups: boolean;
    roundRobinNumberOfGroups?: number;
    qualificationMethod: "top_n_per_group";
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
  drawGeneratedBy?: UserParticipant;

  // Participant registration
  joinCode?: string;
  allowJoinByCode?: boolean;
  registrationDeadline?: Date;

  venue: string;
  city: string;
  maxParticipants?: number;
  minParticipants?: number;

  // Knockout tournament statistics (cached on completion)
  knockoutStatistics?: KnockoutStatistics;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Supporting Interfaces
// ============================================

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
  participant: ParticipantRef;
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
  // Team-specific fields
  subMatchesWon?: number;
  subMatchesLost?: number;
  playerStats?: TeamPlayerStats[];
}

export interface TeamPlayerStats {
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  subMatchesPlayed: number;
  subMatchesWon: number;
  winRate: number;
}
