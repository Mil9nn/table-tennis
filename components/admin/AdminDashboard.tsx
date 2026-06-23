"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KpiCard } from "@/components/admin/KpiCard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import {
  computeAdminInsights,
  formatInr,
} from "@/components/admin/adminMetrics";
import {
  BreakdownBarChart,
  BreakdownPieChart,
  OverviewTrends,
} from "@/components/admin/OverviewCharts";
import { SectionLabel } from "@/components/landing/Section";
import { cn } from "@/lib/utils";
import type { AdminOverviewResponse } from "@/types/admin";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  Crown,
  Radio,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users2,
  UsersRound,
  Zap,
} from "lucide-react";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "tournaments", label: "Tournaments" },
  { value: "matches", label: "Matches" },
  { value: "revenue", label: "Revenue" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--lp-live)] opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-[var(--lp-live)]" />
    </span>
  );
}

function FunnelStep({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-[var(--lp-text-muted)]">{label}</span>
        <span className="font-medium tabular-nums text-[var(--lp-text)]">
          {value.toLocaleString()}{" "}
          <span className="text-[var(--lp-text-muted)]">({percent}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg)]/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--lp-text-muted)]">{title}</p>
          <p className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tabular-nums text-[var(--lp-text)]">
            {value}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--lp-text-muted)]">{detail}</p>
        </div>
        <Icon className="size-4 shrink-0 text-[var(--lp-accent)]" aria-hidden="true" />
      </div>
    </div>
  );
}

