"use client";

import { useState } from "react";
import { BarChart3, LayoutDashboard, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn } from "./motion";
import { LiveScorerPreview } from "./previews/LiveScorerPreview";
import { ManagementPreview } from "./previews/ManagementPreview";
import { StandingsPreview } from "./previews/StandingsPreview";

const SHOWCASE_TABS = [
  { id: "standings", label: "Standings", icon: BarChart3, preview: StandingsPreview },
  { id: "scorer", label: "Live scoring", icon: Radio, preview: LiveScorerPreview },
  {
    id: "management",
    label: "Tournament control",
    icon: LayoutDashboard,
    preview: ManagementPreview,
  },
] as const;

type ShowcaseTabId = (typeof SHOWCASE_TABS)[number]["id"];

export function AppShowcaseSection() {
  const [activeTab, setActiveTab] = useState<ShowcaseTabId>("standings");
  const active = SHOWCASE_TABS.find((t) => t.id === activeTab) ?? SHOWCASE_TABS[0];
  const Preview = active.preview;

  return (
    <SectionShell
      id="showcase"
      ariaLabelledBy="showcase-heading"
      className="bg-[var(--lp-bg)]/50"
    >
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>From the app</SectionLabel>
        <SectionHeading id="showcase-heading" className="mt-3">
          See it in action
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          Real screens from the TTPro app — standings, live scoring, and tournament control.
        </SectionLead>
      </FadeIn>

      <FadeIn className="mt-8" delay={0.1}>
        <div
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label="App preview screens"
        >
          {SHOWCASE_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`showcase-panel-${tab.id}`}
                id={`showcase-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                  isActive
                    ? "border-[var(--lp-accent)] bg-[var(--lp-accent)] text-[var(--lp-on-accent)]"
                    : "border-[var(--lp-border)] bg-[var(--lp-surface)] text-[var(--lp-text-muted)] hover:border-[var(--lp-accent)]/30 hover:text-[var(--lp-text)]"
                )}
              >
                <tab.icon className="size-4 shrink-0" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`showcase-panel-${active.id}`}
          aria-labelledby={`showcase-tab-${active.id}`}
        >
          <Preview />
        </div>
      </FadeIn>
    </SectionShell>
  );
}
