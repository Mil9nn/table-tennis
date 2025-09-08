"use client";

import { Crown } from "lucide-react";
import React, { useEffect, useState } from "react";

function formatDuration(startTime: number, endTime: number) {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const Page = () => {
  const [recentMatches, setRecentMatches] = useState<any>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/match/save")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecentMatches(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading recent matches...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>

      <div className="overflow-x-auto rounded-xl shadow-sm border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gradient-to-br from-indigo-500 to-purple-500 text-gray-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Players</th>
              <th className="px-4 py-3 text-left">Winner</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {recentMatches?.matches.map((match: any, idx: number) => {
              const isExpanded = expandedMatch === match._id;
              return (
                <React.Fragment key={match._id}>
                  {/* --- Main Row --- */}
                  <tr
                    className="border-t hover:bg-indigo-500 transition cursor-pointer"
                    onClick={() =>
                      setExpandedMatch(isExpanded ? null : match._id)
                    }
                  >
                    {/* S.No */}
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>

                    {/* Players */}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {match.player1.username}{" "}
                      <span className="text-gray-500 font-normal">vs</span>{" "}
                      {match.player2.username}
                    </td>

                    {/* Winner */}
                    <td className="px-4 py-3 text-gray-800 flex items-center gap-1">
                      {match.winner.username}
                      <Crown className="text-yellow-500 size-4" />
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-gray-500">
                      {formatDuration(match.startTime, match.endTime)}
                    </td>

                    {/* Final Score */}
                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {match.finalScore || `${match.games.length}-0`}
                    </td>
                  </tr>

                  {/* --- Expanded Row --- */}
                  {isExpanded && (
                    <tr className="bg-gray-50 border-t">
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {/* Expanded details here */}
                        <p className="mb-2">
                          <strong>Best Of:</strong> {match.bestOf}
                        </p>
                        <p className="mb-2">
                          <strong>Total Points:</strong>{" "}
                          {match.stats.totalPoints}
                        </p>
                        <p className="mb-2">
                          <strong>Total Shots:</strong> {match.stats.totalShots}
                        </p>

                        {/* Games */}
                        <div className="mt-2">
                          <strong>Games:</strong>
                          <ul className="list-disc list-inside text-gray-600">
                            {match.games.map((game: any) => (
                              <li key={game.gameNumber}>
                                Game {game.gameNumber}: {game.player1Score} -{" "}
                                {game.player2Score} (Winner:{" "}
                                {game.winner === 1
                                  ? match.player1.username
                                  : match.player2.username}
                                )
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Player Stats */}
                        <div className="mt-4">
                          <strong>Player Stats:</strong>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {/* Player 1 */}
                            <div className="border p-2 rounded">
                              <p className="font-medium">
                                {match.player1.displayName}
                              </p>
                              <p>
                                Games Won:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player1.username
                                  ]?.gamesWon
                                }
                              </p>
                              <p>
                                Total Points:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player1.username
                                  ]?.totalPoints
                                }
                              </p>
                              <p>
                                Favorite Shot:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player1.username
                                  ]?.favoriteShot
                                }
                              </p>
                            </div>

                            {/* Player 2 */}
                            <div className="border p-2 rounded">
                              <p className="font-medium">
                                {match.player2.displayName}
                              </p>
                              <p>
                                Games Won:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player2.username
                                  ]?.gamesWon
                                }
                              </p>
                              <p>
                                Total Points:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player2.username
                                  ]?.totalPoints
                                }
                              </p>
                              <p>
                                Favorite Shot:{" "}
                                {
                                  match.stats.playerStats[
                                    match.player2.username
                                  ]?.favoriteShot
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
