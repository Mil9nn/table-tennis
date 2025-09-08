"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTennisStore } from "@/hooks/useTennisStore";
import { enhancedShotCategories } from "@/constants/constants";
import Image from "next/image";

export default function GameInterface() {
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

  const saveMatch = async () => {
    if (!currentMatch || !currentMatch.winner) {
      alert("❌ No completed match to save");
      return;
    }

    try {
      const res = await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMatch),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setSavedData(data);

      if (data.success) {
        const p1Games = currentMatch.games.filter((g) => g.winner === 1).length;
        const p2Games = currentMatch.games.filter((g) => g.winner === 2).length;

        alert(
          `✅ Match saved! ${currentMatch.winner.displayName} wins ${Math.max(
            p1Games,
            p2Games
          )}-${Math.min(p1Games, p2Games)}`
        );
        resetToSetup();
      } else {
        alert("❌ Failed to save match: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save match error:", error);
      alert("❌ Error saving match: " + (error as Error).message);
    }
  };

  // Playing state
  if (gameState === "playing") {
    const gamesNeededToWin = Math.ceil(bestOf / 2);

    return (
      <div className="xs:p-2 sm:p-6 max-w-4xl mx-auto">
        {/* Shot Selection Dialog */}
        <Dialog
          open={shotPicker.open}
          onOpenChange={(open) => setShotPicker((prev) => ({ ...prev, open }))}
        >
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Select Point Category</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Special Situations */}
              <div>
                <h3 className="font-semibold mb-2 text-purple-700">
                  Special Situations
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {enhancedShotCategories.special.map((shot) => (
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
              </div>

              {/* Shots */}
              <div>
                <h2 className="font-semibold mb-2 text-gray-700 cursor-pointer">
                  Shot Type
                </h2>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {enhancedShotCategories.traditional.map((shot) => (
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Match Header */}
        <div className="mb-6 p-4">
          <h1 className="text-2xl font-bold mb-2">
            {player1.displayName} vs {player2.displayName}
          </h1>
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
            {/* End Match Button */}
            <div className="text-center">
              <Button variant={"destructive"} onClick={resetToSetup}>
                End Match
              </Button>
            </div>
          </div>
        </div>

        {/* Deuce Alert */}
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
          {/* Left Side */}
          <div className="shadow-md shadow-black/40 flex items-center">
            <div className="w-full">
              <div className="p-4">
                <h2 className="flex xs:flex-row flex-col space-y-2 xs:items-center justify-between mb-2">
                  <span className="text-xl font-semibold">
                    @{player1.displayName}
                  </span>
                  <div className="h-6">
                    <span
                      className={`bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold ${
                        player1.serving ? "" : "hidden"
                      }`}
                    >
                      Serving
                    </span>
                  </div>
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

          {/* Right Side */}
          <div className="shadow-md shadow-black/40 flex items-center">
            <div className="w-full">
              <div className="p-4">
                <h2 className="flex xs:flex-row flex-col xs:items-center space-y-2 justify-between mb-2">
                  <span className="text-xl font-semibold">
                    @{player2.displayName}
                  </span>
                  <div className="h-6">
                    <span
                      className={`bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold ${
                        player2.serving ? "" : "hidden"
                      }`}
                    >
                      Serving
                    </span>
                  </div>
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
                  {game.winner === 1 && (
                    <span className="text-blue-600 ml-2">✓</span>
                  )}
                  {game.winner === 2 && (
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

  // Match Finished State
  if (gameState === "finished" && currentMatch && currentMatch.winner) {
    const p1Games = currentMatch.games.filter((g) => g.winner === 1).length;
    const p2Games = currentMatch.games.filter((g) => g.winner === 2).length;
    const winnerGames =
      currentMatch.winner.userId === currentMatch.player1.userId
        ? p1Games
        : p2Games;
    const loserGames = currentMatch.games.length - winnerGames;

    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Match Complete!</h1>

        {/* Winner Announcement */}
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
                  {game.winner === 1
                    ? currentMatch.player1.displayName
                    : currentMatch.player2.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={saveMatch} size="lg">
            Save Match
          </Button>
          <Button onClick={resetToSetup} variant="outline" size="lg">
            New Match
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
