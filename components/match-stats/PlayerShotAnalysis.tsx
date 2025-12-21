import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { getShotColor, renderCustomLabel } from "@/lib/match-stats-utils";
import { useInView } from "@/hooks/useInView";

interface PlayerPieData {
  playerId: string;
  playerName: string;
  data: Array<{ name: string; value: number }>;
}

interface PlayerShotAnalysisProps {
  playerPieData: PlayerPieData[];
}

export function PlayerShotAnalysis({ playerPieData }: PlayerShotAnalysisProps) {
  return (
    <div className="space-y-4 p-2">
      <h3 className="font-semibold text-base mb-1">Player Shot Analysis</h3>

      {/* Player Cards */}
      {playerPieData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {playerPieData.map((player) => {
            return <PlayerPieChart key={player.playerId} player={player} />;
          })}
        </div>
      )}
    </div>
  );
}

function PlayerPieChart({ player }: { player: PlayerPieData }) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  const totalShots = player.data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section ref={ref}>
      <header>
        <CardTitle className="text-lg font-semibold tracking-tight">
          {player.playerName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total points:&nbsp;
          <span className="font-medium text-foreground">{totalShots}</span>
        </p>
      </header>

      {/* Smaller Chart */}
      <div className="h-72">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={player.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={85}
                dataKey="value"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {player.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getShotColor(entry.name)} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: any, name: any) => [`${value} shots`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
