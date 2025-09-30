"use client";

import { Minus } from "lucide-react";

type PlayerInfo = {
  name: string;
  playerId?: string;
  serverKey?: string;
};

interface PlayerCardProps {
  players: PlayerInfo[];
  score: number;
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
      bg: "from-emerald-400 to-emerald-600",
      score: "text-emerald-700",
    },
    rose: {
      bg: "from-rose-400 to-rose-600",
      score: "text-rose-700",
    },
  };

  // Helper to check if this player is currently serving
  const isPlayerServing = (player: PlayerInfo) => {
    if (!currentServer || !player.serverKey) return false;
    return currentServer === player.serverKey;
  };

  return (
    <section
      onClick={() =>
        !disabled && onAddPoint({ side, playerId: players[0]?.playerId })
      }
      className={`relative flex flex-col justify-between items-center
        p-8 shadow-lg cursor-pointer select-none
        bg-gradient-to-br ${colors[color].bg} transition
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Player Names */}
      <div className="flex flex-col items-center mb-4 text-white gap-1">
        {players.map((pl, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
          >
            <span>{pl.name}</span>
            {isPlayerServing(pl) && (
              <span
                className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"
                title="Serving"
              />
            )}
          </div>
        ))}
      </div>

      {/* Score */}
      <div
        className={`font-extrabold tracking-tight ${colors[color].score} 
        text-[5rem] md:text-[7rem]`}
      >
        {score}
      </div>

      {/* Sets Won */}
      <div className="mt-4 text-white/80 text-sm">Sets Won: {setsWon}</div>

      {/* Subtract Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          !disabled && onSubtractPoint(side);
        }}
        disabled={disabled}
        className={`absolute top-0 right-0 bg-white/80 hover:bg-white text-gray-800 
          rounded-full p-2 shadow-md transition
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Minus className="w-5 h-5" />
      </button>
    </section>
  );
}