"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Game {
  side1Score: number;
  side2Score: number;
  winnerSide?: "side1" | "side2";
}

interface MatchTimelineProps {
  games: Game[];
  side1Name: string;
  side2Name: string;
  winnerSide?: "side1" | "side2" | "team1" | "team2";
}

export function MatchTimeline({
  games,
  side1Name,
  side2Name,
  winnerSide,
}: MatchTimelineProps) {
  if (!games || games.length === 0) return null;

  /* -------------------------------
     Winner Resolution (UNCHANGED)
  -------------------------------- */
  const isTeamMatch = winnerSide === "team1" || winnerSide === "team2";
  const overallWinner = isTeamMatch
    ? winnerSide === "team1"
      ? "side1"
      : "side2"
    : winnerSide;

  return (
    <div className="w-full rounded-lg border border-neutral-200 bg-white p-5">
      {/* Header */}
      <h3 className="mb-4 text-sm font-semibold text-neutral-900">
        Match Timeline
      </h3>

      {/* Timeline */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-3 pb-4">
          {games.map((game, idx) => {
            const side1Won = game.side1Score > game.side2Score;
            const side2Won = game.side2Score > game.side1Score;
            const isDraw = game.side1Score === game.side2Score;

            return (
              <div key={idx} className="flex items-center">
                {/* Game Node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.25 }}
                  className="shrink-0"
                >
                  <div className="rounded-md bg-neutral-50 px-4 py-3 min-w-[96px] text-center">
                    <div className="mb-2 text-[11px] font-medium text-neutral-500">
                      Game {idx + 1}
                    </div>

                    {/* Scores */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span
                        className={`text-lg font-semibold ${
                          side1Won
                            ? "text-[#3c6e71]"
                            : "text-neutral-400"
                        }`}
                      >
                        {game.side1Score}
                      </span>
                      <span className="text-xs text-neutral-400">–</span>
                      <span
                        className={`text-lg font-semibold ${
                          side2Won
                            ? "text-[#3c6e71]"
                            : "text-neutral-400"
                        }`}
                      >
                        {game.side2Score}
                      </span>
                    </div>

                    {/* Winner */}
                    <div className="flex items-center justify-center gap-1 text-[11px]">
                      {side1Won && (
                        <span className="flex items-center gap-1 font-medium text-[#3c6e71]">
                          <Check className="h-3 w-3" />
                          {side1Name}
                        </span>
                      )}
                      {side2Won && (
                        <span className="flex items-center gap-1 font-medium text-[#3c6e71]">
                          <Check className="h-3 w-3" />
                          {side2Name}
                        </span>
                      )}
                      {isDraw && (
                        <span className="text-neutral-400">Draw</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Connector */}
                {idx < games.length - 1 && (
                  <div className="mx-2 h-[2px] w-8 rounded bg-neutral-200" />
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Match Result */}
      {overallWinner && (
        <div className="mt-5 rounded-md bg-[#3c6e71]/5 px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-[#3c6e71]" />
            <span className="text-sm font-semibold text-[#3c6e71]">
              {overallWinner === "side1"
                ? side1Name
                : side2Name}{" "}
              won the match
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
