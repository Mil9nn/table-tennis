import { Radio, Trophy, UserCircle, Users } from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const FEATURES = [
  {
    id: "live-scoring",
    icon: Radio,
    title: "Live scoring",
    description:
      "Point-by-point singles and doubles with instant sync across courts.",
  },
  {
    id: "tournament-engine",
    icon: Trophy,
    title: "Tournaments",
    description:
      "Round-robin, knockout, or hybrid — brackets and standings on autopilot.",
  },
  {
    id: "team-management",
    icon: Users,
    title: "Team matches",
    description:
      "Swaythling Cup, SDS, and league formats with lineup and rubber tracking.",
  },
  {
    id: "player-profiles",
    icon: UserCircle,
    title: "Profiles & stats",
    description:
      "Match history, rankings, and performance trends for every player.",
  },
] as const;

export function FeaturesSection() {
  return (
    <SectionShell id="features" ariaLabelledBy="features-heading">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>Features</SectionLabel>
        <SectionHeading id="features-heading" className="mt-3">
          One app for the whole competition
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          Scoring, tournaments, teams, and stats — synced in real time.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.id}>
            <article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-5 transition-colors hover:border-[var(--lp-accent)]/30 hover:bg-[var(--lp-surface-hover)]">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[var(--lp-accent)]/10 text-[var(--lp-accent)]">
                <feature.icon className="size-4" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-base font-semibold text-[var(--lp-text)]">
                {feature.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {feature.description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}
