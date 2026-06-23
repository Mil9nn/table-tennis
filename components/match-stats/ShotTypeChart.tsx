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
  const { ref, isInView } = useInView({ threshold: 0.25 });

  if (!data?.length) return null;

  return (
    <section
      ref={ref}
      className="
        rounded-lg border border-[#E6E8EB]
        bg-white
        px-5 py-4
        shadow-sm
      "
    >
      <header className="mb-3 space-y-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-[#2B2F36]">
          Shot Distribution
        </h3>
        <p className="text-xs text-[#6B7280]">
          Winning shots by type across all games
        </p>
      </header>

      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={8} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={{ stroke: "#E6E8EB" }}
                tickLine={{ stroke: "#E6E8EB" }}
              />
              <YAxis
                width={30}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={{ stroke: "#E6E8EB" }}
                tickLine={{ stroke: "#E6E8EB" }}
              />

              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E6E8EB",
                  borderRadius: "6px",
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: 12,
                }}
                labelStyle={{
                  color: "#2B2F36",
                  fontWeight: 500,
                }}
                itemStyle={{ color: "#2B2F36" }}
                formatter={(value?: number) => [`${value ?? 0}`, "Count"]}
              />

              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getShotColor(entry.name)}
                    style={{ transition: "opacity 0.2s ease" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}