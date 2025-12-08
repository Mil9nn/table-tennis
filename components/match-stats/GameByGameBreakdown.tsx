"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Shot } from "@/types/shot.type";
import { Participant } from "@/types/match.type";
import {
  computeStats,
  getShotColor,
} from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { generateShortCommentary, generateFullCommentary } from "@/lib/shot-commentary-utils";
import { MessageSquare } from "lucide-react";

function formatShotType(stroke?: string | null) {
  if (!stroke) return "—";
  return stroke
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Game {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winnerSide?: string | null;
  shots: Shot[];
}

interface GameByGameBreakdownProps {
  games: Game[];
  side1Name: string;
  side2Name: string;
  participants?: Participant[];
  finalScore?: { side1Sets?: number; side2Sets?: number };
}

export function GameByGameBreakdown({
  games,
  side1Name,
  side2Name,
  participants,
  finalScore,
}: GameByGameBreakdownProps) {
  return (
    <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight">
          Game-by-Game Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown of each individual game
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {games.map((game, idx) => {
          const gameShots = game.shots || [];
          const stats = computeStats(gameShots);

          const strokeData = Object.entries(stats.shotTypes).map(
            ([type, value]) => ({
              name: formatStrokeName(type),
              value,
            })
          );

          return (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 p-4 space-y-6"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-sm sm:text-base">
                    Game {game.gameNumber}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Score: {game.side1Score} - {game.side2Score}
                  </span>
                </div>

                {game.winnerSide && (
                  <Badge
                    variant="outline"
                    className="text-xs rounded-full ring-1 ring-emerald-500 text-emerald-600 dark:text-emerald-400"
                  >
                    Winner:{" "}
                    {game.winnerSide === "side1"
                      ? side1Name
                      : side2Name}
                  </Badge>
                )}
              </div>

              {/* CHART */}
              {strokeData.length > 0 && (
                <div className="space-y-2 bg-black rounded-xl shadow-sm p-3">
                  <h4 className="text-sm font-semibold">
                    Shot Type Frequency
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={strokeData}>
                        <XAxis dataKey="name" style={{ fontSize: "11px" }} />
                        <YAxis width={25} />
                        <Tooltip />
                        <Bar 
                          dataKey="value" 
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={true}
                          animationBegin={idx * 100}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {strokeData.map((entry, i) => (
                            <Cell key={i} fill={getShotColor(entry.name)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* SHOT FEED */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">
                    Shot Feed (This Game)
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {gameShots.length} total
                  </Badge>
                </div>

                <ul className="divide-y divide-gray-200 dark:divide-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 overflow-hidden">
                  {gameShots.length ? (
                    gameShots.map((shot, i) => {
                      const playerName =
                        shot.player.fullName ||
                        shot.player.username ||
                        "Unknown Player";

                      const shotType = formatShotType(shot.stroke);
                      const hasCoordinates =
                        shot.originX != null &&
                        shot.originY != null &&
                        shot.landingX != null &&
                        shot.landingY != null;
                      
                      // Calculate game score at the time of this shot
                      // Count shots by side up to and including this shot
                      let gameScoreSide1 = 0;
                      let gameScoreSide2 = 0;
                      for (let j = 0; j <= i; j++) {
                        if (gameShots[j].side === "side1") {
                          gameScoreSide1++;
                        } else if (gameShots[j].side === "side2") {
                          gameScoreSide2++;
                        }
                      }
                      const currentGameScore = {
                        side1Score: gameScoreSide1,
                        side2Score: gameScoreSide2,
                      };
                      
                      // Generate full commentary with server, game score, and set score if available
                      let commentary: string | null = null;
                      if (hasCoordinates) {
                        if (participants && finalScore) {
                          // Calculate set score at the time of this shot
                          // Count completed games before this one
                          let setsWonSide1 = 0;
                          let setsWonSide2 = 0;
                          for (let j = 0; j < idx; j++) {
                            if (games[j].winnerSide === "side1") setsWonSide1++;
                            if (games[j].winnerSide === "side2") setsWonSide2++;
                          }
                          // For current game, the set score is what it was at the start
                          // (since this shot is part of this game)
                          const currentSetScore = {
                            side1Sets: setsWonSide1,
                            side2Sets: setsWonSide2,
                          };
                          
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
                          // Fallback to short commentary
                          commentary = generateShortCommentary(shot);
                        }
                      }

                      return (
                        <li
                          key={i}
                          className="flex flex-col gap-1.5 text-xs sm:text-sm px-3 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 dark:text-zinc-600 font-mono text-xs">
                              {i + 1}.
                            </span>
                            <span className="flex-1">
                              <strong className="text-gray-900 dark:text-zinc-100">
                                {playerName}
                              </strong>{" "}
                              <span className="text-gray-500 dark:text-zinc-400 text-xs">
                                ({shot.side})
                              </span>{" "}
                              →{" "}
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {shotType}
                              </span>
                            </span>
                          </div>

                          {/* Advanced Commentary */}
                          {commentary && (
                            <div className="flex items-start gap-2 ml-8 text-xs">
                              <MessageSquare className="w-3 h-3 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <span 
                                className="text-gray-600 dark:text-zinc-400 italic leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                  __html: commentary.replace(
                                    /<strong>(.*?)<\/strong>/g, 
                                    '<strong class="font-bold text-gray-900 dark:text-zinc-100 not-italic">$1</strong>'
                                  )
                                }}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-3 py-3 text-sm text-gray-500 dark:text-zinc-500 italic">
                      No shots recorded…
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

