"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTennisStore } from "@/hooks/useTennisStore";

interface Props {
  onSave: () => Promise<void>;
}

export default function FinishedMatchView({ onSave }: Props) {
  const { currentMatch, playerOrder, players, category } = useTennisStore((s) => ({
    currentMatch: s.currentMatch,
    playerOrder: s.playerOrder,
    players: s.players,
    category: s.category,
  }));

  if (!currentMatch || !currentMatch.winnerId || !playerOrder) return null;

  const isDoubles = category === "doubles";
  const p1 = players[playerOrder[0]];
  const p2 = players[playerOrder[1]];
  const p3 = playerOrder[2] ? players[playerOrder[2]] : null;
  const p4 = playerOrder[3] ? players[playerOrder[3]] : null;

  const p1Games = currentMatch.games.filter(g => g.winnerId === playerOrder[0]).length;
  const p2Games = currentMatch.games.filter(g => g.winnerId === playerOrder[1]).length;
  const winner = currentMatch.players[currentMatch.winnerId];

  const winnerGames = currentMatch.winnerId === playerOrder[0] ? p1Games : p2Games;
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

      <div className="bg-green-100 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-2">🏆 {winner.displayName} Wins!</h2>
        <p className="text-lg mb-4">
          {isDoubles ? (
            <>
              {p1?.displayName} & {p3?.displayName} vs {p2?.displayName} & {p4?.displayName}
            </>
          ) : (
            <>
              {p1.displayName} vs {p2.displayName}
            </>
          )}
        </p>
        <div className="text-gray-600">
          <p>Match Type: {isDoubles ? "Doubles" : "Singles"}</p>
          <p>Games Won: {winnerGames} - {loserGames}</p>
          <p>Total Games: {currentMatch.games.length}</p>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={onSave} size="lg">Save Match</Button>
        <Link href="/match/create">
          <Button variant="outline" size="lg">New Match</Button>
        </Link>
      </div>
    </div>
  );
}
