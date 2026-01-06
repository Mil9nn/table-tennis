import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInView } from "@/hooks/useInView";

/* --------------------------------
   Muted Analytical Palette
   (Same hues, lower chroma)
-------------------------------- */
const COLORS = {
  serve: "rgba(37, 99, 235, 0.85)",     // analytical blue
  receive: "rgba(55, 65, 81, 0.85)",    // graphite slate
};


interface ServeReceiveChartProps {
  data: Array<{
    player: string;
    Serve: number;
    Receive: number;
  }>;
}

export function ServeReceiveChart({ data }: ServeReceiveChartProps) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section
      ref={ref}
      className="rounded-md bg-white px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Serve vs Receive
        </h3>
        <p className="text-xs text-neutral-500">
          Points won while serving compared to receiving
        </p>
      </header>

      {/* Chart */}
      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barGap={4}
              barCategoryGap="28%"
            >
              {/* Axes */}
              <XAxis
                dataKey="player"
                tick={{ fontSize: 11, fill: "#525252" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={28}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#525252" }}
                tickLine={false}
                axisLine={false}
              />

              {/* Tooltip */}
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 6,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  fontSize: 12,
                }}
                labelStyle={{
                  color: "#111827",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                itemStyle={{ color: "#374151" }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  value ?? 0,
                  name === "Serve" ? "Serve Points" : "Receive Points",
                ]}
              />

              {/* Bars */}
              <Bar
                dataKey="Serve"
                fill={COLORS.serve}
                radius={[4, 4, 0, 0]}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="Receive"
                fill={COLORS.receive}
                radius={[4, 4, 0, 0]}
                animationBegin={120}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Custom Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS.serve }}
          />
          Serve Points
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS.receive }}
          />
          Receive Points
        </div>
      </div>
    </section>
  );
}
