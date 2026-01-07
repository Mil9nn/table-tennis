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
                    ? side1Name
                    : side2Name}
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

                  if (
                    shot.originX != null &&
                    participants &&
                    finalScore &&
                    finalScore.side1Sets != null &&
                    finalScore.side2Sets != null
                  ) {
                    commentary = generateFullCommentary(
                      shot,
                      participants,
                      games,
                      {
                        side1Sets: finalScore.side1Sets,
                        side2Sets: finalScore.side2Sets,
                      },
                      side1Name,
                      side2Name
                    );
                  }

                  return (
                    <li
                      key={originalIndex}
                      className="flex gap-3 text-sm"
                    >
                      <span className="w-5 text-right text-xs text-[#9aa0a6]">
                        {game.shots.length - i}
                      </span>

                      <div className="flex-1">
                        {commentary ? (
                          <div
                            className="leading-relaxed text-[#353535]"
                            dangerouslySetInnerHTML={{
                              __html: commentary,
                            }}
                          />
                        ) : (
                          <span className="text-[#353535]">
                            Shot by{" "}
                            <strong>
                              {shot.player.fullName ||
                                shot.player.username}
                            </strong>
                          </span>
                        )}
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