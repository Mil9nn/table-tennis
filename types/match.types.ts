// types/match.types.ts

export interface Venue {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface Player {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
}

export interface Team {
  teamName?: string;
  players: Player[];
  captain?: Player;
}

export type MatchCategory = 'individual' | 'team';
export type TeamFormat = 'format1' | 'format2' | 'format3';
export type MatchType = 'singles' | 'doubles';

export interface TeamFormatConfig {
  id: TeamFormat;
  name: string;
  description: string;
  matches: {
    matchNumber: number;
    type: MatchType;
    team1Players: number; // number of players from team 1
    team2Players: number; // number of players from team 2
    description: string;
  }[];
}

export const TEAM_FORMATS: TeamFormatConfig[] = [
  {
    id: 'format1',
    name: 'A,B,C,A,B vs X,Y,Z,Y,X',
    description: '5 Singles Matches',
    matches: [
      { matchNumber: 1, type: 'singles', team1Players: 1, team2Players: 1, description: 'A vs X' },
      { matchNumber: 2, type: 'singles', team1Players: 1, team2Players: 1, description: 'B vs Y' },
      { matchNumber: 3, type: 'singles', team1Players: 1, team2Players: 1, description: 'C vs Z' },
      { matchNumber: 4, type: 'singles', team1Players: 1, team2Players: 1, description: 'A vs Y' },
      { matchNumber: 5, type: 'singles', team1Players: 1, team2Players: 1, description: 'B vs X' },
    ]
  },
  {
    id: 'format2',
    name: 'A, AB, B vs X, XY, Y',
    description: 'Single-Double-Single',
    matches: [
      { matchNumber: 1, type: 'singles', team1Players: 1, team2Players: 1, description: 'A vs X' },
      { matchNumber: 2, type: 'doubles', team1Players: 2, team2Players: 2, description: 'AB vs XY' },
      { matchNumber: 3, type: 'singles', team1Players: 1, team2Players: 1, description: 'B vs Y' },
    ]
  },
  {
    id: 'format3',
    name: 'A, B, C vs X, Y, Z',
    description: '3 Singles Matches Only',
    matches: [
      { matchNumber: 1, type: 'singles', team1Players: 1, team2Players: 1, description: 'A vs X' },
      { matchNumber: 2, type: 'singles', team1Players: 1, team2Players: 1, description: 'B vs Y' },
      { matchNumber: 3, type: 'singles', team1Players: 1, team2Players: 1, description: 'C vs Z' },
    ]
  }
];

export interface MatchCreationForm {
  // Basic info
  matchCategory: MatchCategory;
  
  // Individual match fields
  matchType?: MatchType; // singles/doubles for individual matches
  player1?: string;
  player2?: string;
  player3?: string; // for doubles
  player4?: string; // for doubles
  
  // Team match fields
  teamFormat?: TeamFormat;
  team1Name?: string;
  team1Players?: string[];
  team1Captain?: string;
  team2Name?: string;
  team2Players?: string[];
  team2Captain?: string;
  
  // Common fields
  bestOf: number;
  venue?: Venue;
  scorer: string;
}

export interface SubMatch {
  subMatchNumber: number;
  matchType: MatchType;
  player1: string;
  player2: string;
  player3?: string;
  player4?: string;
  winner?: string;
  status: 'pending' | 'in-progress' | 'completed';
  games: any[]; // Will be populated during play
  startTime?: number;
  endTime?: number;
}

export interface EnhancedMatch {
  matchId: string;
  matchCategory: MatchCategory;
  
  // Individual match fields
  player1?: string;
  player2?: string;
  player3?: string;
  player4?: string;
  
  // Team match fields
  team1?: Team;
  team2?: Team;
  teamFormat?: TeamFormat;
  subMatches?: SubMatch[];
  
  // Common fields
  winner?: string;
  bestOf: number;
  venue?: Venue;
  scorer: string;
  
  startTime: number;
  endTime?: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Legacy for individual matches
  games?: any[];
  
  createdAt: Date;
  updatedAt: Date;
}