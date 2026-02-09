import { StatsSectionContainer } from "@/components/match-stats/StatsSectionContainer";
import { OverviewSection } from "./sections/OverViewSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { DetailsSection } from "./sections/DetailsSection";
import { MapsSection } from "./sections/MapsSection";

export function MatchStatsContent({ stats, sectionRefs }: any) {
  const hasValidShotData = stats.shots && stats.shots.some((shot: any) =>
    shot.originX != null &&
    shot.originY != null &&
    shot.landingX != null &&
    shot.landingY != null
  );

  return (
    <main className="pb-24">
      <StatsSectionContainer
        id="overview"
        title="Overview"
        ref={(el) => {
          sectionRefs.current.overview = el;
        }}
      >
        <OverviewSection stats={stats} />
      </StatsSectionContainer>

      <StatsSectionContainer
        id="performance"
        title="Performance"
        ref={(el) => {
          sectionRefs.current.performance = el;
        }}
      >
        <PerformanceSection stats={stats} />
      </StatsSectionContainer>

      <StatsSectionContainer
        id="details"
        title="Details"
        ref={(el) => {
          sectionRefs.current.details = el;
        }}
      >
        <DetailsSection stats={stats} />
      </StatsSectionContainer>

      {hasValidShotData && (
        <StatsSectionContainer
          id="maps"
          title="Maps"
          ref={(el) => {
            sectionRefs.current.maps = el;
          }}
        >
          <MapsSection stats={stats} />
        </StatsSectionContainer>
      )}
    </main>
  );
}
