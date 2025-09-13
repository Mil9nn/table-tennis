// app/match/play/PlayMatchPage.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { useTennisStore } from "@/hooks/useTennisStore";
import ShotSelector from "./components/ShotSelector";
import MatchHeader from "./components/MatchHeader";
import TeamScoreCard from "./components/TeamScoreCard";
import IndividualPlayerActions from "./components/IndividualPlayerActions";
import GamesHistory from "./components/GameHistory";
import RecentShots from "./components/RecentShots";
import FinishedMatchView from "./components/FinishedMatchView";

export default function PlayMatchPage() {
  const router = useRouter();

  const {
    gameState,
    currentMatch,
    players,
    playerOrder,
    deuce,
    bestOf,
    setShotPicker,
    resetToSetup,
    updateServingLogic,
    setSavedData,
    recentShots,
    setRecentShots,
    category,
  } = useTennisStore((s) => s);

  const player1 = playerOrder && playerOrder[0] ? players[playerOrder[0]] : null;
  const player2 = playerOrder && playerOrder[1] ? players[playerOrder[1]] : null;
  const player3 = playerOrder && playerOrder[2] ? players[playerOrder[2]] : null;
  const player4 = playerOrder && playerOrder[3] ? players[playerOrder[3]] : null;

  const isDoubles = category === "doubles";

  useEffect(() => {
    if (gameState === "playing" && player1 && player2) {
      updateServingLogic();
    }
  }, [player1?.currentScore, player2?.currentScore, updateServingLogic, gameState]);

  useEffect(() => {
    if (gameState === "setup" || !currentMatch || !player1 || !player2) {
      router.push("/match/create");
    }
  }, [gameState, currentMatch, player1, player2, router]);

  // recentShots updater - keep logic identical to yours
  useEffect(() => {
    if (currentMatch && currentMatch.games.length > 0) {
      const allRecentShots: any[] = [];
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

      const sortedShots = allRecentShots.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      setRecentShots(sortedShots);
    }
  }, [currentMatch, players]);

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
        player3: playerOrder && playerOrder[2] ? playerOrder[2] : null,
        player4: playerOrder && playerOrder[3] ? playerOrder[3] : null,
        winner: currentMatch.winnerId,
        bestOf: currentMatch.bestOf,
        category: isDoubles ? "doubles" : "singles",
        startTime: currentMatch.startTime,
        endTime: currentMatch.endTime || Date.now(),
        games: currentMatch.games.map((game) => ({
          gameNumber: game.gameNumber,
          player1Score: playerOrder && playerOrder[0] ? game.scores[playerOrder[0]] || 0 : 0,
          player2Score: playerOrder && playerOrder[1] ? game.scores[playerOrder[1]] || 0 : 0,
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

      const res = await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanMatchData),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setSavedData(data);

      if (data.success) {
        const winnerName = currentMatch.players[currentMatch.winnerId].displayName;
        const p1Games = currentMatch.games.filter((g) => g.winnerId === playerOrder?.[0]).length;
        const p2Games = currentMatch.games.filter((g) => g.winnerId === playerOrder?.[1]).length;

        alert(`✅ Match saved! ${winnerName} wins ${Math.max(p1Games, p2Games)}-${Math.min(p1Games, p2Games)}`);
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

  // Loading guard (same behavior)
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

  // PLAYING UI
  if (gameState === "playing") {
    const gamesNeededToWin = Math.ceil(bestOf / 2);

    return (
      <div className="xs:p-2 sm:p-6 max-w-4xl mx-auto">
        <ShotSelector />

        <MatchHeader />

        {deuce && (
          <div className="text-center mb-4">
            <p className="text-red-500 text-xl font-bold">DEUCE!</p>
            <p className="text-sm text-gray-600">First to lead by 2 points wins</p>
          </div>
        )}

        <div className="w-full h-full grid grid-cols-2 gap-1 mb-6">
          <TeamScoreCard representative={player1} partner={player3} teamLabel="Team 1" highlightColor="#10b981" />
          <TeamScoreCard representative={player2} partner={player4} teamLabel="Team 2" highlightColor="#f43f5e" />
        </div>

        {isDoubles && <IndividualPlayerActions team1={[player1, player3]} team2={[player2, player4]} />}

        <GamesHistory />

        <RecentShots />
        
        <div className="flex items-center justify-between">
          <div></div>
          <Button variant="destructive" onClick={handleEndMatch}>End Match</Button>
        </div>
      </div>
    );
  }

  // FINISHED UI
  if (gameState === "finished" && currentMatch && currentMatch.winnerId) {
    return <FinishedMatchView onSave={saveMatch} />;
  }

  // fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}