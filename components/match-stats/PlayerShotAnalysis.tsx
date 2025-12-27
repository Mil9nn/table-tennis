import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
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
    <div className="space-y-4 bg-white">
      <h3 className="font-semibold text-base text-[#353535]">Player Shot Analysis</h3>

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
    <section ref={ref} className="bg-white border border-[#d9d9d9] p-4">
      <header className="mb-2">
        <h4 className="text-sm font-semibold tracking-tight text-[#353535]">
          {player.playerName}
        </h4>
        <p className="text-xs text-[#d9d9d9]">
          Total winning shots:&nbsp;
          <span className="font-medium text-[#353535]">{totalShots}</span>
        </p>
      </header>

      <div className="h-64">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={player.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
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
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 0,
                  boxShadow: "none",
                }}
                formatter={(value: any, name: any) => [`${value} winning shots`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
