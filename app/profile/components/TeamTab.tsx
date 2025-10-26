// app/profile/components/TeamTab.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#F59E0B", "#8B5CF6", "#14B8A6"];

interface TeamTabProps {
  detailedStats: any;
}

const TeamTab = ({ detailedStats }: TeamTabProps) => {
  const teamFormatData = detailedStats?.team
    ? [
        { format: "Swaythling", matches: detailedStats.team.byFormat.five_singles },
        { format: "SDS", matches: detailedStats.team.byFormat.single_double_single },
        { format: "Custom", matches: detailedStats.team.byFormat.custom },
      ].filter((d) => d.matches > 0)
    : [];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Team Matches</h3>
          <p className="text-2xl font-black text-gray-800">{detailedStats?.team?.total || 0}</p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Team Wins</h3>
          <p className="text-2xl font-black text-green-600">{detailedStats?.team?.wins || 0}</p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">SubMatches</h3>
          <p className="text-2xl font-black text-gray-800">
            {detailedStats?.team?.subMatchesPlayed || 0}
          </p>
        </div>
        <div className="border-blue-100 border-2 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">SubMatch Wins</h3>
          <p className="text-2xl font-black text-green-600">
            {detailedStats?.team?.subMatchesWon || 0}
          </p>
        </div>
      </div>

      {teamFormatData.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Matches by Format</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamFormatData}>
                <XAxis dataKey="format" tick={{ fontSize: 12 }} />
                <YAxis width={30} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="matches">
                  {teamFormatData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

export default TeamTab;