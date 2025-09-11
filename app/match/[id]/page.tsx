"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Clock, Target } from "lucide-react";

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
      <Card className="shadow-lg rounded-none bg-gradient-to-r from-indigo-500 to-purple-400">
        <CardContent className="p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold">Match Overview</h1>
          <p className="text-zinc-800 font-semibold">{formatDate(match.startTime)}</p>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="text-lg font-semibold text-white">
              {player1.displayName || player1.username}
            </div>
            <span className="text-gray-400 font-medium">VS</span>
            <div className="text-lg font-semibold text-white">
              {player2.displayName || player2.username}
            </div>
          </div>
          <p className="text-emerald-600 bg-white/70 rounded-xl shadow-md w-fit mx-auto p-2 px-4 font-bold flex items-center justify-center gap-2 mt-3">
            <Trophy size={18} />
            {winner
              ? winner.displayName || winner.username
              : "Match still ongoing"}
          </p>
        </CardContent>
      </Card>
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Card>
          <CardContent className="flex items-center gap-4">
            <p className="flex items-center gap-2 text-gray-500 text-sm">
              <Trophy />
              <span>Best Of:</span>
            </p>
            <p className="text-xl font-bold">{match.bestOf}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <p className="flex items-center gap-2 text-gray-500 text-sm">
              <Target className="text-green-500" />
              <span>Total Shots:</span>
            </p>
            <p className="text-xl font-semibold">{totalShots}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <p className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="text-indigo-500" />
              <span>Duration:</span>
            </p>
            <p className="text-xl font-semibold">
              {formatDuration(match.startTime, match.endTime)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Final Score */}
      <Card>
        <CardContent className="text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Final Score
          </h2>
          <p className="text-2xl font-bold">
            {p1Wins} - {p2Wins}
          </p>
        </CardContent>
      </Card>

      {/* Game Breakdown */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Game Breakdown
          </h2>
          {match.games.map((game: any) => (
            <div
              key={game.gameNumber}
              className="flex justify-between items-center border-b last:border-0 py-2 text-sm"
            >
              <span className="font-medium">Game {game.gameNumber}</span>
              <span className="text-gray-600">
                {game.player1Score} - {game.player2Score}
              </span>
              <span className="text-gray-500">
                Winner:{" "}
                {game.winner
                  ? game.winner.displayName || game.winner.username
                  : "Not decided"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shots */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Shots</h2>
          {match.games.map((game: any) => (
            <div key={game.gameNumber}>
              <h3 className="font-semibold text-gray-700 mb-2">
                Game {game.gameNumber}
              </h3>
              <div className="space-y-1">
                {game.shots?.map((shot: any, idx: number) => (
                  <p key={idx} className="text-sm text-gray-600">
                    <span className="font-medium">{shot.shotName}</span> by{" "}
                    {shot.player?.displayName || shot.player?.username} (Point{" "}
                    {shot.pointNumber})
                  </p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </div>
  );
};

export default DetailedMatchPage;
