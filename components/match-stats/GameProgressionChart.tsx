import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GameProgressionChartProps {
  data: Array<{ game: string; [key: string]: string | number }>;
  side1Name: string;
  side2Name: string;
}

export function GameProgressionChart({
  data,
  side1Name,
  side2Name,
}: GameProgressionChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-gray-800 bg-black text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Game-by-Game Score Trends
          </CardTitle>
          <p className="text-xs text-gray-500">
            Track score evolution throughout the match
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* Compact & sleek chart height */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 4, right: 12 }}>
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                label={{
                  value: "Points",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#9CA3AF",
                  fontSize: 11,
                }}
              />

              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "#aaa" }}
                formatter={(value: any, name: any) => [`${value} points`, name]}
              />

              <Legend wrapperStyle={{ paddingTop: 8 }} />

              {/* Modern premium colors – no green */}
              <Line
                type="monotone"
                dataKey={side1Name}
                stroke="#F4A261" // warm amber (used earlier)
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey={side2Name}
                stroke="#4C6EF5" // refined indigo blue
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}