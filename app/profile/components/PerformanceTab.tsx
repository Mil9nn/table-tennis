"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const COLORS = ["#F59E0B", "#8B5CF6", "#14B8A6", "#6366F1", "#EC4899", "#10B981", "#EF4444"];

interface PerformanceTabProps {
  detailedStats: any;
}

const PerformanceTab = ({ detailedStats }: PerformanceTabProps) => {
  const shotData = detailedStats?.shotAnalysis?.detailedShots
    ? Object.entries(detailedStats.shotAnalysis.detailedShots).map(([name, value]) => ({
        name: name.replaceAll("_", " "),
        value,
      }))
    : [];

  const playingStyleData = detailedStats?.shotAnalysis
    ? [
        { name: "FH", value: detailedStats.shotAnalysis.forehand },
        { name: "BH", value: detailedStats.shotAnalysis.backhand },
      ].filter((item) => item.value > 0)
    : [];

  const playStyleData = detailedStats?.shotAnalysis
    ? [
        { name: "Offensive", value: detailedStats.shotAnalysis.offensive },
        { name: "Defensive", value: detailedStats.shotAnalysis.defensive },
        { name: "Neutral", value: detailedStats.shotAnalysis.neutral },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playingStyleData.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Forehand vs Backhand</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={playingStyleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {playingStyleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {playStyleData.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Playing Style</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={playStyleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {playStyleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {shotData.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Career Shot Distribution</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shotData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis width={30} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value">
                  {shotData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceTab;