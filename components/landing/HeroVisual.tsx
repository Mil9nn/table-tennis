"use client";

import dynamic from "next/dynamic";

const HeroDashboard = dynamic(
  () => import("./HeroDashboard").then((m) => ({ default: m.HeroDashboard })),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto aspect-[4/3] w-full max-w-xl animate-pulse rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] lg:max-w-none"
        aria-hidden="true"
      />
    ),
  }
);

export function HeroVisual() {
  return <HeroDashboard />;
}
