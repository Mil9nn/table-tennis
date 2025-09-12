"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Clock, Target, Crown, BarChart3, BarChart2, BarChart } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

  if (loading)
    return <p className="text-center py-6">Loading match details...</p>;
  if (error || !match)
    return (
      <p className="text-center text-red-500">{error || "Match not found"}</p>
    );

  const player1 = match.player1;
  const player2 = match.player2;
  const winner = match.winner;

  const totalShots = match.games.reduce(
    (acc: number, g: any) => acc + (g.shots?.length || 0),
    0
  );

  const p1Wins = match.games.filter(
    (g: any) => g.winner?._id === player1._id
  ).length;
  const p2Wins = match.games.filter(
    (g: any) => g.winner?._id === player2._id
  ).length;

  return (
    <div className="space-y-2 py-2">
      {/* Back Button */}
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft size={18} /> Back
      </Button>

      {/* Header */}
      <section className="shadow-lg rounded-none">
        <div className="p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold">Match Overview</h1>
          <p className="text-zinc-800 font-semibold">
            {formatDate(match.startTime)}
          </p>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="text-lg font-semibold text-purple-500">
              {player1.displayName || player1.username}
            </div>
            <span className="text-gray-400 font-medium">VS</span>
            <div className="text-lg font-semibold text-purple-500">
              {player2.displayName || player2.username}
            </div>
          </div>
          <p className="text-emerald-600 bg-white/70 rounded-xl shadow-md w-fit mx-auto p-2 px-4 font-bold flex items-center justify-center gap-2 mt-3">
            <Trophy size={18} />
            {winner
              ? winner.displayName || winner.username
              : "Match still ongoing"}
          </p>
        </div>
      </section>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <section className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-2 text-gray-500 text-sm">
                <Trophy />
                <span>Best Of:</span>
              </p>
              <p className="text-xl font-bold">{match.bestOf}</p>
            </div>
          </section>
          <section className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-2 text-gray-500 text-sm">
                <Target className="text-green-500" />
                <span>Total Shots:</span>
              </p>
              <p className="text-xl font-semibold">{totalShots}</p>
            </div>
          </section>
          <section className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="text-indigo-500" />
                <span>Duration:</span>
              </p>
              <p className="text-xl font-semibold">
                {formatDuration(match.startTime, match.endTime)}
              </p>
            </div>
          </section>
          <section className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center gap-4">
              <h2 className="flex items-center gap-2 font-semibold text-gray-800">
                <BarChart2 />
                Final Score:</h2>
              <p className="text-xl font-bold">
                {p1Wins} - {p2Wins}
              </p>
            </div>
          </section>
        </div>

        {/* Game Breakdown */}
        <section className="w-fit rounded-xl p-6 shadow-md bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">
            Game Breakdown
          </h2>
          <div className="flex flex-col divide-y divide-indigo-100">
            {match.games.map((game: any) => (
              <div
                key={game.gameNumber}
                className="flex justify-between items-center gap-4 py-3 px-2 hover:bg-indigo-50/60 rounded-lg transition"
              >
                {/* Game Number */}
                <span className="whitespace-nowrap font-semibold text-indigo-600">
                  Game {game.gameNumber}
                </span>

                {/* Score */}
                <span className="whitespace-nowrap font-bold bg-zinc-600 text-white px-3 py-1 rounded-lg shadow-sm">
                  {game.player1Score} - {game.player2Score}
                </span>

                <div className="flex itens-center gap-2">
                  <Crown className="size-8 p-2 bg-yellow-500 rounded-full" />
                  <span>{game.winner.username}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shots */}
        <section className="border rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Shots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {match.games.map((game: any) => (
              <div key={game.gameNumber} className="flex flex-col">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Game {game.gameNumber}
                </h3>
                  <div className="space-y-2">
                    {game.shots?.map((shot: any, idx: number) => (
                      <p
                        key={idx}
                        className="text-sm text-gray-700 bg-white border p-2 rounded-md shadow-sm"
                      >
                        <span className="font-medium text-indigo-600">
                          {shot.shotName}
                        </span>{" "}
                        by {shot.player?.displayName || shot.player?.username}{" "}
                        <span className="text-gray-500">
                          (Point {shot.pointNumber})
                        </span>
                      </p>
                    ))}
                  </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DetailedMatchPage;
