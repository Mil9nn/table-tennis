"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTennisStore } from "@/hooks/useTennisStore";
import { shotCategories } from "@/constants/constants";
import Image from "next/image";

export default function PlayMatchPage() {
  const router = useRouter();
  const {
    gameState,
    currentMatch,
    player1,
    player2,
    deuce,
    shotPicker,
    bestOf,
    setShotPicker,
    handleShotSelect,
    resetToSetup,
    updateServingLogic,
    setSavedData,
  } = useTennisStore();

  // Update serving logic when scores change
  useEffect(() => {
    updateServingLogic();
  }, [player1.currentScore, player2.currentScore, updateServingLogic]);

  // Redirect if no match is set
  useEffect(() => {
    if (gameState === "setup" || !currentMatch) {
      router.push("/match/create");
    }
  }, [gameState, currentMatch, router]);

  // Save match
  const saveMatch = async () => {
    if (!currentMatch || !currentMatch.winner) {
      alert("❌ No completed match to save");
      return;
    }

    try {
      const cleanMatchData = {
        matchId: currentMatch.id,
        player1: currentMatch.player1.userId,
        player2: currentMatch.player2.userId,
        winner: currentMatch.winner?.userId ?? null,
        bestOf: currentMatch.bestOf,
        startTime: currentMatch.startTime,
        endTime: currentMatch.endTime,
        games: currentMatch.games.map((game) => ({
          gameNumber: game.gameNumber,
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          winner: game.winner ?? null,
          startTime: game.startTime,
          endTime: game.endTime,
          shots: game.shots.map((shot) => ({
            shotName: shot.shotName,
            player: shot.player,
            timestamp: shot.timestamp,
          })),
        })),
      };

      const res = await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanMatchData),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setSavedData(data);

      if (data.success) {
        const p1Games = currentMatch.games.filter(
          (g) => g.winner === currentMatch.player1.userId
        ).length;
        const p2Games = currentMatch.games.filter(
          (g) => g.winner === currentMatch.player2.userId
        ).length;

        alert(
          `✅ Match saved! ${currentMatch.winner.displayName} wins ${Math.max(
            p1Games,
            p2Games
          )}-${Math.min(p1Games, p2Games)}`
        );
        router.push("/match");
      } else {
        alert("❌ Failed to save match: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save match error:", error);
      alert("❌ Error saving match: " + (error as Error).message);
    }
  };

  const handleEndMatch = () => {
    resetToSetup();
    router.push("/match");
  };

  // ---------------- PLAYING STATE ----------------
  if (gameState === "playing") {
    const gamesNeededToWin = Math.ceil(bestOf / 2);

    return (
      <div className="xs:p-2 sm:p-6 max-w-4xl mx-auto">
        {/* Shot Picker Dialog */}
        <Dialog
          open={shotPicker.open}
          onOpenChange={(open) => setShotPicker((prev) => ({ ...prev, open }))}
        >
          <DialogContent
            className="max-h-[90vh] overflow-y-auto"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Select Point Category</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Special Shots */}
              <div className="flex items-center gap-6">
                {shotCategories.special.map((shot) => (
                  <Button
                    key={shot}
                    variant="outline"
                    className="justify-start hover:bg-purple-50"
                    onClick={() => handleShotSelect(shot)}
                  >
                    {shot}
                  </Button>
                ))}
              </div>

              {/* Traditional Shots */}
              <div className="space-y-4">
                <h2 className="font-semibold mb-2 text-gray-700">Shot Type</h2>
                <div className="space-y-6">
                  {Object.entries(shotCategories.traditional).map(
                    ([section, shots]) => (
                      <div key={section}>
                        <h3 className="text-sm font-medium text-purple-700 mb-2">
                          {section}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {shots.map((shot) => (
                            <button
                              key={shot}
                              className="flex flex-col items-center justify-center text-sm hover:shadow-md shadow-black/50 rounded-xl"
                              onClick={() => handleShotSelect(shot)}
                            >
                              <Image
                                src={`/${shot}.png`}
                                alt={shot}
                                width={100}
                                height={100}
                              />
                              {shot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Match Header */}
        <div className="mb-6 p-4">
          <div className="flex items-center mb-2">
            <Link href="/match">
              <Button variant="ghost" size="sm" className="p-2 mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {player1.displayName} vs {player2.displayName}
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Best of {bestOf} •{" "}
                <span className="bg-purple-200 rounded-full text-sm px-2 py-1">
                  Game {(currentMatch?.games.length || 0) + 1}
                </span>
              </p>
              <p className="text-sm text-gray-500 font-semibold">
                First to {gamesNeededToWin} games wins
              </p>
            </div>
            <Button variant="destructive" onClick={handleEndMatch}>
              End Match
            </Button>
          </div>
        </div>

        {/* Deuce */}
        {deuce && (
          <div className="text-center mb-4">
            <p className="text-red-500 text-xl font-bold">DEUCE!</p>
            <p className="text-sm text-gray-600">
              First to lead by 2 points wins
            </p>
          </div>
        )}

        {/* Player Score Cards */}
        <div className="w-full h-full grid grid-cols-2 gap-1 mb-6">
          {/* Player 1 */}
          <div className="shadow-md shadow-black/40 flex items-center">
            <div className="w-full">
              <div className="p-4">
                <h2 className="flex xs:flex-row flex-col space-y-2 xs:items-center justify-between mb-2">
                  <span className="text-xl font-semibold">
                    @{player1.displayName}
                  </span>
                  {player1.serving && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Serving
                    </span>
                  )}
                </h2>
                <div className="text-4xl font-bold mb-2 text-blue-600">
                  {player1.currentScore}
                </div>
                <p className="mb-4 text-gray-600">
                  Games: {player1.gamesWon}/{gamesNeededToWin}
                </p>
              </div>
              <Button
                onClick={() => setShotPicker({ player: 1, open: true })}
                className="cursor-pointer py-10 w-full bg-emerald-500 hover:bg-emerald-600 rounded-none"
              >
                +1 Point
              </Button>
            </div>
          </div>

          {/* Player 2 */}
          <div className="shadow-md shadow-black/40 flex items-center">
            <div className="w-full">
              <div className="p-4">
                <h2 className="flex xs:flex-row flex-col xs:items-center space-y-2 justify-between mb-2">
                  <span className="text-xl font-semibold">
                    @{player2.displayName}
                  </span>
                  {player2.serving && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Serving
                    </span>
                  )}
                </h2>
                <div className="text-4xl font-bold mb-2 text-red-600">
                  {player2.currentScore}
                </div>
                <p className="mb-4 text-gray-600">
                  Games: {player2.gamesWon}/{gamesNeededToWin}
                </p>
              </div>
              <Button
                onClick={() => setShotPicker({ player: 2, open: true })}
                className="py-10 bg-rose-500 hover:bg-rose-600 cursor-pointer w-full rounded-none"
              >
                +1 Point
              </Button>
            </div>
          </div>
        </div>

        {/* Games History */}
        {currentMatch && currentMatch.games.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Games Completed</h3>
            <div className="flex gap-2 flex-wrap">
              {currentMatch.games.map((game, idx) => (
                <div key={idx} className="border rounded p-2 text-sm">
                  Game {game.gameNumber}: {game.player1Score}-
                  {game.player2Score}
                  {game.winner === currentMatch.player1.userId && (
                    <span className="text-blue-600 ml-2">✓</span>
                  )}
                  {game.winner === currentMatch.player2.userId && (
                    <span className="text-red-600 ml-2">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- FINISHED STATE ----------------
  if (gameState === "finished" && currentMatch && currentMatch.winner) {
    const p1Games = currentMatch.games.filter(
      (g) => g.winner === currentMatch.player1.userId
    ).length;
    const p2Games = currentMatch.games.filter(
      (g) => g.winner === currentMatch.player2.userId
    ).length;
    const winnerGames =
      currentMatch.winner.userId === currentMatch.player1.userId
        ? p1Games
        : p2Games;
    const loserGames = currentMatch.games.length - winnerGames;

    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mb-4">
          <Link href="/match">
            <Button variant="ghost" size="sm" className="p-2 mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Match Complete!</h1>
        </div>

        {/* Winner Card */}
        <div className="bg-green-100 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            🏆 {currentMatch.winner.displayName} Wins!
          </h2>
          <p className="text-lg mb-4">
            {currentMatch.player1.displayName} vs{" "}
            {currentMatch.player2.displayName}
          </p>
          <div className="text-gray-600">
            <p>
              Games Won: {winnerGames} - {loserGames}
            </p>
            <p>Total Games: {currentMatch.games.length}</p>
          </div>
        </div>

        {/* Game Results */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Game-by-Game Results</h3>
          <div className="space-y-2">
            {currentMatch.games.map((game, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border rounded p-3"
              >
                <span>Game {game.gameNumber}</span>
                <span className="font-mono">
                  {game.player1Score} - {game.player2Score}
                </span>
                <span className="font-semibold">
                  {game.winner === currentMatch.player1.userId
                    ? currentMatch.player1.displayName
                    : currentMatch.player2.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={saveMatch} size="lg">
            Save Match
          </Button>
          <Link href="/match/create">
            <Button variant="outline" size="lg">
              New Match
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------- LOADING ----------------
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
