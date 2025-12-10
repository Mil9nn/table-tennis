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
    tournamentsPlayed: number;
    tournamentsWon: number;
    finalsReached: number;
    semiFinalsReached: number;
    tournamentMatches: number;
    tournamentMatchWins: number;
    tournamentMatchLosses: number;
    tournamentMatchWinRate: number;
    totalPoints: number;
  };
}

export type LeaderboardType = "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";
