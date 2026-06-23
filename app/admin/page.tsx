"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { formatGeneratedAt } from "@/components/admin/adminMetrics";
import { SectionLabel } from "@/components/landing/Section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOverviewResponse } from "@/types/admin";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-72 max-w-full rounded-lg bg-white/10" />
        <Skeleton className="h-4 w-48 rounded-lg bg-white/10" />
      </div>
      <Skeleton className="h-24 rounded-2xl bg-white/10" />
      <Skeleton className="h-11 w-full max-w-md rounded-full bg-white/10" />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl bg-white/10" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl bg-white/10" />
    </div>
  );
}

function AdminDashboardContent() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axiosInstance.get<AdminOverviewResponse>("admin/overview");
      setData(res.data);
      setError(null);
      setForbidden(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setForbidden(true);
      } else if (status === 401) {
        window.location.href = "/admin/login?next=/admin";
      } else {
        setError("Failed to load dashboard data. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (forbidden) {
    return (
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:mt-16 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <ShieldAlert className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--lp-text)]">
              Access denied
            </h1>
            <p className="text-sm text-[var(--lp-text-muted)]">Platform admin only</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-[var(--lp-text-muted)]">
          Your account is not on the platform admin allowlist. Add your email to{" "}
          <code className="rounded bg-[var(--lp-bg)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--lp-accent)]">
            ADMIN_EMAILS
          </code>{" "}
          in the server environment, then sign in again.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-6 rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-text)] hover:bg-white/5"
        >
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:mt-16 sm:p-8">
        <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--lp-text)]">
          Could not load dashboard
        </h1>
        <p className="mt-3 text-sm text-[var(--lp-text-muted)]">{error ?? "Unknown error"}</p>
        <Button
          className="mt-6 rounded-full bg-[var(--lp-accent)] text-[var(--lp-bg)] hover:bg-[var(--lp-accent-hover)]"
          onClick={() => fetchOverview()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] px-5 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,77,41,0.12),transparent)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Platform console</SectionLabel>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-[var(--lp-text)] text-balance sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--lp-text-muted)]">
              Last updated{" "}
              <time dateTime={data.generatedAt}>{formatGeneratedAt(data.generatedAt)}</time>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            className="shrink-0 rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-text)] hover:bg-white/5"
          >
            <RefreshCw
              className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing…" : "Refresh data"}
          </Button>
        </div>
      </header>

      <AdminDashboard data={data} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
