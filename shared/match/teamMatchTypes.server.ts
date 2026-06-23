/**
 * Backend-only team match types (mongoose, Shot, populated shapes).
 */

import { Types } from "mongoose";
import type {
  TeamMatchFormat,
  TeamMatchSnapshot,
  TeamMatchStatus,
  TeamParticipant,
  TeamServerConfig,
  TeamSubMatchBase,
  TeamWinnerSide,
} from "./teamMatchTypes.core";

export interface TeamSubMatch extends TeamSubMatchBase {
  _id?: Types.ObjectId | string;
}

export interface TeamSubMatchPopulated extends Omit<TeamSubMatch, "playerTeam1" | "playerTeam2"> {
  playerTeam1: TeamParticipant[];
  playerTeam2: TeamParticipant[];
}

export interface TeamMatchSnapshotPopulated extends Omit<TeamMatchSnapshot, "captain" | "players"> {
  captain?: TeamParticipant;
  players: Array<{
    _id?: string;
    user: TeamParticipant;
    role?: "player" | "captain";
    joinedDate?: Date;
  }>;
}

export interface TeamMatchFinalScore {
  team1Matches: number;
  team2Matches: number;
}

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

export interface TeamMatchDocument extends TeamMatchBase {
  _id: string;
}

export interface TeamMatchPopulated extends Omit<TeamMatchDocument, "team1" | "team2" | "subMatches" | "scorer"> {
  team1: TeamMatchSnapshotPopulated;
  team2: TeamMatchSnapshotPopulated;
  subMatches: TeamSubMatchPopulated[];
  scorer?: TeamParticipant;
}

export interface CreateTeamMatchDTO {
  tournament?: string;
  matchFormat: TeamMatchFormat;
  numberOfGamesPerRubber: number;
  numberOfSubMatches?: number;
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
