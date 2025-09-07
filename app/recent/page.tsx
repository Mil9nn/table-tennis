"use client";

import { Crown } from "lucide-react";
import React, { useEffect, useState } from "react";

function formatDuration(startTime, endTime) {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const Page = () => {
  const [recentMatches, setRecentMatches] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/match/save")
      .then((res) => res.json())
      .then((data) => setRecentMatches(data));
  }, []);

  console.log("Recent Matches:", recentMatches);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>

      {recentMatches?.matches.map((match) => {
        const isExpanded = expandedMatch === match._id;
        return (
          <div
            key={match._id}
            className="relative bg-white shadow-sm border rounded-2xl px-6 py-3 mb-3 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setExpandedMatch(isExpanded ? null : match._id)}
          >
            {/* --- Summary row --- */}
            <div className="flex items-center justify-between">
              {/* Player 1 */}
              <div className="relative flex items-center">
                <span className="text-gray-800 font-medium">
                  {match.player1.username}
                </span>
                {match.winner.userId === match.player1.userId && (
                  <Crown className="absolute -top-3 -left-4 text-yellow-500 size-4 drop-shadow-sm" />
                )}
              </div>

              {/* VS divider */}
              <span className="text-xs font-semibold text-gray-500 tracking-wider">
                VS
              </span>

              {/* Player 2 */}
              <div className="relative flex items-center">
                <span className="text-gray-800 font-medium">
                  {match.player2.username}
                </span>
                {match.winner.userId === match.player2.userId && (
                  <Crown className="absolute -top-3 -right-4 text-yellow-500 size-4 drop-shadow-sm" />
                )}
              </div>

              {/* Match duration */}
              <span className="absolute bottom-0 right-0 text-[11px] bg-blue-500 rounded-full px-2 py-0.5 text-white">
                {formatDuration(match.startTime, match.endTime)}
              </span>
            </div>

            {/* --- Expanded details --- */}
            {isExpanded && (
              <div className="mt-3 border-t pt-3 text-sm text-gray-700">
                <p className="mb-2">
                  <strong>Best Of:</strong> {match.bestOf}
                </p>
                <p className="mb-2">
                  <strong>Total Points:</strong> {match.stats.totalPoints}
                </p>
                <p className="mb-2">
                  <strong>Total Shots:</strong> {match.stats.totalShots}
                </p>

                {/* Games */}
                <div className="mt-2">
                  <strong>Games:</strong>
                  <ul className="list-disc list-inside text-gray-600">
                    {match.games.map((game) => (
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
                      <p className="font-medium">{match.player1.displayName}</p>
                      <p>
                        Games Won:{" "}
                        {match.stats.playerStats[match.player1.username]?.gamesWon}
                      </p>
                      <p>
                        Total Points:{" "}
                        {match.stats.playerStats[match.player1.username]?.totalPoints}
                      </p>
                      <p>
                        Favorite Shot:{" "}
                        {
                          match.stats.playerStats[match.player1.username]
                            ?.favoriteShot
                        }
                      </p>
                    </div>

                    {/* Player 2 */}
                    <div className="border p-2 rounded">
                      <p className="font-medium">{match.player2.displayName}</p>
                      <p>
                        Games Won:{" "}
                        {match.stats.playerStats[match.player2.username]?.gamesWon}
                      </p>
                      <p>
                        Total Points:{" "}
                        {match.stats.playerStats[match.player2.username]?.totalPoints}
                      </p>
                      <p>
                        Favorite Shot:{" "}
                        {
                          match.stats.playerStats[match.player2.username]
                            ?.favoriteShot
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Page;
