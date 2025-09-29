"use client";

import { useState } from "react";
import { Shot } from "@/types/shot.type";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

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
      <div className="relative flex flex-col items-center justify-center text-gray-500 italic">
        <Image
          src="/imgs/EmptyShotState.png"
          alt="No shots"
          width={200}
          height={200}
          className="inline-block"
        />
        <span className="absolute bottom-0">No shots recorded yet...</span>
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
          <div key={game.gameNumber} className="border rounded-md">
            {/* Game Header */}
            <button
              onClick={() => toggleGame(game.gameNumber)}
              className={`w-full flex justify-between items-center px-4 py-2 text-left ${
                game.gameNumber === currentGame
                  ? "bg-emerald-100 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              <span>
                Game {game.gameNumber}{" "}
                {game.gameNumber === currentGame && "(In Progress)"}
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

                    let displayText: string;
                    let outcomeClass = "";

                    if (shot.outcome === "error") {
                      displayText = `${shot.errorType || "Unforced"}`;
                      outcomeClass = "text-red-600";
                    } else if (shot.outcome === "winner") {
                      displayText = `${formatShotType(shot.stroke)}`;
                      outcomeClass = "text-green-600";
                    } else {
                      displayText = formatShotType(shot.stroke);
                      outcomeClass = "text-gray-600";
                    }

                    return (
                      <li
                        key={shot._id ?? i}
                        className="text-xs w-full p-2 flex items-center gap-2 border-b last:border-0"
                      >
                        <span>{i + 1}.</span>
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="whitespace-nowrap">
                            <strong>{playerName}</strong> ({shot.side}) →{" "}
                            {displayText}
                          </span>
                          <span
                            className={`font-semibold text-xs ${outcomeClass}`}
                          >
                            {shot.outcome.charAt(0).toUpperCase() +
                              shot.outcome.slice(0, 0)}
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
