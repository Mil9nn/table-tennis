import { PerformanceCommentary } from "@/components/match-stats/PerformanceCommentary";
import { ServeReceiveChart } from "@/components/match-stats/ServeReceiveChart";
import { ServeTypeChart } from "@/components/match-stats/ServeTypeChart";
import { ShotTypeChart } from "@/components/match-stats/ShotTypeChart";
import { GameProgressionChart } from "@/components/match-stats/GameProgressionChart";
import { getSideNames } from "../../utils/getSideNames";

interface Props {
  stats: any;
}

export function PerformanceSection({ stats }: Props) {
  const { games, stats: computed, match } = stats;

  return (
    <div className="space-y-10">
      {computed.commentary?.length > 0 && (
        <PerformanceCommentary commentary={computed.commentary} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(computed.serveStats) && computed.serveStats.length > 0 && (
          <ServeReceiveChart data={computed.serveStats} />
        )}

        {Array.isArray(computed.serveTypeStats) && computed.serveTypeStats.length > 0 && (
          <ServeTypeChart data={computed.serveTypeStats} />
        )}

        {Array.isArray(computed.shotTypes) && computed.shotTypes.length > 0 && (
          <ShotTypeChart data={computed.shotTypes} />
        )}
      </div>

      {games.length > 1 && (() => {
        const { side1Name, side2Name } = getSideNames(match, stats.type);

        return (
          <GameProgressionChart
            data={games.map((_ : any, i : number) => ({
              game: `G${i + 1}`,
            }))}
            side1Name={side1Name}
            side2Name={side2Name}
          />
        );
      })()}
    </div>
  );
}
