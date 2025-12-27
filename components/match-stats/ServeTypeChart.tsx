import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
      <div className="bg-white border border-[#d9d9d9] p-2 text-sm">
        <div className="font-semibold mb-1 text-[#353535]">{label}</div>
        {nonZero.map((item: any) => (
          <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2"
                style={{ backgroundColor: item.color ?? item.fill ?? (item.payload && item.payload.fill) }}
              />
              <span className="text-xs text-[#353535]/70">{item.name}</span>
            </div>
            <div className="text-sm font-medium text-[#353535]">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section ref={ref} className="bg-white">
      <header className="pb-3">
        <h3 className="text-base font-semibold tracking-tight text-[#353535]">
          Serve Types Distribution
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Breakdown of serve types used by each player
        </p>
      </header>

      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2} barCategoryGap="15%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#353535" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
              />
              <YAxis 
                width={28} 
                allowDecimals={false} 
                tick={{ fontSize: 11, fill: "#353535" }}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="side_spin"
                fill={SHOT_TYPE_COLORS.side_spin}
                name="Side Spin"
                radius={0}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="top_spin"
                fill={SHOT_TYPE_COLORS.top_spin}
                name="Top Spin"
                radius={0}
                isAnimationActive={true}
                animationBegin={100}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="back_spin"
                fill={SHOT_TYPE_COLORS.back_spin}
                name="Back Spin"
                radius={0}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="mix_spin"
                fill={SHOT_TYPE_COLORS.mix_spin}
                name="Mix Spin"
                radius={0}
                isAnimationActive={true}
                animationBegin={300}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="no_spin"
                fill={SHOT_TYPE_COLORS.no_spin}
                name="No Spin"
                radius={0}
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
