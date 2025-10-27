"use client";

import Link from "next/link";

interface RecentMatchesProps {
  detailedStats: any;
}

const RecentMatches = ({ detailedStats }: RecentMatchesProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (!detailedStats?.recentMatches || detailedStats.recentMatches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Matches</h3>
      <div className="space-y-2">
        {detailedStats.recentMatches.map((match: any) => (
          <Link
            key={match._id}
            href={`/matches/${match.type}/${match._id}`}
            className="flex items-center justify-between p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {match.type === "team" ? match.matchFormat : match.matchType}
                </span>
                <p
                  className={`font-semibold text-xs ${
                    match.result === "win" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {match.result === "win" ? "Won" : "Lost"}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {match.type === "team" ? match.teams : match.opponent}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(match.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">
                {match.score}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentMatches;