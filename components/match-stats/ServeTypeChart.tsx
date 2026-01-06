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

/* ------------------------------
   Design System Palette
-------------------------------- */
const PALETTE = {
  textPrimary: "#0f172a",    // slate-900
  textSecondary: "#64748b",  // slate-500
  border: "rgba(15, 23, 42, 0.08)",
  grid: "rgba(15, 23, 42, 0.05)",
};

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

  const chartData = data.map((d) => ({ ...d, label: d.player }));

  return (
    <section
      ref={ref}
      className="rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5"
    >
      {/* Header */}
      <header className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Serve Types Distribution
        </h3>
        <p className="text-xs text-slate-500">
          Composition of serve strategies used by each player
        </p>
      </header>

      {/* Chart */}
      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={6} barCategoryGap="22%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: PALETTE.textSecondary }}
                axisLine={{ stroke: PALETTE.grid }}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                height={48}
              />

              <YAxis
                width={30}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: PALETTE.textSecondary }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  const visible = payload.filter((p) => p.value && p.value > 0);
                  if (visible.length === 0) return null;

                  return (
                    <div className="rounded-md bg-white px-3 py-2 shadow-xl ring-1 ring-black/10 text-xs">
                      <div className="mb-1 font-medium text-slate-900">
                        {label}
                      </div>
                      {visible.map((p) => (
                        <div
                          key={p.dataKey}
                          className="flex items-center justify-between gap-4 text-slate-700"
                        >
                          <span>{p.name}</span>
                          <span className="font-semibold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />

              {Object.entries(SHOT_TYPE_COLORS).map(([key, color], i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  fill={color}
                  radius={[3, 3, 0, 0]}
                  animationBegin={i * 120}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}