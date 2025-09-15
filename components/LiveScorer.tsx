"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  Users,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ShotSelector from "./ShotSelector";
import { useMatchStore } from "@/hooks/useMatchStore";

export default function PlayMatch({ matchId }) {
  const router = useRouter();

  // useMatchStore states and actions
  const fetchMatch = useMatchStore((state) => state.fetchMatch);
  const updateScore = useMatchStore((state) => state.updateScore);
  const resetGame = useMatchStore((state) => state.resetGame);

  const isDeuce = useMatchStore((state) => state.isDeuce);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const serveCount = useMatchStore((state) => state.serveCount);

  const match = useMatchStore((state) => state.match);
  const setMatch = useMatchStore((state) => state.setMatch);
  const currentGame = useMatchStore((state) => state.currentGame);
  const player1Score = useMatchStore((state) => state.player1Score);
  const player2Score = useMatchStore((state) => state.player2Score);
  const isMatchActive = useMatchStore((state) => state.isMatchActive);
  const updating = useMatchStore((state) => state.updating);
  const currentServer = useMatchStore((state) => state.currentServer);
  const setIsMatchActive = useMatchStore((state) => state.setIsMatchActive);
  const loading = useMatchStore((state) => state.loading);

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId);
    }
  }, [matchId]);

  const addPoint = (player: "player1" | "player2") => {
    updateScore(player, 1);
  };

  const subtractPoint = (player: "player1" | "player2") => {
    updateScore(player, -1);
  };

  const startMatch = async () => {
    try {
      if (match?.status === "scheduled") {
        const response = await fetch(`/api/matches/${matchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });

        if (response.ok) {
          setMatch({ ...match, status: "in_progress"});
        }
      }

      setIsMatchActive(true);
      toast.success("🏁 Match started!");
    } catch (error) {
      console.error("Error starting match:", error);
      toast.error("Failed to start match");
    }
  };

  const pauseMatch = () => {
    setIsMatchActive(false);
    toast.success("⏸️ Match paused");
  };

  const getPlayerName = (player: "player1" | "player2") => {
    if (!match) return player === "player1" ? "Player 1" : "Player 2";

    if (match.matchCategory === "individual") {
      if (match.matchType === "singles") {
        return player === "player1"
          ? match.players?.player1?.name || "Player 1"
          : match.players?.player2?.name || "Player 2";
      } else {
        // Doubles or Mixed Doubles
        return player === "player1"
          ? `${match.players?.player1?.name || "P1A"} / ${
              match.players?.player2?.name || "P1B"
            }`
          : `${match.players?.player3?.name || "P2A"} / ${
              match.players?.player4?.name || "P2B"
            }`;
      }
    } else {
      return player === "player1"
        ? match.team1?.name || "Team 1"
        : match.team2?.name || "Team 2";
    }
  };

  const getMatchTypeDisplay = () => {
    if (!match) return "";

    const categoryMap = {
      singles: "Singles",
      doubles: "Doubles",
      mixed_doubles: "Mixed Doubles",
      five_singles: "5 Singles",
      single_double_single: "SDS Format",
      extended_format: "Extended",
      three_singles: "3 Singles",
      custom: "Custom",
    };

    return categoryMap[match.matchType] || match.matchType.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Match not found</h2>
          <Link href="/matches">
            <Button>Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const setsToWin = Math.ceil(match.numberOfSets / 2);
  const player1Name = getPlayerName("player1");
  const player2Name = getPlayerName("player2");
  const isDoublesFormat =
    match.matchType === "doubles" || match.matchType === "mixed_doubles";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Matches
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">
                {isDoublesFormat ? (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {player1Name} vs {player2Name}
                  </div>
                ) : (
                  `${player1Name} vs ${player2Name}`
                )}
              </h1>
              <p className="text-sm text-gray-600">
                {match.city} • {getMatchTypeDisplay()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={match.status === "completed" ? "default" : "secondary"}
            >
              {match.status.replace("_", " ").toUpperCase()}
            </Badge>
            {isDeuce && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                DEUCE
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-6">
        {/* Match Status Card */}
        {match.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                🏆 MATCH COMPLETED!
              </h2>
              <p className="text-lg">
                Winner:{" "}
                <strong>
                  {match.winner === "player1" ? player1Name : player2Name}
                </strong>
              </p>
              <p className="text-gray-600">
                Final Score: {match.finalScore?.player1Sets} -{" "}
                {match.finalScore?.player2Sets}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Score Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-4">
              <span>
                Best of {match.numberOfSets} • Game {currentGame}
              </span>
              {isDeuce && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700"
                >
                  Deuce - Win by 2
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Player 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-lg font-semibold text-center">
                    {player1Name}
                  </h2>
                  {currentServer === "player1" && (
                    <div
                      className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                      title="Serving"
                    ></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {player1Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      setPendingPlayer("player1");
                      setShotDialogOpen(true);
                    }}
                    className="bg-green-500 hover:bg-green-600"
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => subtractPoint("player1")}
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Sets Won: {match.finalScore?.player1Sets || 0}
                </div>
              </div>

              {/* Center Controls */}
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-gray-400">VS</div>

                <div className="text-sm text-gray-600">
                  {isDeuce ? (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <div className="font-semibold text-yellow-700">DEUCE</div>
                      <div className="text-xs">Alternating serves</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Serving</div>
                      <div className="text-xs">
                        {currentServer === "player1"
                          ? player1Name.split(" / ")[0]
                          : player2Name.split(" / ")[0]}
                        {!isDeuce && ` (${2 - serveCount} serves left)`}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-2">
                  {match.status !== "completed" && (
                    <Button
                      variant={isMatchActive ? "destructive" : "default"}
                      onClick={isMatchActive ? pauseMatch : startMatch}
                      disabled={updating}
                    >
                      {isMatchActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isMatchActive ? "Pause" : "Start"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={resetGame}
                    disabled={updating || match.status === "completed"}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  First to {setsToWin} sets wins
                </div>
              </div>

              {/* Player 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-lg font-semibold text-center">
                    {player2Name}
                  </h2>
                  {currentServer === "player2" && (
                    <div
                      className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                      title="Serving"
                    ></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-red-600 mb-4">
                  {player2Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      setPendingPlayer("player2");
                      setShotDialogOpen(true);
                    }}
                    className="bg-green-500 hover:bg-green-600"
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => subtractPoint("player2")}
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Sets Won: {match.finalScore?.player2Sets || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shot Tracking */}
        <div className="space-y-4">
          <ShotSelector />
        </div>

        {/* Games History */}
        {match.games && match.games.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Games History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {match.games.map((game, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 border rounded ${
                      game.gameNumber === currentGame && !game.winner
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <span className="font-medium">Game {game.gameNumber}</span>
                    <span className="font-semibold text-lg">
                      {game.player1Score} - {game.player2Score}
                    </span>
                    <div className="flex items-center space-x-2">
                      {game.winner && (
                        <Badge variant="outline" className="text-xs">
                          Won by{" "}
                          {game.winner === "player1"
                            ? player1Name.split(" / ")[0]
                            : player2Name.split(" / ")[0]}
                        </Badge>
                      )}
                      {game.gameNumber === currentGame && !game.winner && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          <Link href={`/matches/${matchId}/stats`}>
            <Button variant="outline">View Statistics</Button>
          </Link>
          <Link href={`/matches/${matchId}`}>
            <Button variant="outline">Match Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
