"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import React from "react";

type StatusSummary = {
  total: number;
  upcoming: number;
  in_progress: number;
  completed: number;
};

export function HeaderHero({ summary }: { summary: StatusSummary }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              All Tournaments
            </h1>
            <p className="max-w-prose text-white/80 text-sm md:text-base">
              Browse and create new tournaments
            </p>
          </div>

          <Button
            asChild
            variant="secondary"
            className="
              bg-white text-zinc-900 hover:bg-white/90
              transition-all duration-200
              hover:scale-[1.02]
              active:scale-[0.97]
              active:ring-2 active:ring-zinc-300 active:ring-offset-2 active:ring-offset-white
            "
          >
            <Link
              href="/tournaments/create"
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Tournament
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-xs md:grid-cols-4 md:text-sm">
          <StatPill
            label="Total"
            value={summary.total}
            className="bg-white/10"
          />
          <StatPill
            label="Upcoming"
            value={summary.upcoming}
            className="bg-orange-400/20"
          />
          <StatPill
            label="In Progress"
            value={summary.in_progress}
            className="bg-blue-400/20"
          />
          <StatPill
            label="Completed"
            value={summary.completed}
            className="bg-emerald-400/20"
          />
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`
        inline-flex items-center justify-center gap-4
        rounded-full px-5 py-2 
        bg-white/10 backdrop-blur-sm
        ring-1 ring-white/20 shadow-sm
        ${className ?? ""}
      `}
    >
      <span className="text-xs font-medium text-white/60 leading-none">
        {label}:
      </span>
      <span className="text-base font-semibold text-white leading-none">
        {value}
      </span>
    </div>
  );
}

export default HeaderHero;
