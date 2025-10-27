"use client";

import StatsCards from "./StatsCards";
import RecentMatches from "./RecentMatches";
import HeadToHead from "./HeadToHead";

interface OverviewTabProps {
  detailedStats: any;
}

const OverviewTab = ({ detailedStats }: OverviewTabProps) => {
  return (
    <>
      <StatsCards detailedStats={detailedStats} />
      <RecentMatches detailedStats={detailedStats} />
      <HeadToHead detailedStats={detailedStats} />
    </>
  );
};

export default OverviewTab;