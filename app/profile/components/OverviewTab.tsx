// app/profile/components/OverviewTab.tsx
"use client";

import StatsCards from "./StatsCards";
import RecentMatches from "./RecentMatches";
import HeadToHead from "./HeadToHead";

interface OverviewTabProps {
  stats: any;
  detailedStats: any;
}

const OverviewTab = ({ stats, detailedStats }: OverviewTabProps) => {
  return (
    <>
      <StatsCards stats={stats} detailedStats={detailedStats} />
      <RecentMatches detailedStats={detailedStats} />
      <HeadToHead detailedStats={detailedStats} />
    </>
  );
};

export default OverviewTab;