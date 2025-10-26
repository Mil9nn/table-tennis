// app/profile/components/RecentMatches.tsx
"use client";

import Link from "next/link";
import MatchTypeBadge from "@/components/MatchTypeBadge";

interface RecentMatchesProps {
  detailedStats: any;
}

const RecentMatches = ({ detailedStats }: RecentMatchesProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!detailedStats?.recentMatches || detailedStats.recentMatches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Matches</h3>
      <div className="space-y-3">
        {detailedStats.recentMatches.map((match: any) => (
          <Link
            key={match._id}
            href={`/matches/${match._id}`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* <MatchTypeBadge matchType={match.matchType} /> */}
                <p
                  className={`font-semibold ${
                    match.won ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {match.won ? "Won" : "Lost"}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {formatDate(match.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">
                {match?.finalScore?.userSide}-{match?.finalScore?.opponentSide}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentMatches;