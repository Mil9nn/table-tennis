"use client";

import React, { useEffect, useState } from "react";
import { Crown, Trophy } from "lucide-react";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        Leaderboard
      </h2>

      <div className="overflow-x-auto rounded-xl shadow-sm border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Win %</th>
              <th className="px-4 py-3 text-left">Record</th>
              <th className="px-4 py-3 text-left">Matches</th>
              <th className="px-4 py-3 text-left">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr
                key={player.userId}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* Rank */}
                <td className="p-4 font-semibold text-gray-700 flex items-center gap-1">
                  {index + 1}
                  {index === 0 && <Crown className="text-yellow-500 size-5" />}
                </td>

                {/* Player */}
                <td className="px-4 py-3">
                  <div className="font-semibold">{player.displayName}</div>
                  <div className="text-gray-500 text-xs">
                    @{player.username}
                  </div>
                </td>

                {/* Win % */}
                <td className="px-4 py-3 font-bold text-green-600">
                  {player.winPercentage.toFixed(1)}%
                </td>

                {/* Record */}
                <td className="px-4 py-3 text-gray-700">
                  {player.wins}W - {player.losses}L
                </td>

                {/* Matches */}
                <td className="px-4 py-3 text-gray-600">
                  {player.totalMatches}
                </td>

                {/* Points */}
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {player.totalPoints}
                </td>
              </tr>
            ))}

            {leaderboard.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-gray-500 text-sm"
                >
                  No matches played yet. Start playing to see rankings!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
