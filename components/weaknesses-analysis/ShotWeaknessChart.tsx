// components/weaknesses-analysis/ShotWeaknessChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { ShotWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface ShotWeaknessChartProps {
  shotWeaknesses: ShotWeaknessData[];
  showTop?: number;
  variant?: "weaknesses" | "strengths" | "all";
}

export function ShotWeaknessChart({
  shotWeaknesses,
  showTop = 10,
  variant = "weaknesses",
}: ShotWeaknessChartProps) {
  // Filter and sort based on variant
  let displayData = [...shotWeaknesses];

  if (variant === "weaknesses") {
    // Show weakest shots (lowest win rate)
    displayData = displayData
      .filter((s) => s.totalAttempts >= 5)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, showTop);
  } else if (variant === "strengths") {
    // Show strongest shots (highest win rate)
    displayData = displayData
      .filter((s) => s.totalAttempts >= 5)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, showTop);
  } else {
    // Show all (sorted by win rate ascending)
    displayData = displayData
      .filter((s) => s.totalAttempts >= 3)
      .sort((a, b) => a.winRate - b.winRate);
  }

  if (displayData.length === 0) {
    return null;
  }

  // Format data for chart
  const chartData = displayData.map((weakness) => ({
    stroke: formatStrokeName(weakness.stroke),
    winRate: weakness.winRate,
    lossRate: weakness.lossRate,
    totalAttempts: weakness.totalAttempts,
    fullData: weakness,
  }));

  // Color based on win rate
  const getBarColor = (winRate: number) => {
    if (winRate >= 60) return "#10b981"; // Green
    if (winRate >= 50) return "#f59e0b"; // Yellow
    if (winRate >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const weakness = data.fullData;

    return (
      <div className="bg-white border border-gray-300 p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.stroke}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Win Rate:</span>
            <span className="font-semibold text-green-600">{weakness.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Loss Rate:</span>
            <span className="font-semibold text-red-600">{weakness.lossRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Attempts:</span>
            <span className="font-semibold">{weakness.totalAttempts}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Wins/Losses:</span>
            <span className="font-semibold">
              {weakness.pointsWon}/{weakness.pointsLost}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 italic mt-2 border-t pt-2">
          <RecommendationText text={weakness.recommendation} />
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {variant === "weaknesses" && "Shot Weaknesses"}
          {variant === "strengths" && "Shot Strengths"}
          {variant === "all" && "Shot Performance"}
        </CardTitle>
        <p className="text-xs text-gray-500">
          {variant === "weaknesses" &&
            "Shots with lowest win rates - focus practice here"}
          {variant === "strengths" && "Your strongest shots - use them strategically"}
          {variant === "all" && "Win rate by shot type"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="stroke" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Bar dataKey="winRate" name="Win Rate %" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend for colors */}
        <div className="flex items-center gap-2 flex-wrap mt-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Strong (&gt;60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Average (50-60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">Weak (40-50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Critical (&lt;40%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
