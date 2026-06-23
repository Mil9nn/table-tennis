export interface PlayerStats {
  rank: number;
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    pointsScored?: number;
    pointsConceded?: number;
    totalPointsScored?: number; // From aggregation pipeline
    totalPointsConceded?: number; // From aggregation pipeline
    currentStreak: number;
    bestStreak: number;
  };
}

export interface FormatSpecificStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  points: {
    totalScored: number;
    totalConceded: number;
    differential: number;
    avgPerSet: number;
    avgConcededPerSet: number;
  };
  serve: {
    totalServes: number;
    pointsWonOnServe: number;
    serveWinPercentage: number;
  };
  distribution: {
    individual: number;
    team: number;
    tournament: number;
  };
  recentMatches: Array<{
    matchId: string;
    opponent: string;
    result: 'win' | 'loss';
    score: string;
    pointsScored: number;
    pointsConceded: number;
    date: Date;
    source: 'individual' | 'team' | 'tournament';
  }>;
}

export interface TeamStats {
  rank: number;
  team: {
    _id: string;
    name: string;
    logo?: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    subMatchesWon: number;
    subMatchesLost: number;
    currentStreak: number;
  };
  playerStats: Array<{
    player: {
      _id: string;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
    subMatchesPlayed: number;
    subMatchesWon: number;
    winRate: number;
  }>;
}

export interface TournamentPlayerStats {
  rank: number;
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  stats: {
    // Tournament Participation
    tournamentsPlayed: number;
    tournamentsWon: number;
    finalsReached: number;
    semiFinalsReached: number;
    quarterFinalsReached: number;
    averageFinish: number;
    bestFinish: number;
    
    // Match Performance
    tournamentMatches: number;
    tournamentMatchWins: number;
    tournamentMatchLosses: number;
    tournamentMatchWinRate: number;
    
    // Set Performance
    tournamentSetsWon: number;
    tournamentSetsLost: number;
    tournamentSetDifferential: number;
    tournamentSetWinRate: number;
    
    // Point Performance
    tournamentPointsScored: number;
    tournamentPointsConceded: number;
    tournamentPointDifferential: number;
    avgPointsPerMatch: number;
    
    // Tournament Points (ITTF-style)
    totalTournamentPoints: number;
    
    // Recent Performance
    recentTournaments: number; // Last 30 days
  };
  tournamentHistory?: TournamentHistoryEntry[]; // For modal
}

export interface TournamentHistoryEntry {
  tournamentId: string;
  tournamentName: string;
  format: 'round_robin' | 'knockout' | 'hybrid';
  matchType: 'singles' | 'doubles';
  status: 'completed' | 'in_progress';
  finishPosition: number | null;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  startDate: Date;
  endDate?: Date;
}

export type LeaderboardType = "individual" | "teams";
