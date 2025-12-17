"use client";

import { KnockoutStatistics as KnockoutStatisticsType } from "@/types/knockoutStatistics.type";
import { TournamentOutcomeSection } from "./statistics/TournamentOutcomeSection";
import { ParticipantStatisticsSection } from "./statistics/ParticipantStatisticsSection";

interface KnockoutStatisticsProps {
  statistics: KnockoutStatisticsType;
  category: "individual" | "team";
}

export function KnockoutStatistics({ statistics, category }: KnockoutStatisticsProps) {
  return (
    <div className="">
      {/* Section 1: Tournament Outcome */}
      <TournamentOutcomeSection outcome={statistics.outcome} category={category} />

      {/* Section 2: Unified Participant Statistics */}
      <ParticipantStatisticsSection
        progression={statistics.participantProgression}
        stats={statistics.participantStats}
        metrics={statistics.performanceMetrics}
      />
    </div>
  );
}
