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
  if (!games || games.length === 0) {
    return null;
  }

  // Determine overall winner
  const isTeamMatch = winnerSide === "team1" || winnerSide === "team2";
  const overallWinner = isTeamMatch
    ? winnerSide === "team1"
      ? "side1"
      : "side2"
    : winnerSide;

  return (
    <div className="w-full py-4">
      <h3 className="text-base font-semibold mb-4 text-[#353535]">
        Match Timeline
      </h3>

      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-4">
          {games.map((game, idx) => {
            const side1Won = game.side1Score > game.side2Score;
            const side2Won = game.side2Score > game.side1Score;
            const isDraw = game.side1Score === game.side2Score;

            return (
              <div key={idx} className="flex items-center">
                {/* Game Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  className="shrink-0"
                >
                  <div className="bg-white border border-[#d9d9d9] p-2">
                    <div className="text-xs text-center text-[#d9d9d9] mb-2 font-medium">
                      Game {idx + 1}
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span
                        className={`text-lg font-bold ${
                          side1Won ? "text-[#3c6e71]" : "text-[#d9d9d9]"
                        }`}
                      >
                        {game.side1Score}
                      </span>
                      <span className="text-xs text-[#d9d9d9]">-</span>
                      <span
                        className={`text-lg font-bold ${
                          side2Won ? "text-[#3c6e71]" : "text-[#d9d9d9]"
                        }`}
                      >
                        {game.side2Score}
                      </span>
                    </div>

                    {/* Winner Indicator */}
                    <div className="flex items-center justify-center gap-1">
                      {side1Won && (
                        <div className="flex items-center gap-1 text-[#3c6e71]">
                          <Check className="h-3 w-3" />
                          <span className="text-xs font-medium truncate max-w-20">
                            {side1Name}
                          </span>
                        </div>
                      )}
                      {side2Won && (
                        <div className="flex items-center gap-1 text-[#3c6e71]">
                          <Check className="h-3 w-3" />
                          <span className="text-xs font-medium truncate max-w-20">
                            {side2Name}
                          </span>
                        </div>
                      )}
                      {isDraw && (
                        <span className="text-xs text-[#d9d9d9]">Draw</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Connector Line (except for last game) */}
                {idx < games.length - 1 && (
                  <div className="shrink-0 w-6 h-0.5 bg-[#d9d9d9]" />
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Overall Result */}
      {overallWinner && (
        <div className="mt-4 pt-4 border-t border-[#d9d9d9]">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <Check className="h-4 w-4 text-[#3c6e71]" />
              <span className="text-sm font-semibold text-[#3c6e71]">
                {overallWinner === "side1" ? side1Name : side2Name} won the match
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
