import { MatchSummary } from "@/components/match-stats/MatchSummary";
import { AchievementBadges } from "@/components/match-stats/AchievementBadges";
import { InsightCard } from "@/components/match-stats/InsightCard";
import { MatchTimeline } from "@/components/match-stats/MatchTimeline";
import { BarChart3 } from "lucide-react";

interface Props {
  stats: any;
}

export function OverviewSection({ stats }: Props) {
  const { match, games, stats: computed } = stats;

  return (
    <div className="space-y-8">
      {/* Summary is intentionally first and dominant */}
      <MatchSummary
        side1Name={
          stats.type === "individual"
            ? match.participants?.[0]?.fullName ?? "Side 1"
            : match.team1?.name ?? "Team 1"
        }
        side2Name={
          stats.type === "individual"
            ? match.participants?.[1]?.fullName ?? "Side 2"
            : match.team2?.name ?? "Team 2"
        }
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
        side1Name={
          stats.type === "individual"
            ? match.participants?.[0]?.fullName ?? "Side 1"
            : match.team1?.name ?? "Team 1"
        }
        side2Name={
          stats.type === "individual"
            ? match.participants?.[1]?.fullName ?? "Side 2"
            : match.team2?.name ?? "Team 2"
        }
        winnerSide={match.winnerSide}
      />
    </div>
  );
}
