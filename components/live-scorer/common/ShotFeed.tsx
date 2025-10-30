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
  if (!stroke) return "—";
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
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <div className="rounded-full bg-gray-100 dark:bg-zinc-800 p-3 mb-3 shadow-inner">
          <Target className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <span className="text-sm font-medium">No shots recorded yet</span>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Start tracking to see your shot feed here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-950 dark:to-black shadow-md dark:shadow-lg text-gray-800 dark:text-zinc-100 space-y-5 transition-colors">
      <h3 className="text-lg sm:text-xl font-semibold tracking-tight border-b border-gray-200 dark:border-zinc-800 pb-2">
        Shot Feed
      </h3>

      {games.map((game) => {
        const isExpanded = expandedGames.includes(game.gameNumber);
        const shots = game.shots || [];

        return (
          <div
            key={game.gameNumber}
            className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-900/60 backdrop-blur-sm transition-all duration-300"
          >
            {/* Game Header */}
            <button
              onClick={() => toggleGame(game.gameNumber)}
              className={`w-full flex justify-between items-center px-4 py-3 text-left transition-all duration-300 ${
                game.gameNumber === currentGame
                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 dark:from-emerald-500/10 dark:to-emerald-600/10 dark:text-emerald-300"
                  : "hover:bg-gray-100 dark:hover:bg-zinc-800/60 text-gray-700 dark:text-zinc-300"
              }`}
            >
              <span className="text-sm sm:text-base font-medium">
                Game {game.gameNumber}{" "}
                {game.gameNumber === currentGame && (
                  <span className="ml-1 text-xs italic opacity-80">
                    (In progress)
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {/* Game Shots */}
            {isExpanded && (
              <ul className="divide-y divide-gray-200 dark:divide-zinc-800 px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
                        className="flex justify-between items-center text-xs sm:text-sm py-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-gray-400 dark:text-zinc-500">
                            {i + 1}.
                          </span>
                          <span className="truncate">
                            <strong className="text-gray-900 dark:text-zinc-100">
                              {playerName}
                            </strong>{" "}
                            <span className="text-gray-500 dark:text-zinc-400">
                              ({shot.side})
                            </span>{" "}
                            →{" "}
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {shotType}
                            </span>
                          </span>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500 italic py-3">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-zinc-600 rounded-full animate-pulse" />
                    No shots recorded yet...
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
