import { subDays, startOfDay } from "date-fns";
import type { Model } from "mongoose";
import { User } from "@/models/User";
import Tournament from "@/models/Tournament";
import Match from "@/models/MatchBase";
import Team from "@/models/Team";
import { Payment } from "@/models/Payment";
import MatchPoint from "@/models/MatchPoint";
import type {
  AdminOverviewResponse,
  CountByKey,
  DailyCount,
} from "@/types/admin";
import { normalizeCityName } from "@/lib/normalizeCity";

const TREND_DAYS = 30;

function toCountByKey(
  rows: { _id: string | null; count: number }[]
): CountByKey[] {
  return rows
    .filter((r) => r._id != null)
    .map((r) => ({ key: String(r._id), count: r.count }))
    .sort((a, b) => b.count - a.count);
}

function toCountByKeyFromNormalizedCity(
  rows: { _id: string | null; count: number }[]
): CountByKey[] {
  return rows
    .filter((r) => r._id != null && String(r._id).trim() !== "")
    .map((r) => ({
      key: normalizeCityName(String(r._id)),
      count: r.count,
    }))
    .sort((a, b) => b.count - a.count);
}

function fillDailyTrend(
  rows: { _id: string; count: number }[],
  since: Date
): DailyCount[] {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  const result: DailyCount[] = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = startOfDay(subDays(new Date(), TREND_DAYS - 1 - i));
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

async function groupCount(
  model: Model<unknown>,
  field: string,
  match: object = {}
): Promise<CountByKey[]> {
  const rows = await model.aggregate<{ _id: string | null; count: number }>([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return toCountByKey(rows);
}

async function dailyTrend(
  model: Model<unknown>,
  since: Date,
  match: object = {},
  dateField = "createdAt"
): Promise<DailyCount[]> {
  const rows = await model.aggregate<{ _id: string; count: number }>([
    { $match: { ...match, [dateField]: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return fillDailyTrend(rows, since);
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const now = new Date();
  const since7d = subDays(now, 7);
  const since30d = subDays(now, 30);
  const trendSince = startOfDay(subDays(now, TREND_DAYS - 1));

  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    verifiedUsers,
    profileCompleteUsers,
    proUsers,
    usersDetailedShotTracking,
    totalTournaments,
    totalMatches,
    completedMatches,
    inProgressMatches,
    totalTeams,
    joinByCodeTournaments,
    matchesWithPointData,
    revenueAllTimeAgg,
    revenue30dAgg,
    paymentByStatus,
    succeededPaymentCount,
    topCities,
    tournamentsByStatus,
    tournamentsByFormat,
    tournamentsByCategory,
    matchesByStatus,
    matchesByCategory,
    matchesByContext,
    signupsTrend,
    tournamentsTrend,
    matchesCompletedTrend,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since7d } }),
    User.countDocuments({ createdAt: { $gte: since30d } }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ isProfileComplete: true }),
    User.countDocuments({ subscriptionTier: "pro", subscriptionStatus: "active" }),
    User.countDocuments({ shotTrackingMode: "detailed" }),
    Tournament.countDocuments(),
    Match.countDocuments(),
    Match.countDocuments({ status: "completed" }),
    Match.countDocuments({ status: "in_progress" }),
    Team.countDocuments(),
    Tournament.countDocuments({ allowJoinByCode: true }),
    MatchPoint.distinct("match").then((ids) => ids.length),
    Payment.aggregate([
      { $match: { status: "succeeded" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: "succeeded",
          createdAt: { $gte: since30d },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: "succeeded" }),
    Tournament.aggregate([
      { $match: { city: { $exists: true, $type: "string", $ne: "" } } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$city" } } },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    groupCount(Tournament, "status"),
    groupCount(Tournament, "format"),
    groupCount(Tournament, "category"),
    groupCount(Match, "status"),
    groupCount(Match, "matchCategory"),
    Match.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$tournament", false] },
              "tournament",
              "friendly",
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]).then(toCountByKey),
    dailyTrend(User, trendSince),
    dailyTrend(Tournament, trendSince),
    dailyTrend(Match, trendSince, { status: "completed" }, "updatedAt"),
  ]);

  const revenueAllTime = revenueAllTimeAgg[0]?.total ?? 0;
  const revenue30d = revenue30dAgg[0]?.total ?? 0;
  const freeUsersCount = Math.max(0, totalUsers - proUsers);

  return {
    generatedAt: now.toISOString(),
    kpis: {
      totalUsers,
      newUsers7d,
      newUsers30d,
      verifiedUsers,
      verifiedPercent:
        totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      profileCompleteUsers,
      profileCompletePercent:
        totalUsers > 0
          ? Math.round((profileCompleteUsers / totalUsers) * 100)
          : 0,
      totalTournaments,
      totalMatches,
      completedMatches,
      inProgressMatches,
      totalTeams,
      proUsers,
      freeUsers: freeUsersCount,
      revenueAllTime,
      revenue30d,
    },
    trends: {
      signups: signupsTrend,
      tournamentsCreated: tournamentsTrend,
      matchesCompleted: matchesCompletedTrend,
    },
    tournaments: {
      byStatus: tournamentsByStatus,
      byFormat: tournamentsByFormat,
      byCategory: tournamentsByCategory,
    },
    matches: {
      byStatus: matchesByStatus,
      byCategory: matchesByCategory,
      byContext: matchesByContext,
    },
    revenue: {
      byStatus: toCountByKey(paymentByStatus),
      succeededCount: succeededPaymentCount,
      totalAmountSucceeded: revenueAllTime,
      amount30d: revenue30d,
    },
    topCities: toCountByKeyFromNormalizedCity(topCities),
    featureAdoption: {
      joinByCodeTournaments,
      matchesWithPointData,
      usersDetailedShotTracking,
    },
  };
}
