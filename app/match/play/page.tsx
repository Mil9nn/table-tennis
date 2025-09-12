"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Target } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTennisStore } from "@/hooks/useTennisStore";
import { shotCategories } from "@/constants/constants";
import Image from "next/image";

// Type for recent shots display
interface RecentShot {
  shotName: string;
  playerName: string;
  playerId: string;
  timestamp: number;
  gameNumber: number;
}

export default function PlayMatchPage() {
  const router = useRouter();
  const [recentShots, setRecentShots] = useState<RecentShot[]>([]);

  const {
    gameState,
    currentMatch,
    players,
    playerOrder,
    deuce,
    shotPicker,
    bestOf,
    setShotPicker,
    handleShotSelect,
    resetToSetup,
    updateServingLogic,
    setSavedData,
  } = useTennisStore();

  const player1 =
    playerOrder && playerOrder[0] ? players[playerOrder[0]] : null;
  const player2 =
    playerOrder && playerOrder[1] ? players[playerOrder[1]] : null;

  useEffect(() => {
    if (gameState === "playing" && player1 && player2) {
      updateServingLogic();
    }
  }, [
    player1?.currentScore,
    player2?.currentScore,
    updateServingLogic,
    gameState,
  ]);

  useEffect(() => {
    if (gameState === "setup" || !currentMatch || !player1 || !player2) {
      console.log("Redirecting to create match page", {
        gameState,
        currentMatch,
        player1,
        player2,
      });
      router.push("/match/create");
    }
  }, [gameState, currentMatch, player1, player2, router]);

  // Update recent shots when match data changes
  useEffect(() => {
    if (currentMatch && currentMatch.games.length > 0) {
      const allRecentShots: RecentShot[] = [];
      
      // Get shots from all games, focusing on recent ones
      currentMatch.games.forEach((game) => {
        game.shots.forEach((shot) => {
          const player = players[shot.playerId];
          if (player) {
            allRecentShots.push({
              shotName: shot.shotName,
              playerName: player.displayName,
              playerId: shot.playerId,
              timestamp: shot.timestamp,
              gameNumber: game.gameNumber,
            });
          }
        });
      });

      // Sort by timestamp (newest first) and take last 5
      const sortedShots = allRecentShots
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      setRecentShots(sortedShots);
    }
  }, [currentMatch, players]);

  // Enhanced shot select handler
  const enhancedHandleShotSelect = (shotName: string) => {
    handleShotSelect(shotName);
    
    // Add to recent shots immediately for instant feedback
    if (shotPicker.playerId) {
      const player = players[shotPicker.playerId];
      if (player) {
        const newShot: RecentShot = {
          shotName,
          playerName: player.displayName,
          playerId: shotPicker.playerId,
          timestamp: Date.now(),
          gameNumber: (currentMatch?.games.length || 0) + 1,
        };
        
        setRecentShots(prev => [newShot, ...prev.slice(0, 4)]);
      }
    }
  };

  const saveMatch = async () => {
    if (!currentMatch || !currentMatch.winnerId) {
      alert("❌ No completed match to save");
      return;
    }

    try {
      const cleanMatchData = {
        matchId: currentMatch.id,
        player1: playerOrder ? playerOrder[0] : null,
        player2: playerOrder ? playerOrder[1] : null,
        winner: currentMatch.winnerId,
        bestOf: currentMatch.bestOf,
        startTime: currentMatch.startTime,
        endTime: currentMatch.endTime || Date.now(),
        games: currentMatch.games.map((game) => ({
          gameNumber: game.gameNumber,
          player1Score:
            playerOrder && playerOrder[0]
              ? game.scores[playerOrder[0]] || 0
              : 0,
          player2Score:
            playerOrder && playerOrder[1]
              ? game.scores[playerOrder[1]] || 0
              : 0,
          winner: game.winnerId,
          startTime: game.startTime,
          endTime: game.endTime,
          shots: game.shots.map((shot) => ({
            shotName: shot.shotName,
            player: shot.playerId,
            timestamp: shot.timestamp,
            pointNumber: 1,
          })),
        })),
      };

      console.log("Saving match data:", cleanMatchData);

      const res = await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanMatchData),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setSavedData(data);

      if (data.success) {
        const winnerName =
          currentMatch.players[currentMatch.winnerId].displayName;
        const p1Games = currentMatch.games.filter(
          (g) => g.winnerId === playerOrder?.[0]
        ).length;
        const p2Games = currentMatch.games.filter(
          (g) => g.winnerId === playerOrder?.[1]
        ).length;

        alert(
          `✅ Match saved! ${winnerName} wins ${Math.max(
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

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  // Show loading if players are not ready
  if (!player1 || !player2 || !currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading match...</p>
        </div>
      </div>
    );
  }

  // ---------------- PLAYING STATE ----------------
  if (gameState === "playing") {
    const gamesNeededToWin = Math.ceil(bestOf / 2);

    return (
      <div className="xs:p-2 sm:p-6 max-w-4xl mx-auto">
        {/* Shot Picker Dialog */}
        <Dialog
          open={shotPicker.open}
          onOpenChange={(open) => setShotPicker({ ...shotPicker, open })}
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
                    onClick={() => enhancedHandleShotSelect(shot)}
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
                              onClick={() => enhancedHandleShotSelect(shot)}
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
          <Link href="/match">
            <Button variant="outline" size="sm" className="p-2 mr-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold">
              {player1.username} vs {player2.username}
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
                    {player1.displayName}
                  </span>
                  <span
                    className={`bg-yellow-500 w-fit text-white px-3 py-1 rounded-full text-xs font-semibold ${
                      player1.serving ? "" : "invisible"
                    }`}
                  >
                    Serving
                  </span>
                </h2>
                <div className="text-4xl font-bold mb-2 text-emerald-500">
                  {player1.currentScore}
                </div>
                <p className="mb-4 text-gray-600">
                  Games: {player1.gamesWon}/{gamesNeededToWin}
                </p>
              </div>
              <Button
                onClick={() =>
                  setShotPicker({ playerId: player1.userId, open: true })
                }
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
                    {player2.displayName}
                  </span>
                  <span
                    className={`bg-yellow-500 w-fit text-white px-3 py-1 rounded-full text-xs font-semibold ${
                      player2.serving ? "" : "invisible"
                    }`}
                  >
                    Serving
                  </span>
                </h2>
                <div className="text-4xl font-bold mb-2 text-red-600">
                  {player2.currentScore}
                </div>
                <p className="mb-4 text-gray-600">
                  Games: {player2.gamesWon}/{gamesNeededToWin}
                </p>
              </div>
              <Button
                onClick={() =>
                  setShotPicker({ playerId: player2.userId, open: true })
                }
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
                  Game {game.gameNumber}:{" "}
                  {playerOrder ? game.scores[playerOrder[0]] : "0"}-
                  {playerOrder ? game.scores[playerOrder[1]] : "0"}

                  {playerOrder && game.winnerId === playerOrder[0] && (
                    <span className="text-blue-600 ml-2">✓</span>
                  )}
                  {playerOrder && game.winnerId === playerOrder[1] && (
                    <span className="text-red-600 ml-2">✓</span>
                  )}

                  
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Shots Display - NEW FEATURE */}
        {recentShots.length > 0 && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-gray-800">Recent Shots</h3>
            </div>
            <div className="space-y-2">
              {recentShots.map((shot, index) => (
                <div
                  key={`${shot.timestamp}-${index}`}
                  className={`flex items-center justify-between p-2 rounded border-l-4 ${
                    index === 0 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${
                      shot.playerId === player1?.userId 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                    }`}>
                      {shot.playerName}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="font-semibold text-xs text-gray-800">
                      {shot.shotName}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Game {shot.gameNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(shot.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- FINISHED STATE ----------------
  if (gameState === "finished" && currentMatch && currentMatch.winnerId) {
    const winner = currentMatch.players[currentMatch.winnerId];
    const p1Games = currentMatch.games.filter(
      (g) => g.winnerId === (playerOrder && playerOrder[0])
    ).length;
    const p2Games = currentMatch.games.filter(
      (g) => g.winnerId === (playerOrder ? playerOrder[1] : null)
    ).length;
    const winnerGames =
      currentMatch.winnerId === (playerOrder && playerOrder[0])
        ? p1Games
        : p2Games;
    const loserGames = currentMatch.games.length - winnerGames;

    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        {/* {playerOrder && playerOrder.length > 0 ? ( */}
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
            🏆 {winner.displayName} Wins!
          </h2>
          <p className="text-lg mb-4">
            {player1.displayName} vs {player2.displayName}
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
                  {playerOrder ? game.scores[playerOrder[0]] : "0"} -{" "}
                  {playerOrder ? game.scores[playerOrder[1]] : "0"}
                </span>
                <span className="font-semibold">
                  {currentMatch.players[game.winnerId].displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Match Shot Summary - NEW FEATURE */}
        {recentShots.length > 0 && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-800">Final Shots Summary</h3>
            <div className="space-y-1 text-sm">
              {recentShots.slice(0, 3).map((shot, index) => (
                <div key={index} className="flex justify-between">
                  <span>{shot.playerName} - {shot.shotName}</span>
                  <span className="text-blue-600">Game {shot.gameNumber}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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