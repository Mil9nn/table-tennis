import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getShotColor } from "@/lib/match-stats-utils";
import { useInView } from "@/hooks/useInView";

interface PlayerPieData {
  playerId: string;
  playerName: string;
  data: Array<{ name: string; value: number }>;
}

interface PlayerShotAnalysisProps {
  playerPieData: PlayerPieData[];
}

export function PlayerShotAnalysis({
  playerPieData,
}: PlayerShotAnalysisProps) {
  if (!playerPieData.length) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-[#353535]">
        Shot distribution
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {playerPieData.map((player) => (
          <PlayerPieCard
            key={player.playerId}
            player={player}
          />
        ))}
      </div>
    </section>
  );
}

function PlayerPieCard({
  player,
}: {
  player: PlayerPieData;
}) {
  const { ref, isInView } = useInView({ threshold: 0.25 });

  if (!player.data?.length) return null;

  const totalShots = player.data.reduce(
    (sum, d) => sum + d.value,
    0
  );

  return (
    <div
      ref={ref}
      className="rounded-xl bg-white px-4 py-3 shadow-[0_0_0_1px_#e6e8eb]"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[#353535]">
          {player.playerName}
        </span>
        <span className="text-xs text-[#6b7280]">
          {totalShots} shots
        </span>
      </div>

      {/* Chart */}
      <div className="h-36">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={player.data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
                isAnimationActive
                animationDuration={700}
              >
                {player.data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getShotColor(entry.name)}
                  />
                ))}
              </Pie>

              <Tooltip
                cursor={{ fill: "#f9fafb" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e6e8eb",
                  boxShadow: "none",
                  fontSize: 12,
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  value ?? 0,
                  name ?? "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
