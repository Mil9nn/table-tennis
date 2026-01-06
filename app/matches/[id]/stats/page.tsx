"use client";

import { Loader2 } from "lucide-react";
import { useMatchStatsPage } from "./UseMatchStatsPage";
import { MatchStatsHeader } from "./components/MatchStatsHeader";
import { MatchStatsNavigation } from "./components/MatchStatsNavigation";
import { MatchStatsContent } from "./components/MatchStatsContent";

export default function MatchStatsPage() {
  const {
    loading,
    match,
    normalized,
    sections,
    activeSection,
    scrollToSection,
    sectionRefs,
  } = useMatchStatsPage();

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading match stats…
        </span>
      </div>
    );
  }

  if (!match || !normalized) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Match not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MatchStatsHeader match={match} />

      <MatchStatsNavigation
        sections={sections}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <MatchStatsContent
        stats={normalized}
        sectionRefs={sectionRefs}
      />
    </div>
  );
}
