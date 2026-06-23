import { Building2, GraduationCap, Trophy, User } from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const AUDIENCES = [
  {
    icon: User,
    title: "Players",
    description:
      "Track every match, climb the leaderboard, and build a competitive profile that follows you across clubs and tournaments.",
  },
  {
    icon: GraduationCap,
    title: "Coaches",
    description:
      "Monitor player development with match-level data. Identify strengths, close gaps, and prepare lineups with confidence.",
  },
  {
    icon: Building2,
    title: "Clubs & Academies",
    description:
      "Run league nights, internal ladders, and inter-club ties from one platform. Replace manual admin with automated standings.",
  },
  {
    icon: Trophy,
    title: "Tournament Organizers",
    description:
      "Deploy round-robin table tennis software and knockout bracket generators that scale from 8 to 256 players without breaking.",
  },
] as const;

export function WhoItsForSection() {
  return (
    <SectionShell
      id="for-who"
      ariaLabelledBy="for-who-heading"
      className="bg-[var(--lp-surface)]/30"
    >
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>Who it&apos;s for</SectionLabel>
        <SectionHeading id="for-who-heading" className="mt-3">
          Built for everyone who takes table tennis seriously
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          From casual club players to national tournament directors—TTPro scales
          with your ambition.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((item) => (
          <StaggerItem key={item.title}>
            <article className="h-full rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 text-center transition hover:border-[var(--lp-accent)]/25">
              <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--lp-accent)]/10 text-[var(--lp-accent)]">
                <item.icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--lp-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {item.description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}
