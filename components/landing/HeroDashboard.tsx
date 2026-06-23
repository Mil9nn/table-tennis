"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SCORE_SEQUENCE = [
  { p1: 8, p2: 6 },
  { p1: 9, p2: 6 },
  { p1: 9, p2: 7 },
  { p1: 10, p2: 7 },
  { p1: 11, p2: 7 },
];

const BRACKET = [
  { label: "SF 1", a: "Chen", b: "Park", score: "3-1" },
  { label: "SF 2", a: "Liu", b: "Singh", score: "3-2" },
  { label: "Final", a: "Chen", b: "Liu", score: "Live" },
];

const LEADERBOARD = [
  { rank: 1, name: "Chen W.", pts: 2840, delta: "+42" },
  { rank: 2, name: "Liu M.", pts: 2715, delta: "+18" },
  { rank: 3, name: "Park J.", pts: 2590, delta: "-6" },
];

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--lp-live)] opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-[var(--lp-live)]" />
    </span>
  );
}

export function HeroDashboard() {
  const prefersReducedMotion = useReducedMotion();
  const [scoreIdx, setScoreIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(
      () => setScoreIdx((i) => (i + 1) % SCORE_SEQUENCE.length),
      2200
    );
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const score = SCORE_SEQUENCE[scoreIdx];

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,var(--lp-glow-card),transparent_65%)]" />

      <motion.div
        className="relative overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] shadow-[var(--lp-shadow-elevated)]"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <div className="flex items-center justify-between border-b border-[var(--lp-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-red-500/80" />
            <div className="size-2.5 rounded-full bg-amber-400/80" />
            <div className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--lp-text-muted)]">
            TTPro Dashboard
          </p>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--lp-live)]/10 px-2 py-0.5">
            <LiveDot />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lp-live)]">
              Live
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {/* Live scoring card */}
          <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg)]/60 p-4 sm:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--lp-text-muted)]">
                Singles · Round of 16
              </p>
              <span className="rounded-md bg-[var(--lp-accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--lp-accent)]">
                Set 3
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--lp-text)]">Chen Wei</p>
                <p className="text-[11px] text-[var(--lp-text-muted)]">Club A · Seed 2</p>
              </div>
              <div className="flex items-center gap-3 font-[family-name:var(--font-mono)]">
                <motion.span
                  key={`p1-${score.p1}`}
                  className="text-3xl font-bold tabular-nums text-[var(--lp-text)]"
                  initial={prefersReducedMotion ? false : { scale: 1.2, color: "var(--lp-accent)" }}
                  animate={{ scale: 1, color: "var(--lp-text)" }}
                  transition={{ duration: 0.25 }}
                >
                  {score.p1}
                </motion.span>
                <span className="text-lg text-[var(--lp-text-muted)]">:</span>
                <motion.span
                  key={`p2-${score.p2}`}
                  className="text-3xl font-bold tabular-nums text-[var(--lp-text)]"
                  initial={prefersReducedMotion ? false : { scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {score.p2}
                </motion.span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold text-[var(--lp-text)]">Park Jin</p>
                <p className="text-[11px] text-[var(--lp-text-muted)]">Club B · Seed 7</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3].map((set) => (
                <div
                  key={set}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    set <= 2 ? "bg-[var(--lp-accent)]" : "bg-[var(--lp-accent)]/40"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Bracket mini */}
          <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg)]/60 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Trophy className="size-3.5 text-[var(--lp-accent)]" />
              <p className="text-xs font-semibold text-[var(--lp-text)]">Bracket</p>
            </div>
            <ul className="space-y-2">
              {BRACKET.map((m) => (
                <li
                  key={m.label}
                  className="rounded-lg bg-[var(--lp-chip)] px-2 py-1.5 text-[11px]"
                >
                  <p className="text-[var(--lp-text-muted)]">{m.label}</p>
                  <p className="font-medium text-[var(--lp-text)]">
                    {m.a} vs {m.b}
                    <span className="ml-1 text-[var(--lp-accent)]">{m.score}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Leaderboard mini */}
          <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg)]/60 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="size-3.5 text-[var(--lp-live)]" />
              <p className="text-xs font-semibold text-[var(--lp-text)]">Rankings</p>
            </div>
            <ul className="space-y-1.5">
              {LEADERBOARD.map((row) => (
                <li
                  key={row.rank}
                  className="flex items-center justify-between rounded-lg bg-[var(--lp-chip)] px-2 py-1.5 text-[11px]"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--lp-text-muted)]">
                      #{row.rank}
                    </span>
                    <span className="font-medium text-[var(--lp-text)]">{row.name}</span>
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--lp-text-muted)]">
                    {row.pts}
                    <span
                      className={cn(
                        "ml-1",
                        row.delta.startsWith("+")
                          ? "text-[var(--lp-live)]"
                          : "text-red-400"
                      )}
                    >
                      {row.delta}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Floating stat pill */}
      <motion.div
        className="absolute -left-4 top-1/4 hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] px-3 py-2 shadow-xl sm:block"
        animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[var(--lp-accent)]" />
          <div>
            <p className="text-[10px] text-[var(--lp-text-muted)]">Active matches</p>
            <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[var(--lp-text)]">
              24
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
