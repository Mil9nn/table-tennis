import {
  BarChart3,
  Globe,
  Radio,
  Swords,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const FEATURES = [
  {
    id: "live-scoring",
    icon: Radio,
    title: "Live Match Scoring",
    description:
      "Score singles and doubles with point-by-point updates, server rotation, and multi-scorer collaboration—all synced instantly across courts.",
    bullets: [
      "Singles & doubles",
      "Live score sync",
      "Point-by-point updates",
      "Multi-scorer system",
    ],
  },
  {
    id: "tournament-engine",
    icon: Trophy,
    title: "Tournament Engine",
    description:
      "Flexible tournament formats for every event. Round-robin, knockout, or hybrid—brackets, scheduling, and standings generate automatically.",
    bullets: [
      "Round-robin & knockout",
      "Hybrid progression",
      "Auto brackets",
      "Smart scheduling",
    ],
  },
  {
    id: "player-profiles",
    icon: UserCircle,
    title: "Player Profiles",
    description:
      "Every match builds a complete competitive record. Track stats, match history, performance trends, and rankings over time.",
    bullets: ["Match stats", "Full history", "Performance trends", "Rankings"],
  },
  {
    id: "team-management",
    icon: Users,
    title: "Team Management",
    description:
      "Create and manage teams for league play and inter-club competition. Assign players, track team history, and manage rosters effortlessly.",
    bullets: ["Create teams", "Manage rosters", "Team history", "Lineup control"],
  },
  {
    id: "leaderboards",
    icon: Globe,
    title: "Global Leaderboards",
    description:
      "Compete on rankings that reflect real performance. Track tournament wins, rating progression, and head-to-head records across your community.",
    bullets: [
      "Global rankings",
      "Performance tracking",
      "Tournament wins",
      "Head-to-head records",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Competition Analytics",
    description:
      "Turn match data into actionable insight. Surface win rates, set differentials, and format-specific performance for players and coaches.",
    bullets: [
      "Win rate analysis",
      "Set differentials",
      "Format breakdowns",
      "Coach dashboards",
    ],
  },
] as const;

export function FeaturesSection() {
  return (
    <SectionShell id="features" ariaLabelledBy="features-heading">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>Platform capabilities</SectionLabel>
        <SectionHeading id="features-heading" className="mt-3">
          Everything your competition needs—nothing it doesn&apos;t
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          TTPro is the table tennis live scoring and tournament manager that
          replaces spreadsheets, whiteboards, and disconnected apps with one
          synchronized system.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.id}>
            <article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 transition-colors hover:border-[var(--lp-accent)]/30 hover:bg-[var(--lp-surface-hover)]">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[var(--lp-accent)]/10 text-[var(--lp-accent)]">
                <feature.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--lp-text)]">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {feature.description}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {feature.bullets.map((b) => (
                  <li
                    key={b}
                    className="rounded-md bg-[var(--lp-chip)] px-2 py-1 text-[11px] font-medium text-[var(--lp-text-muted)]"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}

const TEAM_FORMATS = [
  {
    name: "Swaythling Cup",
    tag: "5 singles",
    description:
      "The classic international team format. Five singles rubbers with lineup rules enforced automatically—each player plays once or twice across the tie.",
    details: ["5 singles rubbers", "Lineup validation", "Automatic tie totals"],
  },
  {
    name: "SDS",
    tag: "Single-Double-Single",
    description:
      "Single-Double-Single: three rubbers that test depth and pairing chemistry. TTPro tracks rubber order, pairings, and aggregate team score in real time.",
    details: ["3-rubber format", "Doubles pairing", "Live team totals"],
  },
  {
    name: "Custom Formats",
    tag: "Your rules",
    description:
      "Build bespoke team structures for league nights and club championships. Configure rubber count, player limits, and scoring rules to match your competition.",
    details: ["Configurable rubbers", "Flexible lineups", "Custom scoring"],
  },
] as const;

export function TeamFormatsSection() {
  return (
    <SectionShell
      id="team-formats"
      ariaLabelledBy="team-formats-heading"
      className="bg-[var(--lp-surface)]/40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--lp-glow-section),transparent)]" />

      <FadeIn className="relative mx-auto max-w-3xl text-center">
        <SectionLabel>Team match formats</SectionLabel>
        <SectionHeading id="team-formats-heading" className="mt-3">
          Table tennis team match software that speaks your format
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          From Swaythling Cup to SDS and custom league structures—score team ties
          with the precision of a singles match. No other ping pong score tracker
          handles competitive team formats at this level.
        </SectionLead>
      </FadeIn>

      <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
        {TEAM_FORMATS.map((format, i) => (
          <FadeIn key={format.name} delay={i * 0.08}>
            <article
              className={cn(
                "relative overflow-hidden rounded-2xl border p-6 lg:p-7",
                i === 0
                  ? "border-[var(--lp-accent)]/40 bg-gradient-to-b from-[var(--lp-accent)]/10 to-[var(--lp-surface)] shadow-[0_0_40px_var(--lp-glow-featured)]"
                  : "border-[var(--lp-border)] bg-[var(--lp-surface)]"
              )}
            >
              {i === 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-[var(--lp-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--lp-on-accent)]">
                  Featured
                </span>
              )}
              <div className="mb-4 inline-flex items-center gap-2">
                <Swords className="size-5 text-[var(--lp-accent)]" aria-hidden="true" />
                <span className="rounded-md bg-[var(--lp-chip)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--lp-text-muted)]">
                  {format.tag}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--lp-text)]">
                {format.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {format.description}
              </p>
              <ul className="mt-5 space-y-2">
                {format.details.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 text-sm text-[var(--lp-text)]"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-[var(--lp-accent)]"
                      aria-hidden="true"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </article>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