export function AdminDashboard({ data }: { data: AdminOverviewResponse }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabValue) || "overview";

  const setTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const { kpis, featureAdoption, revenue, topCities } = data;
  const insights = useMemo(() => computeAdminInsights(data), [data]);

  const topCity = topCities[0];

  return (
    <div className="space-y-8">
      <div
        aria-label="Platform pulse"
        className="overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)]/80"
      >
        <div className="grid divide-y divide-[var(--lp-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <PulseItem
            icon={Radio}
            label="Live matches"
            value={kpis.inProgressMatches}
            live={kpis.inProgressMatches > 0}
            detail={`${kpis.completedMatches.toLocaleString()} completed total`}
          />
          <PulseItem
            icon={Users2}
            label="Signups (7d)"
            value={insights.signups7d}
            detail={`${insights.signupsToday} today · +${kpis.newUsers30d} (30d)`}
          />
          <PulseItem
            icon={Trophy}
            label="Tournaments (7d)"
            value={insights.tournaments7d}
            detail={`${kpis.totalTournaments.toLocaleString()} all time`}
          />
          <PulseItem
            icon={CreditCard}
            label="Revenue (30d)"
            value={formatInr(kpis.revenue30d)}
            detail={`${formatInr(kpis.revenueAllTime)} lifetime`}
            isText
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="inline-flex min-w-full gap-1 rounded-full border border-[var(--lp-border)] bg-[var(--lp-surface)] p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setTab(tab.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-bg)]",
                activeTab === tab.value
                  ? "bg-[var(--lp-accent)] text-[var(--lp-bg)]"
                  : "text-[var(--lp-text-muted)] hover:bg-white/5 hover:text-[var(--lp-text)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div role="tabpanel" className="space-y-8">
          <section aria-labelledby="kpi-heading">
            <SectionLabel>Key metrics</SectionLabel>
            <h2
              id="kpi-heading"
              className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-[var(--lp-text)] text-balance sm:text-3xl"
            >
              Platform at a glance
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <KpiCard
                label="Total users"
                value={kpis.totalUsers}
                subtext={`+${kpis.newUsers7d} (7d) · +${kpis.newUsers30d} (30d)`}
                icon={Users2}
                accent="accent"
              />
              <KpiCard
                label="Email verified"
                value={`${kpis.verifiedPercent}%`}
                subtext={`${kpis.verifiedUsers} users`}
                icon={BadgeCheck}
                accent="live"
              />
              <KpiCard
                label="Profile complete"
                value={`${kpis.profileCompletePercent}%`}
                subtext={`${kpis.profileCompleteUsers} users`}
                icon={Target}
                accent="muted"
              />
              <KpiCard label="Teams" value={kpis.totalTeams} icon={UsersRound} accent="muted" />
              <KpiCard
                label="Tournaments"
                value={kpis.totalTournaments}
                icon={Trophy}
                accent="accent"
              />
              <KpiCard
                label="Matches"
                value={kpis.totalMatches}
                subtext={`${kpis.completedMatches} completed · ${kpis.inProgressMatches} live`}
                icon={Swords}
                accent="live"
                highlight={kpis.inProgressMatches > 0}
              />
              <KpiCard
                label="Pro subscribers"
                value={kpis.proUsers}
                subtext={`${kpis.freeUsers} free tier`}
                icon={Crown}
                accent="warning"
              />
              <KpiCard
                label="Revenue (30d)"
                value={formatInr(kpis.revenue30d)}
                subtext={`${formatInr(kpis.revenueAllTime)} all time`}
                icon={CreditCard}
                accent="live"
              />
            </div>
          </section>

          <section aria-labelledby="trends-heading">
            <SectionLabel>Activity</SectionLabel>
            <h2
              id="trends-heading"
              className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-[var(--lp-text)] text-balance sm:text-3xl"
            >
              30-day trends
            </h2>
            <div className="mt-6">
              <OverviewTrends trends={data.trends} />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminPanel title="User conversion funnel" icon={TrendingUp}>
              <div className="space-y-5">
                <FunnelStep
                  label="Email verified"
                  value={kpis.verifiedUsers}
                  percent={kpis.verifiedPercent}
                  color="#00d4aa"
                />
                <FunnelStep
                  label="Profile complete"
                  value={kpis.profileCompleteUsers}
                  percent={kpis.profileCompletePercent}
                  color="#ff4d29"
                />
                <FunnelStep
                  label="Pro subscribers"
                  value={kpis.proUsers}
                  percent={insights.proConversionRate}
                  color="#FF8A65"
                />
              </div>
            </AdminPanel>

            <AdminPanel title="Quick insights" icon={Sparkles}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InsightCard
                  title="Match completion rate"
                  value={`${insights.matchCompletionRate}%`}
                  detail={`${kpis.completedMatches.toLocaleString()} of ${kpis.totalMatches.toLocaleString()} matches finished`}
                  icon={Swords}
                />
                <InsightCard
                  title="Shot data adoption"
                  value={`${insights.shotDataRate}%`}
                  detail={`${featureAdoption.matchesWithPointData.toLocaleString()} matches tracked`}
                  icon={Zap}
                />
                <InsightCard
                  title="Join-by-code tournaments"
                  value={`${insights.joinByCodeRate}%`}
                  detail={`${featureAdoption.joinByCodeTournaments.toLocaleString()} of ${kpis.totalTournaments.toLocaleString()} tournaments`}
                  icon={ArrowUpRight}
                />
                <InsightCard
                  title="Avg revenue per Pro"
                  value={formatInr(insights.revenuePerPro)}
                  detail={`${kpis.proUsers.toLocaleString()} paying subscribers`}
                  icon={Crown}
                />
              </div>
              {topCity ? (
                <p className="mt-4 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-bg)]/40 px-3 py-2 text-xs text-[var(--lp-text-muted)]">
                  Top city:{" "}
                  <span className="font-medium text-[var(--lp-text)]">
                    {topCity.key}
                  </span>{" "}
                  · {topCity.count.toLocaleString()} tournaments
                </p>
              ) : null}
            </AdminPanel>
          </div>

          <AdminPanel title="Feature adoption" icon={Activity}>
            <div className="grid gap-3 sm:grid-cols-3">
              <FeatureStat
                label="Join-by-code tournaments"
                value={featureAdoption.joinByCodeTournaments}
                total={kpis.totalTournaments}
              />
              <FeatureStat
                label="Matches with shot data"
                value={featureAdoption.matchesWithPointData}
                total={kpis.totalMatches}
              />
              <FeatureStat
                label="Users (detailed shot mode)"
                value={featureAdoption.usersDetailedShotTracking}
                total={kpis.totalUsers}
              />
            </div>
          </AdminPanel>
        </div>
      )}

      {activeTab === "tournaments" && (
        <div role="tabpanel" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BreakdownPieChart title="By format" data={data.tournaments.byFormat} />
            <BreakdownPieChart title="By category" data={data.tournaments.byCategory} />
            <BreakdownPieChart title="By status" data={data.tournaments.byStatus} />
          </div>
          <BreakdownBarChart title="Top cities" data={topCities} />
        </div>
      )}

      {activeTab === "matches" && (
        <div role="tabpanel" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <KpiCard
              label="Total matches"
              value={kpis.totalMatches}
              icon={Swords}
              accent="accent"
            />
            <KpiCard
              label="Completed"
              value={kpis.completedMatches}
              subtext={`${insights.matchCompletionRate}% completion rate`}
              icon={BadgeCheck}
              accent="live"
            />
            <KpiCard
              label="Live now"
              value={kpis.inProgressMatches}
              icon={Radio}
              accent="live"
              highlight={kpis.inProgressMatches > 0}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BreakdownPieChart title="By status" data={data.matches.byStatus} />
            <BreakdownPieChart title="By category" data={data.matches.byCategory} />
            <BreakdownPieChart title="Tournament vs friendly" data={data.matches.byContext} />
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div role="tabpanel" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <KpiCard
              label="Succeeded payments"
              value={revenue.succeededCount}
              icon={CreditCard}
              accent="accent"
            />
            <KpiCard
              label="Total revenue"
              value={formatInr(revenue.totalAmountSucceeded)}
              icon={CreditCard}
              accent="live"
            />
            <KpiCard
              label="Revenue (30d)"
              value={formatInr(revenue.amount30d)}
              icon={Activity}
              accent="muted"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownBarChart title="Payments by status" data={revenue.byStatus} />
            <AdminPanel title="Revenue breakdown" icon={CreditCard}>
              <dl className="space-y-4">
                <RevenueRow label="Lifetime revenue" value={formatInr(kpis.revenueAllTime)} />
                <RevenueRow label="Last 30 days" value={formatInr(kpis.revenue30d)} />
                <RevenueRow
                  label="Avg per Pro user"
                  value={formatInr(insights.revenuePerPro)}
                />
                <RevenueRow
                  label="Pro conversion"
                  value={`${insights.proConversionRate}%`}
                  muted={`${kpis.proUsers} of ${kpis.totalUsers} users`}
                />
              </dl>
            </AdminPanel>
          </div>
        </div>
      )}
    </div>
  );
}

