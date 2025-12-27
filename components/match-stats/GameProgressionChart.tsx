import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useInView } from "@/hooks/useInView";

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
  const { ref, isInView } = useInView({ threshold: 0.2 });

  if (data.length === 0) return null;

  return (
    <section ref={ref} className="bg-white">
      <header className="pb-3">
        <h3 className="text-base font-semibold tracking-tight text-[#353535]">
          Game-by-Game Score Trends
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Track score evolution throughout the match
        </p>
      </header>

      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 4, right: 12 }}>
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11, fill: "#353535" }}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#353535" }}
                axisLine={{ stroke: "#d9d9d9" }}
                tickLine={{ stroke: "#d9d9d9" }}
                label={{
                  value: "Points",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#353535",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 0,
                  boxShadow: "none",
                }}
                labelStyle={{ color: "#353535" }}
                formatter={(value: any, name: any) => [`${value} points`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              {/* App palette colors with variety */}
              <Line
                type="monotone"
                dataKey={side1Name}
                stroke="#3c6e71" // teal
                strokeWidth={2}
                dot={{ r: 3, fill: "#3c6e71" }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey={side2Name}
                stroke="#284b63" // navy
                strokeWidth={2}
                dot={{ r: 3, fill: "#284b63" }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}