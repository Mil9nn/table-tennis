"use client";

import { useState } from "react";
import { Shot } from "@/types/shot.type";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { generateFullCommentary, generateShortCommentary } from "@/lib/shot-commentary-utils";

import { Participant } from "@/types/match.type";

interface ShotFeedProps {
  games: { gameNumber: number; shots: Shot[]; side1Score?: number; side2Score?: number; winnerSide?: string | null }[];
  currentGame: number;
  participants: Participant[];
  finalScore?: { side1Sets: number; side2Sets: number };
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
  finalScore,
}: ShotFeedProps) {
  // Derive side names from participants
  const side1Name = participants.length > 0 
    ? (typeof participants[0] === 'string' ? participants[0] : participants[0].fullName || participants[0].username || "Player 1")
    : "Player 1";
  const side2Name = participants.length > 1
    ? (typeof participants[1] === 'string' ? participants[1] : participants[1].fullName || participants[1].username || "Player 2")
    : "Player 2";
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
                  [...shots].reverse().map((shot, i) => {
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

                    // Generate advanced commentary if coordinates are available
                    const hasCoordinates =
                      shot.originX != null &&
                      shot.originY != null &&
                      shot.landingX != null &&
                      shot.landingY != null;
                    
                    // Calculate game score at the time of this shot
                    // Count shots by side up to and including this shot
                    // Support both individual (side1/side2) and team (team1/team2) matches
                    // Since array is reversed, calculate the original index
                    const originalIndex = shots.length - 1 - i;
                    let gameScoreSide1 = 0;
                    let gameScoreSide2 = 0;
                    for (let j = 0; j <= originalIndex; j++) {
                      const shotSide = shots[j].side;
                      if (shotSide === "side1" || shotSide === "team1") {
                        gameScoreSide1++;
                      } else if (shotSide === "side2" || shotSide === "team2") {
                        gameScoreSide2++;
                      }
                    }
                    const currentGameScore = {
                      side1Score: gameScoreSide1,
                      side2Score: gameScoreSide2,
                    };
                    
                    // Calculate set score at the time of this shot
                    // Count completed games before this one
                    let setsWonSide1 = 0;
                    let setsWonSide2 = 0;
                    for (let j = 0; j < games.length; j++) {
                      const g = games[j];
                      if (g.gameNumber < game.gameNumber && g.winnerSide === "side1") {
                        setsWonSide1++;
                      } else if (g.gameNumber < game.gameNumber && g.winnerSide === "side2") {
                        setsWonSide2++;
                      }
                    }
                    const currentSetScore = finalScore || {
                      side1Sets: setsWonSide1,
                      side2Sets: setsWonSide2,
                    };
                    
                    let commentary: string | null = null;
                    if (hasCoordinates) {
                      if (participants) {
                        // Use calculated set score (either from finalScore prop or calculated from games)
                        commentary = generateFullCommentary(
                          shot,
                          participants,
                          games,
                          currentSetScore,
                          side1Name,
                          side2Name,
                          currentGameScore
                        );
                      } else {
                        // Fallback to short commentary if we don't have participants
                        commentary = generateShortCommentary(shot);
                      }
                    }

                    return (
                      <li
                        key={shot._id ?? i}
                        className="flex gap-3 text-xs sm:text-sm py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors rounded-lg px-2"
                      >
                        {/* Shot number */}
                        <span className="text-gray-400 dark:text-zinc-500 font-mono text-xs pt-0.5">
                          {shots.length - i}.
                        </span>

                        {/* Shot commentary with color accent */}
                        <div className="flex-1 flex gap-2.5">
                          {/* Color accent bar - support both side1/side2 and team1/team2 */}
                          <div className={`w-1 rounded-full flex-shrink-0 ${
                            shot.side === "side1" || shot.side === "team1"
                              ? "bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500"
                              : "bg-gradient-to-b from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500"
                          }`} />

                          {/* Commentary content */}
                          <div className="flex-1 space-y-1">
                            {commentary ? (
                              <div
                                className="text-gray-700 dark:text-zinc-300 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: commentary.replace(
                                    /<strong>(.*?)<\/strong>/g,
                                    '<strong class="font-semibold text-gray-900 dark:text-zinc-100">$1</strong>'
                                  )
                                }}
                              />
                            ) : (
                              // Fallback if no commentary available
                              <div className="text-gray-700 dark:text-zinc-300">
                                <strong className="font-semibold text-gray-900 dark:text-zinc-100">
                                  {playerName}
                                </strong>{" "}
                                <span className="text-gray-500 dark:text-zinc-400 text-xs">
                                  ({shot.side})
                                </span>{" "}
                                →{" "}
                                <span className={`font-medium ${
                                  shot.side === "side1" || shot.side === "team1"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}>
                                  {shotType}
                                </span>
                              </div>
                            )}
                          </div>
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
