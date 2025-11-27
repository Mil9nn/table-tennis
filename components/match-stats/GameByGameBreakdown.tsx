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
import {
  computeStats,
  getShotColor,
} from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";

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
}

export function GameByGameBreakdown({
  games,
  side1Name,
  side2Name,
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
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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

                      return (
                        <li
                          key={i}
                          className="flex justify-between items-center text-xs sm:text-sm px-3 py-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-gray-400 dark:text-zinc-600">
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
                                {formatShotType(shot.stroke)}
                              </span>
                            </span>
                          </div>
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
