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
  Users,
  Trophy,
  ArrowLeftCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ShotSelector from "./ShotSelector";
import { useMatchStore } from "@/hooks/useMatchStore";

export default function LiveScorer({ matchId }) {
  // store hooks
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const updateScore = useMatchStore((s) => s.updateScore);
  const resetGame = useMatchStore((s) => s.resetGame);

  const isDeuce = useMatchStore((s) => s.isDeuce);
  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const serveCount = useMatchStore((s) => s.serveCount);

  const match = useMatchStore((s) => s.match);
  const currentGame = useMatchStore((s) => s.currentGame);
  const currentTie = useMatchStore((s) => s.currentTie);
  const currentPlayers = useMatchStore((s) => s.currentPlayers);
  const teamMatchOrder = useMatchStore((s) => s.teamMatchOrder);
  const player1Score = useMatchStore((s) => s.player1Score);
  const player2Score = useMatchStore((s) => s.player2Score);
  const isMatchActive = useMatchStore((s) => s.isMatchActive);
  const updating = useMatchStore((s) => s.updating);
  const currentServer = useMatchStore((s) => s.currentServer);
  const setIsMatchActive = useMatchStore((s) => s.setIsMatchActive);
  const loading = useMatchStore((s) => s.loading);
  const getDetailedPlayerInfo = useMatchStore((s) => s.getDetailedPlayerInfo);

  // derived detailed info for left/right
  const p1 = getDetailedPlayerInfo("player1");
  const p2 = getDetailedPlayerInfo("player2");

  useEffect(() => {
    if (matchId) fetchMatch(matchId);
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

  const setsToWin =
    match.matchCategory === "team"
      ? Math.ceil(match.setsPerTie / 2) // per tie
      : Math.ceil(match.numberOfSets / 2); // individual

  const startMatch = async () => {
    try {
      if (match?.status === "scheduled") {
        await fetch(`/api/matches/${match._id}`, {
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
      // if you store order as structured objects later, adjust accordingly
      return matchup.includes("/") ? "Doubles" : "Singles";
    }
    return "Singles";
  };

  // helper to safely show symbol + name for a team player (handles Map or plain object)
  const getSymbolFor = (team: any, playerId: string | undefined) => {
    if (!team || !playerId) return undefined;
    const asObj =
      team.assignments && typeof team.assignments === "object"
        ? team.assignments
        : null;
    // Mongoose Map might expose get()
    if (typeof team.assignments?.get === "function") {
      return team.assignments.get(playerId) ?? undefined;
    }
    return asObj?.[playerId];
  };

  // small helper that renders symbol + name when available
  const displaySymbolName = (symbol: string | undefined, name: string) =>
    symbol ? `${symbol} (${name})` : name;

  const currentSymbol1 = currentPlayers.side1?.split(" ")[0];
  const currentSymbol2 = currentPlayers.side2?.split(" ")[0];

  return (
    <div className="min-h-screen sm:p-10">
      {/* Header */}
      <header className="max-sm:px-4 max-sm:py-2">
        <div className="flex justify-between items-center space-y-4">
          <Link
            href="/matches"
            className="active:text-indigo-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftCircle className="size-5" />
              Back to matches
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Badge
              className="rounded-full border-2 border-black text-xs px-3 py-1"
              variant={match.status === "completed" ? "default" : "secondary"}
            >
              {match.status?.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-sm:px-4">
        <h1 className="text-xl font-semibold">
          {isTeamMatch ? (
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {match.team1?.name} vs {match.team2?.name}
            </div>
          ) : isDoubles ? (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {displaySymbolName(p1.symbol, p1.name)} vs{" "}
              {displaySymbolName(p2.symbol, p2.name)}
            </div>
          ) : (
            `${displaySymbolName(p1.symbol, p1.name)} vs ${displaySymbolName(
              p2.symbol,
              p2.name
            )}`
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
                <strong>
                  Winner:{" "}
                  {match.winner === "team1"
                    ? match.team1?.name
                    : match.winner === "team2"
                    ? match.team2?.name
                    : match.winner === "player1"
                    ? p1.name
                    : match.winner === "player2"
                    ? p2.name
                    : "—"}
                </strong>
              </div>
              <p className="text-gray-600">
                Final Score: {match.finalScore?.side1Sets} -{" "}
                {match.finalScore?.side2Sets}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Score Display */}
        <div className="">
          <header className="p-2">
            <div className="text-center flex items-center justify-center gap-4">
              <span>
                {isTeamMatch
                  ? `Best of ${match.setsPerTie} per tie`
                  : `Best of ${match.numberOfSets}`}{" "}
                • <span className="text-indigo-500">Game {currentGame}</span>
                {isTeamMatch &&
                  getCurrentGameType() &&
                  ` (${getCurrentGameType()})`}
              </span>
            </div>
          </header>

          <div>
            {/* Scoring Controls Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 sm:gap-4 items-center">
              {/* Left Side (Player 1 | Team 1) */}
              <section className="text-center order-1">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">
                      {displaySymbolName(p1.symbol, p1.name)}
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
                        <div>
                          {match.participants[0]?.fullName ??
                            match.participants[0]?.username ??
                            match.participants[0]}
                        </div>
                        <div>
                          {match.participants[1]?.fullName ??
                            match.participants[1]?.username ??
                            match.participants[1]}
                        </div>
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
                  <button
                    onClick={() => {
                      setPendingPlayer("player1");
                      setShotDialogOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 p-8 w-full rounded-md shadow-md text-white"
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => subtractPoint("player1")}
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                    className="bg-white hover:bg-gray-300 p-8 w-full rounded-md shadow-md text-gray-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {isTeamMatch
                    ? `Ties Won: ${match.finalScore?.side1Ties ?? 0}`
                    : `Sets Won: ${match.finalScore?.side1Sets ?? 0}`}
                </div>
              </section>

              {/* Center Controls */}
              <section className="text-center space-y-4 col-span-2 md:col-span-1 order-3 md:order-2">
                <div className="text-2xl font-bold max-sm:hidden text-gray-400">
                  VS
                </div>

                <div className="text-sm text-gray-600">
                  {isDeuce ? (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <div className="font-semibold text-yellow-700">DEUCE</div>
                      <div className="text-xs">Alternating serves</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-yellow-500">serving</div>
                      {/* <div className="text-xs">
                        {currentServer === "player1"
                          ? p1.symbol ?? p1.name.split(" / ")[0]
                          : p2.symbol ?? p2.name.split(" / ")[0]}
                        {!isDeuce && ` (${2 - serveCount} serves left)`}
                      </div> */}
                      <div>
                        <div className="font-medium text-yellow-500">
                          Serving
                        </div>
                        <div className="text-xs">
                          {currentServer === "player1" ? p1.name : p2.name}
                          {!isDeuce && ` (${2 - serveCount} serves left)`}
                        </div>
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
                  {isTeamMatch
                    ? `Each tie is first to ${setsToWin} sets`
                    : `First to ${setsToWin} sets wins`}
                </div>
              </section>

              {/* Player 2 */}
              <section className="text-center order-2 md:order-3">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">
                      {displaySymbolName(p2.symbol, p2.name)}
                    </h2>
                    {isTeamMatch && (
                      <p className="text-xs text-gray-500 mt-1">
                        {match.team2?.name}
                      </p>
                    )}
                    {isDoubles && !isTeamMatch && match.participants && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>
                          {match.participants[2]?.fullName ??
                            match.participants[2]?.username ??
                            match.participants[2]}
                        </div>
                        <div>
                          {match.participants[3]?.fullName ??
                            match.participants[3]?.username ??
                            match.participants[3]}
                        </div>
                      </div>
                    )}
                  </div>
                  {currentServer === "player2" && (
                    <div
                      className="ml-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"
                      title="Serving"
                    ></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-rose-500 mb-4">
                  {player2Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <button
                    onClick={() => {
                      setPendingPlayer("player2");
                      setShotDialogOpen(true);
                    }}
                    className="bg-rose-500 hover:bg-rose-600 p-8 w-full rounded-md shadow-md text-white"
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => subtractPoint("player2")}
                    disabled={
                      !isMatchActive || updating || match.status === "completed"
                    }
                    className="bg-white p-8 w-full rounded-md shadow-md text-gray-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {isTeamMatch
                    ? `Ties Won: ${match.finalScore?.side2Ties ?? 0}`
                    : `Sets Won: ${match.finalScore?.side2Sets ?? 0}`}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Team Match Progress */}
        {isTeamMatch && match.ties && match.ties.length > 0 && (
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Match Format Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {match.ties.map((tie, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 border rounded ${
                      index === currentTie - 1
                        ? "bg-blue-300 border-blue-600"
                        : index < currentGame - 1
                        ? "bg-gray-50"
                        : "bg-white"
                    }`}
                  >
                    <span className="font-medium text-xs">
                      Tie {tie.tieNumber} ({tie.type})
                    </span>
                    <span className="text-xs">
                      {tie.participants?.team1?.length || 0} vs{" "}
                      {tie.participants?.team2?.length || 0}
                    </span>
                    <div className="flex items-center space-x-2">
                      {index === currentTie - 1 && (
                        <Badge className="text-xs rounded-full">Current</Badge>
                      )}
                      {index < currentTie - 1 && (
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

        {/* Shot Tracking */}
        <div className="space-y-4">
          <ShotSelector />
        </div>

        {/* Team Roster Display */}
        {isTeamMatch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {match.team1?.name || "Team 1"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.team1?.players
                    ?.filter((pl) => {
                      const uid = pl.user?._id ?? pl.id ?? pl._id ?? pl.user;
                      return getSymbolFor(match.team1, uid); // keep only assigned players
                    })
                    .map((pl, index) => {
                      const uid = pl.user?._id ?? pl.id ?? pl._id ?? pl.user;
                      const name = pl.user
                        ? pl.user.fullName || pl.user.username
                        : pl.name || uid;
                      const symbol = getSymbolFor(match.team1, uid);
                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center rounded ${
                            symbol === currentSymbol1
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="font-medium text-xs">
                            {displaySymbolName(symbol, name)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {pl.role}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {match.team2?.name || "Team 2"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.team2?.players
                    ?.filter((pl) => {
                      const uid = pl.user?._id ?? pl.id ?? pl._id ?? pl.user;
                      return getSymbolFor(match.team2, uid);
                    })
                    .map((pl, index) => {
                      const uid = pl.user?._id ?? pl.id ?? pl._id ?? pl.user;
                      const name = pl.user
                        ? pl.user.fullName || pl.user.username
                        : pl.name || uid;
                      const symbol = getSymbolFor(match.team2, uid);
                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center rounded ${
                            symbol === currentSymbol2
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="font-medium text-xs">
                            {displaySymbolName(symbol, name)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {pl.role}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isTeamMatch && match.games && match.games.length > 0 && (
          <Card className="rounded-none">
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
                      <span className="font-semibold text-lg">
                        {game.side1Score} - {game.side2Score}
                      </span>
                    </div>
                    {game.winner && (
                      <Badge variant="outline" className="text-xs">
                        Won by {game.winner === "player1" ? p1.name : p2.name}
                      </Badge>
                    )}
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
