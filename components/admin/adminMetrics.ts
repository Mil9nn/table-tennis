import type { AdminOverviewResponse, DailyCount } from "@/types/admin";

export function sumTrendLastDays(data: DailyCount[], days: number) {
  return data.slice(-days).reduce((sum, point) => sum + point.count, 0);
}

export function getLatestTrendCount(data: DailyCount[]) {
  return data[data.length - 1]?.count ?? 0;
}

export function computeAdminInsights(data: AdminOverviewResponse) {
  const { kpis, trends, featureAdoption } = data;

  const matchCompletionRate =
    kpis.totalMatches > 0
      ? Math.round((kpis.completedMatches / kpis.totalMatches) * 100)
      : 0;

  const proConversionRate =
    kpis.totalUsers > 0 ? Math.round((kpis.proUsers / kpis.totalUsers) * 100) : 0;

  const shotDataRate =
    kpis.totalMatches > 0
      ? Math.round((featureAdoption.matchesWithPointData / kpis.totalMatches) * 100)
      : 0;

  const joinByCodeRate =
    kpis.totalTournaments > 0
      ? Math.round(
          (featureAdoption.joinByCodeTournaments / kpis.totalTournaments) * 100
        )
      : 0;

  return {
    matchCompletionRate,
    proConversionRate,
    shotDataRate,
    joinByCodeRate,
    signups7d: sumTrendLastDays(trends.signups, 7),
    signupsToday: getLatestTrendCount(trends.signups),
    tournaments7d: sumTrendLastDays(trends.tournamentsCreated, 7),
    matchesCompleted7d: sumTrendLastDays(trends.matchesCompleted, 7),
    revenuePerPro:
      kpis.proUsers > 0 ? Math.round(kpis.revenueAllTime / kpis.proUsers) : 0,
    userGrowthVelocity:
      kpis.newUsers30d > 0
        ? Math.round((kpis.newUsers7d / kpis.newUsers30d) * 100)
        : 0,
  };
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatGeneratedAt(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
