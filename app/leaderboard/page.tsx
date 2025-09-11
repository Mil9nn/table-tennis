"use client";

import React, { useEffect, useState } from "react";
import {
  Crown,
  Trophy,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";

interface PlayerStats {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  totalPoints: number;
  totalGames: number;
  gamesWon: number;
  avgPointsPerGame: number;
  avgPointsPerMatch: number;
  totalPlayTime: number;
  avgGameDuration: number;
  totalShots: number;
  favoriteShot: string;
  favoriteShotCount: number;
  leastUsedShot: string;
  leastUsedShotCount: number;
  shotBreakdown: Array<{
    shot: string;
    count: number;
    percentage: number;
  }>;
  recentForm: string[];
  bestOpponents: Array<{
    opponentName: string;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  worstOpponents: Array<{
    opponentName: string;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  matchHistory: Array<{
    opponent: string;
    result: string;
    score: string;
    duration: number;
    date: string;
    totalPoints: number;
  }>;
}

interface LeaderboardPlayer {
  userId: string;
  username: string;
  displayName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  totalPoints: number;
  totalGames: number;
  gamesWon: number;
}

const EnhancedLeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(
    null
  );
  const [playerDetailsLoading, setPlayerDetailsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Leaderboard data:", leaderboard);

  const fetchPlayerDetails = async (playerId: string) => {
    setPlayerDetailsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard/player/${playerId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPlayer(data.player);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch player details:", error);
    } finally {
      setPlayerDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="p-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Trophy className="size-10 text-white bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-full" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Leaderboard</h1>
        </div>

        <p className="text-gray-600 my-2">Top performing table tennis players</p>

        <div className="overflow-x-auto rounded-2xl shadow-xl border bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Rank</th>
                <th className="px-6 py-4 text-left font-semibold">Player</th>
                <th className="px-6 py-4 text-left font-semibold">Win Rate</th>
                <th className="px-6 py-4 text-left font-semibold">Record</th>
                <th className="px-6 py-4 text-left font-semibold">Matches</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Total Points
                </th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr
                  key={player.userId}
                  className="border-t hover:bg-indigo-50 transition-colors cursor-pointer"
                  onClick={() => fetchPlayerDetails(player.userId)}
                >
                  <td className="px-6 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">#{index + 1}</span>
                      {index === 0 && (
                        <Crown className="text-yellow-500 w-5 h-5" />
                      )}
                      {index === 1 && (
                        <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                      )}
                      {index === 2 && (
                        <div className="w-5 h-5 bg-amber-600 rounded-full"></div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {player.displayName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          @{player.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-green-600">
                        {player.winPercentage.toFixed(1)}%
                      </span>
                      {player.winPercentage >= 70 && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      {player.winPercentage < 50 && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium">
                      <span className="text-green-600">{player.wins}W</span> -{" "}
                      <span className="text-red-600">{player.losses}L</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {player.totalMatches}
                  </td>

                  <td className="px-6 py-4 font-bold text-gray-800 text-lg">
                    {player.totalPoints.toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchPlayerDetails(player.userId);
                      }}
                      disabled={playerDetailsLoading}
                      className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition disabled:opacity-50"
                    >
                      {playerDetailsLoading ? "Loading..." : "View Stats"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Player Details Modal */}
        {showModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedPlayer?.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedPlayer?.username}
                    </h2>
                    <p className="text-gray-500">Player Statistics</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Win Rate</p>
                        <p className="text-2xl font-bold">
                          {selectedPlayer?.winPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-green-100" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Matches</p>
                        <p className="text-2xl font-bold">
                          {selectedPlayer?.totalMatches}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-100" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-400 to-purple-500 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Points</p>
                        <p className="text-2xl font-bold">
                          {selectedPlayer?.totalPoints.toLocaleString()}
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-purple-100" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Play Time</p>
                        <p className="text-2xl font-bold">
                          {formatDuration(selectedPlayer?.totalPlayTime)}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-100" />
                    </div>
                  </div>
                </div>

                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Performance Stats */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Average Points/Game:
                        </span>
                        <span className="font-semibold">
                          {selectedPlayer?.avgPointsPerGame?.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Average Points/Match:
                        </span>
                        <span className="font-semibold">
                          {selectedPlayer?.avgPointsPerMatch?.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Games Won:</span>
                        <span className="font-semibold">
                          {selectedPlayer?.gamesWon}/{selectedPlayer?.totalGames}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Average Game Duration:
                        </span>
                        <span className="font-semibold">
                          {formatDuration(selectedPlayer?.avgGameDuration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shot Statistics */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Shot Analysis
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Favorite Shot:</span>
                          <span className="font-semibold">
                            {selectedPlayer?.favoriteShot}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Used {selectedPlayer?.favoriteShotCount} times
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Total Shots:</span>
                          <span className="font-semibold">
                            {selectedPlayer?.totalShots?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">
                            Least Used Shot:
                          </span>
                          <span className="font-semibold">
                            {selectedPlayer?.leastUsedShot}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Used {selectedPlayer?.leastUsedShotCount} times
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Form */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Recent Form
                    </h3>
                    <div className="flex gap-1">
                      {selectedPlayer?.recentForm?.map((result, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            result === "W" ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opponent Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Opponent Analysis
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Best Against:
                        </h4>
                        {selectedPlayer?.bestOpponents?.slice(0, 3)
                          .map((opp, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{opp.opponentName}</span>
                              <span className="text-green-600">
                                {opp.winRate.toFixed(0)}% ({opp.wins}W-
                                {opp.losses}L)
                              </span>
                            </div>
                          ))}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Struggles Against:
                        </h4>
                        {selectedPlayer?.worstOpponents?.slice(0, 3)
                          .map((opp, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{opp.opponentName}</span>
                              <span className="text-red-600">
                                {opp.winRate.toFixed(0)}% ({opp.wins}W-
                                {opp.losses}L)
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Matches */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Recent Matches
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Opponent</th>
                          <th className="px-4 py-2 text-left">Result</th>
                          <th className="px-4 py-2 text-left">Score</th>
                          <th className="px-4 py-2 text-left">Points</th>
                          <th className="px-4 py-2 text-left">Duration</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlayer?.matchHistory?.slice(0, 10)
                          .map((match, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">{match.opponent}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    match.result === "WIN"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {match.result}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {match.score}
                              </td>
                              <td className="px-4 py-2">{match.totalPoints}</td>
                              <td className="px-4 py-2">
                                {formatDuration(match.duration)}
                              </td>
                              <td className="px-4 py-2">
                                {formatDate(match.date)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedLeaderboardPage;
