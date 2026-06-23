import type { ReactNode } from "react";
import { BarChart3, PlusCircle, Radio, UserPlus } from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const STEPS = [
  {
    step: 1,
    icon: PlusCircle,
    title: "Create",
    description:
      "Launch a match, team tie, or full tournament in seconds. Pick your format—singles, doubles, Swaythling Cup, SDS, round-robin, or knockout.",
    visual: "match",
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Add players",
    description:
      "Build your roster from your club database or invite players directly. Seed brackets, assign teams, and configure lineups before the first serve.",
    visual: "roster",
  },
  {
    step: 3,
    icon: Radio,
    title: "Score live",
    description:
      "Score point-by-point from any device. Multiple scorers stay in sync—every update hits every screen on court and in the stands instantly.",
    visual: "score",
  },
  {
    step: 4,
    icon: BarChart3,
    title: "Track stats",
    description:
      "Standings, brackets, and player profiles update automatically. Rankings, win rates, and match history accumulate with every rubber played.",
    visual: "stats",
  },
] as const;

function StepVisual({ type }: { type: string }) {
  const visuals: Record<string, ReactNode> = {
    match: (
      <div className="space-y-2 p-4">
        <div className="h-2 w-3/4 rounded bg-[var(--lp-accent)]/30" />
        <div className="h-8 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-bg)]/80" />
        <div className="h-8 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-bg)]/80" />
      </div>
    ),
    roster: (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-[var(--lp-accent)]/20" />
            <div className="h-2 flex-1 rounded bg-[var(--lp-chip)]" />
          </div>
        ))}
      </div>
    ),
    score: (
      <div className="flex items-center justify-center gap-4 p-6">
        <span className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[var(--lp-text)]">
          11
        </span>
        <span className="text-[var(--lp-text-muted)]">:</span>
        <span className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[var(--lp-text)]">
          9
        </span>
      </div>
    ),
    stats: (
      <div className="flex items-end justify-center gap-1.5 p-4 pt-8">
        {[40, 65, 50, 80, 55].map((h, i) => (
          <div
            key={i}
            className="w-5 rounded-t bg-[var(--lp-accent)]/60"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    ),
  };

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)]"
      aria-hidden="true"
    >
      {visuals[type]}
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works" ariaLabelledBy="how-heading">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>How it works</SectionLabel>
        <SectionHeading id="how-heading" className="mt-3">
          From first serve to final standings in four steps
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          Whether you&apos;re running a club night or a multi-day championship, the
          workflow stays the same—create, roster, score, analyze.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-[var(--lp-border)] to-transparent lg:block"
          aria-hidden="true"
        />
        {STEPS.map((item) => (
          <StaggerItem key={item.step}>
            <article className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full border border-[var(--lp-accent)]/30 bg-[var(--lp-accent)]/10 font-[family-name:var(--font-mono)] text-sm font-bold text-[var(--lp-accent)]">
                  {item.step}
                </span>
                <item.icon className="size-5 text-[var(--lp-text-muted)]" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--lp-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {item.description}
              </p>
              <StepVisual type={item.visual} />
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}
