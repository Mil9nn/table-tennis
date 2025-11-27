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

const COLORS = {
  serve: "#F4A261", // warm amber — NOT green
  receive: "#4C6EF5", // refined cool blue
};

interface ServeReceiveChartProps {
  data: Array<{
    player: string;
    Serve: number;
    Receive: number;
  }>;
}

export function ServeReceiveChart({ data }: ServeReceiveChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-gray-800 bg-black text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Serve vs Receive Performance
            </CardTitle>
            <p className="text-xs text-gray-500">
              Compare points won while serving vs receiving
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Smaller + sleek chart height */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} barCategoryGap="20%">
              <XAxis
                dataKey="player"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <YAxis
                width={28}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "#aaa" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value: string) => {
                  if (value === "Serve") return "Serve Points";
                  if (value === "Receive") return "Receive Points";
                  return value;
                }}
              />
              <Bar
                dataKey="Serve"
                fill={COLORS.serve}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Receive"
                fill={COLORS.receive}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}