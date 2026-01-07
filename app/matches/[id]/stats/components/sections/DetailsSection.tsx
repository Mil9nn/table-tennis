import { GameByGameBreakdown } from "@/components/match-stats/GameByGameBreakdown";
import { PlayerShotAnalysis } from "@/components/match-stats/PlayerShotAnalysis";
import { getSideNames } from "../../utils/getSideNames";

interface Props {
  stats: any;
}

export function DetailsSection({ stats }: Props) {
  const { games, participants, stats: computed, match } = stats;

  const { side1Name, side2Name } = getSideNames(match, stats.type);

  return (
    <div className="space-y-12">
      <GameByGameBreakdown
        games={games}
        side1Name={side1Name}
        side2Name={side2Name}
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
