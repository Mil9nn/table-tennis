"use client";
import { useTennisStore } from "@/hooks/useTennisStore";

export default function GamesHistory() {

  const currentMatch = useTennisStore((s) => s.currentMatch);
  const playerOrder = useTennisStore((s) => s.playerOrder);

  if (!currentMatch || !currentMatch.games.length) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Games Completed</h3>
      <div className="flex gap-2 flex-wrap">
        {currentMatch.games.map((game) => (
          <div key={game.gameNumber} className="border rounded p-2 text-sm">
            Game {game.gameNumber}:{" "}
            {playerOrder ? game.scores[playerOrder[0]] : 0}-
            {playerOrder ? game.scores[playerOrder[1]] : 0}
            {playerOrder && game.winnerId === playerOrder[0] && <span className="text-blue-600 ml-2">✓</span>}
            {playerOrder && game.winnerId === playerOrder[1] && <span className="text-red-600 ml-2">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
