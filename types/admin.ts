export interface DailyCount {
  date: string;
  count: number;
}

export interface CountByKey {
  key: string;
  count: number;
}

export interface AdminOverviewKpis {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  verifiedUsers: number;
  verifiedPercent: number;
  profileCompleteUsers: number;
  profileCompletePercent: number;
  totalTournaments: number;
  totalMatches: number;
  completedMatches: number;
  inProgressMatches: number;
  totalTeams: number;
  proUsers: number;
  freeUsers: number;
  revenueAllTime: number;
  revenue30d: number;
}

export interface AdminFeatureAdoption {
  joinByCodeTournaments: number;
  matchesWithPointData: number;
  usersDetailedShotTracking: number;
}

export interface AdminRevenueSummary {
  byStatus: CountByKey[];
  succeededCount: number;
  totalAmountSucceeded: number;
  amount30d: number;
}

export interface AdminOverviewResponse {
  generatedAt: string;
  kpis: AdminOverviewKpis;
  trends: {
    signups: DailyCount[];
    tournamentsCreated: DailyCount[];
    matchesCompleted: DailyCount[];
  };
  tournaments: {
    byStatus: CountByKey[];
    byFormat: CountByKey[];
    byCategory: CountByKey[];
  };
  matches: {
    byStatus: CountByKey[];
    byCategory: CountByKey[];
    byContext: CountByKey[];
  };
  revenue: AdminRevenueSummary;
  topCities: CountByKey[];
  featureAdoption: AdminFeatureAdoption;
}

export interface AdminMeResponse {
  isAdmin: true;
  userId: string;
  email: string;
  username: string;
}
