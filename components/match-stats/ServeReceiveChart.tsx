import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useInView } from "@/hooks/useInView";

// Accent colors with variety
const COLORS = {
  serve: "#3c6e71", // teal from app palette
  receive: "#284b63", // navy from app palette
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

  if (data.length === 0) return null;

  return (
    <section ref={ref} className="bg-white">
      <header className="pb-3">
        <h3 className="text-base font-semibold tracking-tight text-[#353535]">
          Serve vs Receive Performance
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Compare points won while serving vs receiving
        </p>
      </header>

      <div className="h-56 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} barCategoryGap="20%">
              <XAxis 
                dataKey="player" 
                tick={{ fontSize: 11, fill: "#353535" }} 
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 0,
                  boxShadow: "none",
                }}
                labelStyle={{ color: "#353535" }}
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
                radius={0}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="Receive"
                fill={COLORS.receive}
                radius={0}
                isAnimationActive={true}
                animationBegin={200}
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
