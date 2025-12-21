import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SHOT_TYPE_COLORS } from "@/constants/constants";
import { useInView } from "@/hooks/useInView";

interface ServeTypeChartProps {
  data: Array<{
    player: string;
    type: "Serve";
    side_spin?: number;
    top_spin?: number;
    back_spin?: number;
    mix_spin?: number;
    no_spin?: number;
  }>;
}

export function ServeTypeChart({ data }: ServeTypeChartProps) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    label: d.player,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const nonZero = payload.filter((p: any) => p && p.value != null && p.value !== 0);
    if (nonZero.length === 0) return null;

    return (
      <div className="bg-gray-900 text-white rounded-md p-2 text-sm shadow-lg">
        <div className="font-semibold mb-1">{label}</div>
        {nonZero.map((item: any) => (
          <div key={item.dataKey ?? item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2"
                style={{ backgroundColor: item.color ?? item.fill ?? (item.payload && item.payload.fill) }}
              />
              <span className="text-xs text-gray-300">{item.name}</span>
            </div>
            <div className="text-sm font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section ref={ref}>
      <header className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Serve Types Distribution
            </CardTitle>
            <p className="text-xs text-gray-500">
              Breakdown of serve types used by each player
            </p>
          </div>
        </div>
      </header>

        <div className="h-64 w-full">
          {isInView && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2} barCategoryGap="15%">
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis width={28} allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip content={<CustomTooltip />} />


                <Bar
                  dataKey="side_spin"
                  fill={SHOT_TYPE_COLORS.side_spin}
                  name="Side Spin"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="top_spin"
                  fill={SHOT_TYPE_COLORS.top_spin}
                  name="Top Spin"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="back_spin"
                  fill={SHOT_TYPE_COLORS.back_spin}
                  name="Back Spin"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="mix_spin"
                  fill={SHOT_TYPE_COLORS.mix_spin}
                  name="Mix Spin"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={300}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="no_spin"
                  fill={SHOT_TYPE_COLORS.no_spin}
                  name="No Spin"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={400}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
    </section>
  );
}
