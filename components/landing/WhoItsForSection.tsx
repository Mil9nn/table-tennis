import { Building2, GraduationCap, Trophy, User } from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const AUDIENCES = [
  {
    icon: User,
    title: "Players",
    description: "Track matches, climb rankings, and build your record.",
  },
  {
    icon: GraduationCap,
    title: "Coaches",
    description: "Match-level data to guide training and lineups.",
  },
  {
    icon: Building2,
    title: "Clubs",
    description: "Run league nights and ladders without spreadsheets.",
  },
  {
    icon: Trophy,
    title: "Organizers",
    description: "Brackets and scheduling that scale to 256 players.",
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
          From club night to full tournament
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          Players, coaches, clubs, and organizers — all on the same platform.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((item) => (
          <StaggerItem key={item.title}>
            <article className="h-full rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-5 text-center transition hover:border-[var(--lp-accent)]/25">
              <div className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--lp-accent)]/10 text-[var(--lp-accent)]">
                <item.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-base font-semibold text-[var(--lp-text)]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {item.description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}
