"use client";

import { KnockoutStatistics as KnockoutStatisticsType } from "@/types/knockoutStatistics.type";
import { ParticipantStatisticsSection } from "./statistics/ParticipantStatisticsSection";

interface KnockoutStatisticsProps {
  statistics: KnockoutStatisticsType;
  category: "individual" | "team";
}

export function KnockoutStatistics({ statistics, category }: KnockoutStatisticsProps) {
  return (
    <div className="">
      {/* Unified Participant Statistics */}
      <ParticipantStatisticsSection
        progression={statistics.participantProgression}
        stats={statistics.participantStats}
        metrics={statistics.performanceMetrics}
      />
    </div>
  );
}
