"use client";

import {
  Crown,
  Clock,
  Trophy,
  Target,
  BarChart3,
  ArrowLeft,
  Calendar,
  Airplay,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DetailedMatchPage = () => {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const matchId = params.id;

  useEffect(() => {
    if (matchId) fetchMatchDetails(matchId as string);
  }, [matchId]);

  const fetchMatchDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/matches/${id}`);
      const data = await response.json();
      if (data.success) setMatch(data.match);
      else setError("Match not found");
    } catch (error) {
      setError("Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => router.back();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Match Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goBack}
          className="p-2 hover:bg-white hover:shadow rounded-lg transition flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-right text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(match.startTime)}
        </div>
      </div>

      {/* Match Overview */}
      <div className="bg-white rounded-2xl shadow-xl border p-8 mb-10">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Match Overview
        </h1>
        <div className="flex items-center justify-center gap-12 relative">
          {/* Player 1 */}
          <div className="flex flex-col items-center relative">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md
                ${
                  match.winner.username === match.player1.username
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 ring-4 ring-yellow-300"
                    : "bg-gradient-to-br from-indigo-500 to-purple-500"
                }`}
            >
              {match.player1.username.charAt(0).toUpperCase()}
            </div>
            <span className="mt-3 font-semibold text-gray-700">
              {match.player1.displayName}
            </span>
          </div>

          <div className="text-3xl font-bold text-gray-300">VS</div>

          {/* Player 2 */}
          <div className="flex flex-col items-center relative">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md
                ${
                  match.winner.username === match.player2.username
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 ring-4 ring-yellow-300"
                    : "bg-gradient-to-br from-purple-500 to-indigo-500"
                }`}
            >
              {match.player2.username.charAt(0).toUpperCase()}
            </div>
            <span className="mt-3 font-semibold text-gray-700">
              {match.player2.displayName}
            </span>
          </div>
        </div>

        {/* Winner Badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-yellow-400 text-white font-bold shadow text-sm">
            <Crown className="w-4 h-4 mr-1" /> Winner: {match.winner.displayName}
          </span>
        </div>

        {/* Match Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <div className="flex flex-col items-center">
            <Airplay className="w-6 h-6 text-indigo-500 mb-2" />
            <span className="text-gray-600 text-sm">Match Type</span>
            <p className="font-semibold">Best Of {match.bestOf}</p>
          </div>
          <div className="flex flex-col items-center">
            <Target className="w-6 h-6 text-purple-500 mb-2" />
            <span className="text-gray-600 text-sm">Total Shots</span>
            <p className="font-semibold">{match.stats.totalShots}</p>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="w-6 h-6 text-pink-500 mb-2" />
            <span className="text-gray-600 text-sm">Duration</span>
            <p className="font-semibold">
              {formatDuration(match.startTime, match.endTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Games Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl border p-6 mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Game Breakdown</h2>
        {match.games.map((game: any) => (
          <div
            key={game.gameNumber}
            className="flex justify-between items-center p-3 border-b last:border-0"
          >
            <span className="font-medium text-gray-700">
              Game {game.gameNumber}
            </span>
            <span className="font-bold text-gray-800">
              {game.player1Score} - {game.player2Score}
            </span>
          </div>
        ))}
        <div className="text-center mt-4 font-semibold text-gray-900">
          Final Score:{" "}
          {match.finalScore ||
            `${match.games.filter((g: any) => g.winner === 1).length} - ${
              match.games.filter((g: any) => g.winner === 2).length
            }`}
        </div>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {[match.player1, match.player2].map((player: any, idx: number) => (
          <div key={player.username} className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {player.displayName}
                </h3>
                <p className="text-gray-500">@{player.username}</p>
              </div>
              {match.winner.username === player.username && (
                <Crown className="w-6 h-6 text-yellow-500 ml-auto" />
              )}
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Favorite Shot:</span>
              <span className="font-bold text-purple-600">
                {match.stats.playerStats[player.username]?.favoriteShot || "N/A"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Longest Rally */}
        <div className="bg-white rounded-2xl shadow-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Longest Rally
          </h3>
          <ul className="space-y-2 text-sm">
            {match?.stats.longestGame.shots.map((shot: any, index: number) => (
              <li key={index} className="flex justify-between border-b pb-1 last:border-0">
                <span>
                  Shot {index + 1}: {shot.shotName}
                </span>
                <span className="text-gray-500">by {shot.player}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Shot Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Shot Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(match.stats.shotBreakdown || {}).map(
              ([shot, count]) => (
                <div
                  key={shot}
                  className="flex justify-between text-sm border-b pb-1 last:border-0"
                >
                  <span>{shot}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMatchPage;
