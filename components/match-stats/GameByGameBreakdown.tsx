"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronUp } from "lucide-react";

import { Shot } from "@/types/shot.type";
import { Participant } from "@/types/match.type";
import { computeStats, getShotColor } from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { formatPlayerName } from "@/lib/player-name-utils";
import {
  generateShortCommentary,
  generateFullCommentary,
} from "@/lib/shot-commentary-utils";
import { useInView } from "@/hooks/useInView";

interface Game {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winnerSide?: string | null;
  shots: Shot[];
}

interface Props {
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
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setExpanded((s) => {
      const next = new Set(s);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-sm font-semibold text-[#353535]">
          Game-by-game
        </h3>
      </header>

      {games.map((game, idx) => {
        const stats = computeStats(game.shots || []);
        const isOpen = expanded.has(idx);

        const strokeData = Object.entries(stats.shotTypes).map(
          ([type, value]) => ({
            name: formatStrokeName(type),
            value,
          })
        );

        return (
          <div
            key={idx}
            className="rounded-xl bg-white px-4 py-3 shadow-[0_0_0_1px_#e6e8eb]"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-medium">
                  Game {game.gameNumber}
                </span>
                <span className="text-xs text-[#9aa0a6]">
                  {game.side1Score}–{game.side2Score}
                </span>
              </div>

              {game.winnerSide && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {game.winnerSide === "side1"
                    ? formatPlayerName(side1Name)
                    : formatPlayerName(side2Name)}
                </Badge>
              )}
            </div>

            {/* Chart */}
            {strokeData.length > 0 && (
              <div className="mt-4">
                <GameStrokeChart strokeData={strokeData} />
              </div>
            )}

            {/* Shot feed toggle */}
            <button
              onClick={() => toggle(idx)}
              className="mt-3 flex w-full items-center justify-between text-xs text-[#6b7280]"
            >
              <span>{game.shots.length} shots</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Shot feed */}
            {isOpen && (
              <ul className="mt-3 space-y-3 border-t pt-3">
                {[...game.shots].reverse().map((shot, i) => {
                  const originalIndex =
                    game.shots.length - 1 - i;

                  let commentary: string | null = null;

                  // Calculate current game score at the time of this shot
                  // Count points for each side up to this shot
                  let side1Points = 0;
                  let side2Points = 0;
                  
                  for (let j = 0; j <= originalIndex; j++) {
                    const prevShot = game.shots[j];
                    if (prevShot.side === "side1" || prevShot.side === "team1") {
                      side1Points++;
                    } else {
                      side2Points++;
                    }
                  }
                  
                  const currentGameScore = { side1Score: side1Points, side2Score: side2Points };

                  // Always generate commentary (generateFullCommentary handles missing coordinates gracefully)
                  if (participants) {
                    // Use generateFullCommentary when participants are available (even without detailed tracking)
                    commentary = generateFullCommentary(
                      shot,
                      participants,
                      games,
                      (finalScore && finalScore.side1Sets != null && finalScore.side2Sets != null) ? {
                        side1Sets: finalScore.side1Sets,
                        side2Sets: finalScore.side2Sets,
                      } : undefined,
                      side1Name,
                      side2Name,
                      currentGameScore
                    );
                  } else {
                    // Fallback to short commentary if we don't have participants
                    commentary = generateShortCommentary(shot);
                  }

                  return (
                    <li
                      key={originalIndex}
                      className="flex gap-3 text-xs sm:text-sm py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-lg px-2"
                    >
                      {/* Shot number */}
                      <span className="text-gray-400 dark:text-gray-500 font-mono text-xs pt-0.5">
                        {game.shots.length - i}.
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
                                {shot.player.fullName || shot.player.username}
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
                                {shot.stroke || "Unknown"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function GameStrokeChart({
  strokeData,
}: {
  strokeData: { name: string; value: number }[];
}) {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  return (
    <div ref={ref} className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={strokeData}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            cursor={{ fill: "#f9fafb" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e6e8eb",
            }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            isAnimationActive={isInView}
          >
            {strokeData.map((d, i) => (
              <Cell key={i} fill={getShotColor(d.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}