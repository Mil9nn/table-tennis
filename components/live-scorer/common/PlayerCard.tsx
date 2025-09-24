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
  side: "side1" | "side2";
  onAddPoint: (payload: {
    side: "side1" | "side2";
    playerId?: string;
  }) => void;
  onSubtractPoint: (side: "side1" | "side2") => void;
  setsWon: number;
  color?: "emerald" | "rose";
  disabled?: boolean;
  currentServer: string | null;
}

export default function PlayerCard({
  players,
  score,
  side,
  onAddPoint,
  onSubtractPoint,
  setsWon,
  color = "emerald",
  disabled = false,
  currentServer,
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
    <section className="text-center bg-white p-6 shadow-sm">
      {/* Player Names */}
      <div className="flex flex-col items-center mb-3">
        {players.map((pl, idx) => (
          <div key={idx} className="flex items-center">
            <h2 className="text-sm font-semibold text-gray-800">{pl.name}</h2>
            {currentServer === pl.name && (
              <span
                className="ml-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"
                title="Serving"
              />
            )}
          </div>
        ))}
      </div>

      {/* Score */}
      <div
        className={`mb-4 font-extrabold tracking-tight ${colors[color].score} text-7xl md:text-8xl`}
      >
        {score}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={() =>
            !disabled && onAddPoint({ side, playerId: players[0]?.playerId })
          }
          disabled={disabled}
          className={`p-4 rounded-lg shadow-md ${colors[color].add} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => !disabled && onSubtractPoint(side)}
          disabled={disabled}
          className={`bg-gray-200 hover:bg-gray-300 p-4 rounded-lg text-gray-700 shadow-md ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Minus className="w-6 h-6" />
        </button>
      </div>

      <div className="text-sm text-gray-500">Sets Won: {setsWon}</div>
    </section>
  );
}
