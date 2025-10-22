"use client";

import { useState } from "react";
import { Shot } from "@/types/shot.type";
import { ChevronDown, ChevronUp, Target } from "lucide-react";

interface ShotFeedProps {
  games: { gameNumber: number; shots: Shot[] }[];
  currentGame: number;
  participants: { _id: string; fullName?: string; username?: string }[];
}

function formatShotType(stroke?: string | null) {
  if (!stroke) return "—"; // fallback when no stroke recorded
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ShotFeed({
  games,
  currentGame,
  participants,
}: ShotFeedProps) {
  const [expandedGames, setExpandedGames] = useState<number[]>([currentGame]);

  const toggleGame = (gameNumber: number) => {
    setExpandedGames((prev) =>
      prev.includes(gameNumber)
        ? prev.filter((g) => g !== gameNumber)
        : [...prev, gameNumber]
    );
  };

  if (!games?.length) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 pb-4">
        <div className="rounded-full bg-gray-100 p-3 mb-2">
          <Target className="w-5 h-5 text-gray-400" />
        </div>
        <span className="text-sm font-medium">No shots recorded yet</span>
        <p className="text-xs text-gray-400 mt-1">
          Start tracking to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Shot Feed</h3>

      {games.map((game) => {
        const isExpanded = expandedGames.includes(game.gameNumber);
        const shots = game.shots || [];

        return (
          <div key={game.gameNumber} className="border rounded-xl">
            {/* Game Header */}
            <button
              onClick={() => toggleGame(game.gameNumber)}
              className={`w-full flex justify-between items-center px-4 py-2 text-left ${
                game.gameNumber === currentGame
                  ? "shadow-sm font-semibold"
                  : "bg-gray-100"
              }`}
            >
              <span>
                Game {game.gameNumber}{" "}
                {game.gameNumber === currentGame && "(In progress...)"}
              </span>
              <span>{isExpanded ? <ChevronUp /> : <ChevronDown />}</span>
            </button>

            {/* Game Shots */}
            {isExpanded && (
              <ul className="space-y-1 p-2 border-t pr-2">
                {shots.length ? (
                  shots.map((shot, i) => {
                    const player = participants.find(
                      (p) => p._id === shot.player._id
                    );
                    const playerName =
                      player?.fullName ||
                      player?.username ||
                      shot.player.fullName ||
                      shot.player.username ||
                      "Unknown Player";

                    const shotType = formatShotType(shot.stroke);

                    return (
                      <li
                        key={shot._id ?? i}
                        className="text-xs w-full p-2 flex items-center gap-2 border-b last:border-0"
                      >
                        <span>{i + 1}.</span>
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="whitespace-nowrap">
                            <strong>{playerName}</strong> ({shot.side}) →{" "}
                            {shotType}
                          </span>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="flex items-center gap-2 text-sm text-gray-500 italic p-2">
                    <span className="bg-gray-300 p-2 rounded-full w-5 h-5 shadow-md shadow-black" />
                    <span>No shots recorded yet...</span>
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}