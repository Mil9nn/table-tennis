import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ShotTypeChartProps {
  data: Array<{ name: string; value: number }>;
}

export function ShotTypeChart({ data }: ShotTypeChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-gray-800 bg-black text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Shot Type Distribution
            </CardTitle>
            <p className="text-xs text-gray-500">
              Frequency of each shot type across all games
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Reduced height for modern compact look */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barGap={6}
              barCategoryGap="18%"
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <YAxis
                width={28}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />

              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "#aaa" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value?: number) => [`${value ?? 0}`, "Count"]}
              />

              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
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
        </div>
      </CardContent>
    </Card>
  );
}