"use client";

import { Plus, Minus } from "lucide-react";

type PlayerInfo = {
  name: string;
  playerId?: string;
};

interface PlayerCardProps {
  players: PlayerInfo[]; // ✅ can be 1 (singles) or 2 (doubles)
  score: number;
  isServer: boolean;
  side: "player1" | "player2";
  onAddPoint: (payload: {
    side: "player1" | "player2";
    playerId?: string;
  }) => void;
  onSubtractPoint: (side: "player1" | "player2") => void;
  setsWon: number;
  color?: "emerald" | "rose";
}

export default function PlayerCard({
  players,
  score,
  isServer,
  side,
  onAddPoint,
  onSubtractPoint,
  setsWon,
  color = "emerald",
}: PlayerCardProps) {
  const colors = {
    emerald: {
      score: "text-emerald-500",
      add: "bg-emerald-500 hover:bg-emerald-600 text-white",
    },
    rose: {
      score: "text-rose-500",
      add: "bg-rose-500 hover:bg-rose-600 text-white",
    },
  };

  return (
    <section className="text-center">
      {/* Player Names */}
      <div className="flex flex-col items-center mb-2">
        {players.map((pl, idx) => (
          <div key={idx} className="flex items-center">
            <h2 className="text-lg font-semibold">{pl.name}</h2>
            {/* ✅ Show server indicator on first listed player */}
            {isServer && idx === 0 && (
              <div
                className="ml-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"
                title="Serving"
              />
            )}
          </div>
        ))}
      </div>

      {/* Score */}
      <div className={`text-6xl font-bold mb-4 ${colors[color].score}`}>
        {score}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-2 mb-4">
        {players.map((pl, idx) => (
          <button
            key={idx}
            onClick={() => onAddPoint({ side, playerId: pl.playerId })}
            className={`p-4 rounded-md shadow-md ${colors[color].add}`}
            title={`Add point for ${pl.name}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        ))}

        <button
          onClick={() => onSubtractPoint(side)}
          className="bg-gray-200 hover:bg-gray-300 p-4 rounded-md text-gray-700 shadow-md"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      <div className="text-sm text-gray-600">Sets Won: {setsWon}</div>
    </section>
  );
}
