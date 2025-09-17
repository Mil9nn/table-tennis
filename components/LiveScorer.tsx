"use client";

import React, { useEffect } from "react";
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
  Trophy,
  Target,
  ArrowLeftCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ShotSelector from "./ShotSelector";
import { useMatchStore } from "@/hooks/useMatchStore";

export default function LiveScorer({ matchId }) {
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
  const currentPlayers = useMatchStore((state) => state.currentPlayers);
  const teamMatchOrder = useMatchStore((state) => state.teamMatchOrder);
  const player1Score = useMatchStore((state) => state.player1Score);
  const player2Score = useMatchStore((state) => state.player2Score);
  const isMatchActive = useMatchStore((state) => state.isMatchActive);
  const updating = useMatchStore((state) => state.updating);
  const currentServer = useMatchStore((state) => state.currentServer);
  const setIsMatchActive = useMatchStore((state) => state.setIsMatchActive);
  const loading = useMatchStore((state) => state.loading);
  const getPlayerName = useMatchStore((state) => state.getPlayerName);
  const getDetailedPlayerInfo = useMatchStore(
    (state) => state.getDetailedPlayerInfo
  );

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId);
    }
  }, [matchId, fetchMatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading match...
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>Match not found</h2>
          <Link href="/matches">
            <Button>Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isTeamMatch = match.matchCategory === "team";
  const isDoubles =
    match.matchCategory === "individual" &&
    (match.matchType === "doubles" || match.matchType === "mixed_doubles");
  const setsToWin = Math.ceil(match.numberOfSets / 2);

  const startMatch = async () => {
    try {
      if (match?.status === "scheduled") {
        const response = await fetch(`/api/matches/${match._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
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
    toast.success("Match paused");
  };

  const addPoint = (player: "player1" | "player2") => {
    updateScore(player, 1);
  };

  const subtractPoint = (player: "player1" | "player2") => {
    updateScore(player, -1);
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

    return (
      categoryMap[match.matchType] ||
      match.matchType.replace("_", " ").toUpperCase()
    );
  };

  const getCurrentGameType = () => {
    if (!match || match.matchCategory !== "team") return null;

    const gameIndex = currentGame - 1;
    if (gameIndex < teamMatchOrder.length) {
      const matchup = teamMatchOrder[gameIndex];
      // Determine if it's singles or doubles based on the matchup
      return matchup.includes("/") ? "Doubles" : "Singles";
    }
    return "Singles";
  };

  return (
    <div className="min-h-screen p-10">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center space-y-4">
          <Link href="/matches" className="active:text-indigo-500 transition-colors">
            <div className="flex items-center gap-2">
              <ArrowLeftCircle className="size-5" />
              Back to matches
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Badge
              variant={match.status === "completed" ? "default" : "secondary"}
            >
              {match.status?.replace("_", " ").toUpperCase()}
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

      <div>
        <h1 className="text-xl font-semibold">
          {isTeamMatch ? (
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {match.team1?.name} vs {match.team2?.name}
            </div>
          ) : isDoubles ? (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {getPlayerName("player1")} vs {getPlayerName("player2")}
            </div>
          ) : (
            `${getPlayerName("player1")} vs ${getPlayerName("player2")}`
          )}
        </h1>
        <p className="text-sm text-gray-600">
          {match.city} • {getMatchTypeDisplay()}
          {isTeamMatch &&
            getCurrentGameType() &&
            ` • Current: ${getCurrentGameType()}`}
        </p>
      </div>

      <div className="container mx-auto py-8 space-y-6">
        {/* Match Status Card */}
        {match.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                🏆 MATCH COMPLETED!
              </h2>
              <div className="text-lg">
                Winner:{" "}
                <strong>
                  <p>
                    Winner:{" "}
                    <strong>
                      {match.winner === "team1"
                        ? match.team1?.name
                        : match.winner === "team2"
                        ? match.team2?.name
                        : match.winner || "—"}
                    </strong>
                  </p>
                </strong>
              </div>
              <p className="text-gray-600">
                Final Score: {match.finalScore?.side1Sets} -{" "}
                {match.finalScore?.side2Sets}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Match Progress */}
        {isTeamMatch && teamMatchOrder.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Match Format Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMatchOrder.map((matchup, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 border rounded ${
                      index === currentGame - 1
                        ? "bg-blue-50 border-blue-200"
                        : index < currentGame - 1
                        ? "bg-gray-50"
                        : "bg-white"
                    }`}
                  >
                    <span className="font-medium">Game {index + 1}</span>
                    <span className="text-sm">{matchup}</span>
                    <div className="flex items-center space-x-2">
                      {index === currentGame - 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {index < currentGame - 1 && (
                        <Badge variant="outline" className="text-xs">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-4">
              <span>
                Best of {match.numberOfSets} • Game {currentGame}
                {isTeamMatch &&
                  getCurrentGameType() &&
                  ` (${getCurrentGameType()})`}
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
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">
                      {getPlayerName("player1")}
                    </h2>
                    {/* Show team info for team matches */}
                    {isTeamMatch && (
                      <p className="text-xs text-gray-500 mt-1">
                        {match.team1?.name}
                      </p>
                    )}
                    {/* Show individual players for doubles */}
                    {isDoubles && !isTeamMatch && match.participants && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>{match.participants[0]}</div>
                        <div>{match.participants[1]}</div>
                      </div>
                    )}
                  </div>
                  {currentServer === "player1" && (
                    <div
                      className="ml-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"
                      title="Serving"
                    ></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-emerald-500 mb-4">
                  {player1Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      setPendingPlayer("player1");
                      setShotDialogOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600"
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
                  Sets Won: {match.finalScore?.side1Sets || 0}
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
                      <div className="font-medium text-yellow-500">serving</div>
                      <div className="text-xs">
                        {currentServer === "player1"
                          ? getPlayerName("player1").split(" / ")[0]
                          : getPlayerName("player2").split(" / ")[0]}
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
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">
                      {getPlayerName("player2")}
                    </h2>
                    {/* Show team info for team matches */}
                    {isTeamMatch && (
                      <p className="text-xs text-gray-500 mt-1">
                        {match.team2?.name}
                      </p>
                    )}
                    {/* Show individual players for doubles */}
                    {isDoubles && !isTeamMatch && match.participants && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>{match.participants[0]}</div>
                        <div>{match.participants[1]}</div>
                      </div>
                    )}
                  </div>
                  {currentServer === "player2" && (
                    <div className="ml-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Serving"></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-rose-500 mb-4">
                  {player2Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      setPendingPlayer("player2");
                      setShotDialogOpen(true);
                    }}
                    className="bg-rose-500 hover:bg-rose-600"
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
                  Sets Won: {match.finalScore?.side2Sets || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shot Tracking */}
        <div className="space-y-4">
          <ShotSelector />
        </div>

        {/* Team Roster Display */}
        {isTeamMatch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {match.team1?.name || "Team 1"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.team1?.players?.map((player, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 rounded ${
                        currentPlayers.side1 === player.name
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{player.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {match.team2?.name || "Team 2"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.team2?.players?.map((player, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 rounded ${
                        currentPlayers.side2 === player.name
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{player.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                    <div className="flex items-center gap-4">
                      {/* Show current players for team matches */}
                      {isTeamMatch && game.currentPlayers && (
                        <span className="text-sm text-gray-600">
                          {game.currentPlayers.side1} vs{" "}
                          {game.currentPlayers.side2}
                        </span>
                      )}
                      <span className="font-semibold text-lg">
                        {game.side1Score} - {game.side2Score}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {game.winner && (
                        <Badge variant="outline" className="text-xs">
                          Won by{" "}
                          {game.winner === "player1"
                            ? isTeamMatch
                              ? game.currentPlayers?.side1 || match.team1?.name
                              : getPlayerName("player1").split(" / ")[0]
                            : isTeamMatch
                            ? game.currentPlayers?.side2 || match.team2?.name
                            : getPlayerName("player2").split(" / ")[0]}
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