function PulseItem({
  icon: Icon,
  label,
  value,
  detail,
  live = false,
  isText = false,
}: {
  icon: typeof Radio;
  label: string;
  value: number | string;
  detail: string;
  live?: boolean;
  isText?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-accent)]/15 text-[var(--lp-accent)]">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-text-muted)]">
          {label}
          {live ? <LiveDot /> : null}
        </p>
        <p
          className={cn(
            "mt-0.5 font-[family-name:var(--font-syne)] font-bold tabular-nums text-[var(--lp-text)]",
            isText ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          )}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 text-xs text-[var(--lp-text-muted)]">{detail}</p>
      </div>
    </div>
  );
}

function FeatureStat({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg)]/40 p-4">
      <p className="text-xs text-[var(--lp-text-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold tabular-nums text-[var(--lp-text)]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-[var(--lp-text-muted)]">
        {percent}% of {total.toLocaleString()}
      </p>
    </div>
  );
}

function RevenueRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--lp-border)] pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-[var(--lp-text-muted)]">{label}</dt>
      <dd className="text-right">
        <span className="font-[family-name:var(--font-syne)] font-bold tabular-nums text-[var(--lp-text)]">
          {value}
        </span>
        {muted ? (
          <p className="mt-0.5 text-xs text-[var(--lp-text-muted)]">{muted}</p>
        ) : null}
      </dd>
    </div>
  );
}
