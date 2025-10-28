// app/profile/components/IndividualTab.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#EF4444",
];

interface IndividualTabProps {
  detailedStats: any;
}

const IndividualTab = ({ detailedStats }: IndividualTabProps) => {

  const individualTypeData = detailedStats?.individual
    ? [
        {
          type: "Singles",
          wins: detailedStats.individual.wins?.singles || 0,
          losses: detailedStats.individual.losses?.singles || 0,
        },
        {
          type: "Doubles",
          wins: detailedStats.individual.wins?.doubles || 0,
          losses: detailedStats.individual.losses?.doubles || 0,
        },
        {
          type: "Mixed",
          wins: detailedStats.individual.wins?.mixed_doubles || 0,
          losses: detailedStats.individual.losses?.mixed_doubles || 0,
        },
      ].filter((d) => d.wins + d.losses > 0)
    : [];

  // Calculate totals from wins and losses
  const singlesTotal =
    (detailedStats?.individual?.wins?.singles || 0) +
    (detailedStats?.individual?.losses?.singles || 0);
  const doublesTotal =
    (detailedStats?.individual?.wins?.doubles || 0) +
    (detailedStats?.individual?.losses?.doubles || 0);
  const mixedTotal =
    (detailedStats?.individual?.wins?.mixed_doubles || 0) +
    (detailedStats?.individual?.losses?.mixed_doubles || 0);
  const allTotal = singlesTotal + doublesTotal + mixedTotal;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Singles</h3>
          <p className="text-2xl font-black text-gray-800">{singlesTotal}</p>
          <p className="text-xs text-gray-500 mt-1">
            {detailedStats?.individual?.wins?.singles || 0}W -{" "}
            {detailedStats?.individual?.losses?.singles || 0}L
          </p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Doubles</h3>
          <p className="text-2xl font-black text-gray-800">{doublesTotal}</p>
          <p className="text-xs text-gray-500 mt-1">
            {detailedStats?.individual?.wins?.doubles || 0}W -{" "}
            {detailedStats?.individual?.losses?.doubles || 0}L
          </p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Mixed</h3>
          <p className="text-2xl font-black text-gray-800">{mixedTotal}</p>
          <p className="text-xs text-gray-500 mt-1">
            {detailedStats?.individual?.wins?.mixed_doubles || 0}W -{" "}
            {detailedStats?.individual?.losses?.mixed_doubles || 0}L
          </p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            Total Individual
          </h3>
          <p className="text-2xl font-black text-gray-800">{allTotal}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(detailedStats?.individual?.wins?.singles || 0) +
              (detailedStats?.individual?.wins?.doubles || 0) +
              (detailedStats?.individual?.wins?.mixed_doubles || 0)}
            W -
            {(detailedStats?.individual?.losses?.singles || 0) +
              (detailedStats?.individual?.losses?.doubles || 0) +
              (detailedStats?.individual?.losses?.mixed_doubles || 0)}
            L
          </p>
        </div>
      </div>

      {individualTypeData.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Performance by Match Type
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={individualTypeData}>
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis width={30} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="wins" stackId="a" fill="#10B981" name="Wins" />
                <Bar
                  dataKey="losses"
                  stackId="a"
                  fill="#EF4444"
                  name="Losses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default IndividualTab;
