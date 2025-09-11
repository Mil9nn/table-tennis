"use client";

import { Clock, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// FIX: Create a simple formatDuration function since it might be missing
const formatDuration = (startTime: number, endTime: number) => {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

const Page = () => {
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecentMatches = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching recent matches...");

        // FIX: Use the correct API endpoint - GET request to fetch matches
        const response = await fetch("/api/match/save", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        if (data.success && data.matches) {
          setRecentMatches(data.matches);
        } else if (data.success && Array.isArray(data)) {
          // Handle case where data is directly an array
          setRecentMatches(data);
        } else {
          console.warn("Unexpected data format:", data);
          setRecentMatches([]);
        }
      } catch (error) {
        console.error("Error fetching recent matches:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch matches"
        );
        setRecentMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMatches();
  }, []); // FIX: Remove dependency array issues

  const handleRowClick = (matchId: string) => {
    console.log("Navigating to match:", matchId);
    router.push(`/match/${matchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[90vh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recent matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Matches
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="p-2">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Recent Matches</h1>
        <p className="text-gray-600 my-2">
          Latest match results - click on any match row to see comprehensive
          match statistics
        </p>

        {recentMatches.length === 0 ? (
          // Empty State
          <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No matches found
            </h3>
            <p className="text-gray-500">
              Start playing to see your match history here!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-xl border bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Match #</th>
                  <th className="px-6 py-4 text-left font-semibold">Players</th>
                  <th className="px-6 py-4 text-left font-semibold">Winner</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Final Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((match: any, idx: number) => {
                  // FIX: Handle different possible data structures
                  const matchId = match._id || match.id || `match-${idx}`;

                  // Handle populated vs non-populated player data
                  const getPlayerName = (player: any) => {
                    if (typeof player === "string")
                      return `User-${player.slice(-4)}`; // Show last 4 chars of ID
                    return (
                      player?.username ||
                      player?.displayName ||
                      "Unknown Player"
                    );
                  };

                  const getWinnerName = (winner: any) => {
                    if (typeof winner === "string")
                      return `Winner-${winner.slice(-4)}`;
                    return (
                      winner?.username ||
                      winner?.displayName ||
                      "Unknown Winner"
                    );
                  };

                  // Safe access to nested properties
                  const player1Name = getPlayerName(match.player1);
                  const player2Name = getPlayerName(match.player2);
                  const winnerName = getWinnerName(match.winner);

                  const startTime = match.startTime || Date.now();
                  const endTime = match.endTime || startTime + 1000000; // Default 1000s if no endTime

                  const gamesCount = match.games?.length || 0;

                  function getMatchScore(match: any) {
                    const player1Id = match.player1.toString();
                    const player2Id = match.player2.toString();

                    let player1GamesWon = 0;
                    let player2GamesWon = 0;

                    match.games.forEach((game: any) => {
                      const winnerId = game.winner?.toString();
                      if (!winnerId) return;

                      if (winnerId === player1Id) {
                        player1GamesWon++;
                      } else if (winnerId === player2Id) {
                        player2GamesWon++;
                      }
                    });

                    return `${player1GamesWon} - ${player2GamesWon}`;
                  }

                  return (
                    <tr
                      key={matchId}
                      className="border-t hover:bg-indigo-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(matchId)}
                    >
                      {/* Match Number */}
                      <td className="px-6 py-4 font-bold text-gray-700">
                        <span className="text-lg">#{idx + 1}</span>
                      </td>

                      {/* Players */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {player1Name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm text-gray-800">
                              {player1Name}
                            </span>
                          </div>
                          <span className="bg-gradient-to-b from-indigo-500 text-sm font-semibold to-red-500 bg-clip-text text-transparent">
                            Vs
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {player2Name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm text-gray-800">
                              {player2Name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Winner */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {winnerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-800 flex items-center gap-1">
                              {winnerName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 font-medium">
                            {formatDuration(startTime, endTime)}
                          </span>
                        </div>
                      </td>

                      {/* Final Score: 2-0, 1 - 2 etc*/}
                      <td className="px-6 py-4 font-bold text-gray-800 text-lg">
                        {getMatchScore(match)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
