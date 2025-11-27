"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  const singlesTotal =
    (detailedStats?.individual?.wins?.singles || 0) +
    (detailedStats?.individual?.losses?.singles || 0);
  const doublesTotal =
    (detailedStats?.individual?.wins?.doubles || 0) +
    (detailedStats?.individual?.losses?.doubles || 0);
  const mixedTotal =
    (detailedStats?.individual?.wins?.mixed_doubles || 0) +
    (detailedStats?.individual?.losses?.mixed_doubles || 0);

  return (
    <>
      {/* Premium Minimal Cards */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          {
            label: "Singles",
            total: singlesTotal,
            wins: detailedStats?.individual?.wins?.singles || 0,
            losses: detailedStats?.individual?.losses?.singles || 0,
          },
          {
            label: "Doubles",
            total: doublesTotal,
            wins: detailedStats?.individual?.wins?.doubles || 0,
            losses: detailedStats?.individual?.losses?.doubles || 0,
          },
          {
            label: "Mixed",
            total: mixedTotal,
            wins: detailedStats?.individual?.wins?.mixed_doubles || 0,
            losses: detailedStats?.individual?.losses?.mixed_doubles || 0,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-4 shadow-sm bg-white flex flex-col gap-1 border border-gray-100"
          >
            <h3 className="text-xs font-semibold text-gray-600">
              {item.label}
            </h3>

            <p className="text-2xl font-bold text-gray-900">{item.total}</p>

            <div className="flex text-xs gap-2 mt-1">
              <span className="px-2 py-[2px] rounded-md bg-emerald-50 text-emerald-700 font-medium">
                {item.wins}W
              </span>
              <span className="px-2 py-[2px] rounded-md bg-rose-50 text-rose-700 font-medium">
                {item.losses}L
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal Bar Chart */}
      {individualTypeData.length > 0 && (
        <div className="bg-white p-6 shadow-sm mt-4 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Performance by Match Type
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={individualTypeData}
                margin={{ left: 10, right: 10, bottom: 10 }}
              >
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis width={30} tick={{ fontSize: 12 }} />

                <Tooltip
                  contentStyle={{
                    background: "white",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    padding: "10px",
                  }}
                />

                {/* Wins bar — rounded top only */}
                <Bar
                  dataKey="wins"
                  name="Wins"
                  fill="#10B981"
                  barSize={42}
                  radius={[6, 6, 0, 0]}
                />

                {/* Losses bar — rounded top only */}
                <Bar
                  dataKey="losses"
                  name="Losses"
                  fill="#EF4444"
                  barSize={42}
                  radius={[6, 6, 0, 0]}
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
