import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getShotColor } from "@/lib/match-stats-utils";
import { useInView } from "@/hooks/useInView";

interface ShotTypeChartProps {
  data: Array<{ name: string; value: number }>;
}

export function ShotTypeChart({ data }: ShotTypeChartProps) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  if (data.length === 0) return null;

  return (
    <section ref={ref} className="bg-white">
      <header className="pb-3">
        <h3 className="text-base font-semibold tracking-tight text-[#353535]">
          Shot Type Distribution
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Frequency of each winning shot type across all games
        </p>
      </header>

      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} barCategoryGap="18%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#353535" }}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
              />
              <YAxis
                width={28}
                tick={{ fontSize: 11, fill: "#353535" }}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 0,
                  boxShadow: "none",
                }}
                labelStyle={{ color: "#353535" }}
                itemStyle={{ color: "#353535" }}
                formatter={(value?: number) => [`${value ?? 0}`, "Count"]}
              />
              <Bar
                dataKey="value"
                radius={0}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={getShotColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}