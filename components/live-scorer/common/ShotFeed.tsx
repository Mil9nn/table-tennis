"use client";

import { useState } from "react";
import { Shot } from "@/types/shot.type";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import {
  generateFullCommentary,
  generateShortCommentary,
} from "@/lib/shot-commentary-utils";

import { Participant, InitialServerConfig } from "@/types/match.type";

interface ShotFeedProps {
  games: {
    gameNumber: number;
    shots: Shot[];
    side1Score?: number;
    side2Score?: number;
    winnerSide?: string | null;
  }[];
  currentGame: number;
  participants: Participant[];
  finalScore?: { side1Sets: number; side2Sets: number };
  serverConfig?: InitialServerConfig | null;
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
  serverConfig,
}: ShotFeedProps) {
  // Derive side names from participants
  // For doubles (4 participants): Side 1 = [0,1], Side 2 = [2,3]
  // For singles (2 participants): Side 1 = [0], Side 2 = [1]
  const isDoubles = participants.length === 4;
  
  const getParticipantName = (p: Participant | string): string => {
    if (typeof p === "string") return p;
    return p.fullName || p.username || "Unknown";
  };

  const side1Name = isDoubles
    ? participants.length >= 2
      ? `${getParticipantName(participants[0])} & ${getParticipantName(participants[1])}`
      : "Side 1"
    : participants.length > 0
    ? getParticipantName(participants[0])
    : "Player 1";
    
  const side2Name = isDoubles
    ? participants.length >= 4
      ? `${getParticipantName(participants[2])} & ${getParticipantName(participants[3])}`
      : "Side 2"
    : participants.length > 1
    ? getParticipantName(participants[1])
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
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-sm dark:shadow-lg text-gray-900 dark:text-gray-100 space-y-0 transition-colors overflow-hidden">
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <h3 className="text-lg font-semibold tracking-tight">Shot Feed</h3>
      </div>

      <div className="space-y-0">
        {games.map((game) => {
          const isExpanded = expandedGames.includes(game.gameNumber);
          const shots = game.shots || [];

          return (
            <div
              key={game.gameNumber}
              className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all duration-300"
            >
              {/* Game Header */}
              <button
                onClick={() => toggleGame(game.gameNumber)}
                className={`w-full flex justify-between items-center px-6 py-3 text-left transition-all duration-300 ${
                  game.gameNumber === currentGame
                    ? "bg-gradient-to-r from-[#3c6e71]/5 to-[#284b63]/5 text-[#284b63] dark:from-[#3c6e71]/15 dark:to-[#284b63]/15 dark:text-[#3c6e71] font-semibold"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
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
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 px-6 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {shots.length ? (
                    [...shots].reverse().map((shot, i) => {
                      // Handle both cases: shot.player as object or as string ID
                      const playerId = typeof shot.player === 'string' 
                        ? shot.player 
                        : shot.player?._id?.toString();
                      
                      const player = participants.find(
                        (p) => {
                          const pId = typeof p === 'string' ? p : p._id?.toString();
                          return pId === playerId;
                        }
                      );
                      
                      const playerName =
                        (typeof player !== 'string' && player?.fullName) ||
                        (typeof player !== 'string' && player?.username) ||
                        (typeof shot.player !== 'string' && shot.player?.fullName) ||
                        (typeof shot.player !== 'string' && shot.player?.username) ||
                        "Unknown Player";

                      const shotType = formatShotType(shot.stroke);

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
                        } else if (
                          shotSide === "side2" ||
                          shotSide === "team2"
                        ) {
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
                        if (
                          g.gameNumber < game.gameNumber &&
                          g.winnerSide === "side1"
                        ) {
                          setsWonSide1++;
                        } else if (
                          g.gameNumber < game.gameNumber &&
                          g.winnerSide === "side2"
                        ) {
                          setsWonSide2++;
                        }
                      }
                      const currentSetScore = finalScore || {
                        side1Sets: setsWonSide1,
                        side2Sets: setsWonSide2,
                      };

                      // Always generate commentary (generateFullCommentary handles missing coordinates gracefully)
                      let commentary: string | null = null;
                      if (participants) {
                        // Use calculated set score (either from finalScore prop or calculated from games)
                        commentary = generateFullCommentary(
                          shot,
                          participants,
                          games,
                          currentSetScore,
                          side1Name,
                          side2Name,
                          currentGameScore,
                          serverConfig,
                          game.gameNumber
                        );
                      } else {
                        // Fallback to short commentary if we don't have participants
                        commentary = generateShortCommentary(shot);
                      }

                      return (
                        <li
                          key={shot._id ?? i}
                          className="flex gap-3 text-xs sm:text-sm py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-lg px-2"
                        >
                          {/* Shot number */}
                          <span className="text-gray-400 dark:text-gray-500 font-mono text-xs pt-0.5">
                            {shots.length - i}.
                          </span>

                          {/* Shot commentary with color accent */}
                          <div className="flex-1 flex gap-2.5">
                            {/* Color accent bar - support both side1/side2 and team1/team2 */}
                            <div
                              className={`w-1 rounded-full flex-shrink-0 ${
                                shot.side === "side1" || shot.side === "team1"
                                  ? "bg-gradient-to-b from-[#3c6e71] to-[#2a5056] dark:from-[#3c6e71] dark:to-[#2a5056]"
                                  : "bg-gradient-to-b from-[#284b63] to-[#1a3547] dark:from-[#284b63] dark:to-[#1a3547]"
                              }`}
                            />

                            {/* Commentary content */}
                            <div className="flex-1 space-y-1">
                              {commentary ? (
                                <div
                                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: commentary.replace(
                                      /<strong>(.*?)<\/strong>/g,
                                      '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>'
                                    ),
                                  }}
                                />
                              ) : (
                                // Fallback if no commentary available
                                <div className="text-gray-700 dark:text-gray-300">
                                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                    {playerName}
                                  </strong>{" "}
                                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                                    ({shot.side})
                                  </span>{" "}
                                  →{" "}
                                  <span
                                    className={`font-medium ${
                                      shot.side === "side1" ||
                                      shot.side === "team1"
                                        ? "text-[#3c6e71] dark:text-[#3c6e71]"
                                        : "text-[#284b63] dark:text-[#284b63]"
                                    }`}
                                  >
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
                    <li className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 italic py-3">
                      <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" />
                      No shots recorded yet...
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
