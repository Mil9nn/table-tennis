import { MatchSummary } from "@/components/match-stats/MatchSummary";
import { AchievementBadges } from "@/components/match-stats/AchievementBadges";
import { InsightCard } from "@/components/match-stats/InsightCard";
import { MatchTimeline } from "@/components/match-stats/MatchTimeline";
import { BarChart3 } from "lucide-react";
import { getSideNames } from "../../utils/getSideNames";

interface Props {
  stats: any;
}

export function OverviewSection({ stats }: Props) {
  const { match, games, stats: computed } = stats;

  const { side1Name, side2Name } = getSideNames(match, stats.type);

  return (
    <div className="space-y-6">
      {/* Summary is intentionally first and dominant */}
      <MatchSummary
        side1Name={side1Name}
        side2Name={side2Name}
        side1Sets={
          match.finalScore?.side1Sets ?? match.finalScore?.team1Matches ?? 0
        }
        side2Sets={
          match.finalScore?.side2Sets ?? match.finalScore?.team2Matches ?? 0
        }
      />

      {computed.achievements?.length > 0 && (
        <AchievementBadges achievements={computed.achievements} />
      )}

      {computed.insights?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {computed.insights.map((insight: any, i: number) => (
            <InsightCard
              key={i}
              type={insight.type}
              headline={insight.headline}
              description={insight.description}
              metric={insight.metric}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      <MatchTimeline
        games={games}
        side1Name={side1Name}
        side2Name={side2Name}
        winnerSide={match.winnerSide}
      />
    </div>
  );
}
