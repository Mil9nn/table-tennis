import { GameByGameBreakdown } from "@/components/match-stats/GameByGameBreakdown";
import { PlayerShotAnalysis } from "@/components/match-stats/PlayerShotAnalysis";

interface Props {
  stats: any;
}

export function DetailsSection({ stats }: Props) {
  const { games, participants, stats: computed, match } = stats;

  return (
    <div className="space-y-12">
      <GameByGameBreakdown
        games={games}
        side1Name={stats.type === "individual"
          ? match.participants?.[0]?.fullName ?? "Side 1"
          : match.team1?.name ?? "Team 1"}
        side2Name={stats.type === "individual"
          ? match.participants?.[1]?.fullName ?? "Side 2"
          : match.team2?.name ?? "Team 2"}
        participants={participants}
        finalScore={stats.match.finalScore}
      />

      {Array.isArray(computed.playerStats) && computed.playerStats.length > 0 && (
        <PlayerShotAnalysis
          playerPieData={computed.playerStats}
        />
      )}
    </div>
  );
}
