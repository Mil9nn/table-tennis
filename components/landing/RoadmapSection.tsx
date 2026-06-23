import {
  Building2,
  Globe,
  Layers,
  Radio,
  Sparkles,
  Video,
} from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

const ROADMAP = [
  {
    icon: Video,
    title: "Live streaming",
    description: "Broadcast matches with integrated score overlays for remote audiences.",
  },
  {
    icon: Sparkles,
    title: "AI match insights",
    description: "Surface patterns, momentum shifts, and tactical recommendations from match data.",
  },
  {
    icon: Layers,
    title: "Replay analytics",
    description: "Connect video replays to point-by-point scoring for deep post-match review.",
  },
  {
    icon: Globe,
    title: "Public tournament pages",
    description: "Share live brackets, standings, and schedules with spectators and media.",
  },
  {
    icon: Building2,
    title: "Club systems",
    description: "Membership management, facility booking, and integrated club-wide ladders.",
  },
  {
    icon: Radio,
    title: "Broadcast overlays",
    description: "OBS-ready score graphics for venue screens and streaming productions.",
  },
] as const;

export function RoadmapSection() {
  return (
    <SectionShell
      id="roadmap"
      ariaLabelledBy="roadmap-heading"
      className="bg-[var(--lp-surface)]/30"
    >
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>Roadmap</SectionLabel>
        <SectionHeading id="roadmap-heading" className="mt-3">
          What&apos;s coming next
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          TTPro is built for the long game. Here&apos;s what we&apos;re shipping to
          make it the definitive table tennis competition platform.
        </SectionLead>
      </FadeIn>

      <StaggerContainer className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((item) => (
          <StaggerItem key={item.title}>
            <article className="group relative overflow-hidden rounded-2xl border border-dashed border-[var(--lp-border)] bg-[var(--lp-surface)]/60 p-5 transition hover:border-[var(--lp-accent)]/30">
              <span className="mb-3 inline-block rounded-full bg-[var(--lp-accent)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--lp-accent)]">
                Coming soon
              </span>
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-[var(--lp-chip)] text-[var(--lp-text-muted)]">
                <item.icon className="size-4" aria-hidden="true" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] font-semibold text-[var(--lp-text)]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-[var(--lp-text-muted)]">
                {item.description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionShell>
  );
}
