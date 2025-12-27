"use client";

import { Badge } from "@/components/ui/badge";
import { IndividualGame, Participant } from "@/types/match.type";

interface GamesHistoryProps {
  games: IndividualGame[];
  currentGame?: number;
  participants?: Participant[];
}

export default function GamesHistory({
  games,
  currentGame,
  participants,
}: GamesHistoryProps) {
  if (!games || games.length === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Sets History
        </h3>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 flex-wrap">
          {games.map((game) => {
            const winnerName =
              game.winnerSide === "side1"
                ? participants?.[0]?.fullName ??
                  participants?.[0]?.username ??
                  "Player 1"
                : game.winnerSide === "side2"
                ? participants?.[1]?.fullName ??
                  participants?.[1]?.username ??
                  "Player 2"
                : null;

            const isCurrentGame =
              game.gameNumber === currentGame && !game.winnerSide;

            return (
              <div
                key={game.gameNumber}
                className={`w-fit flex text-sm items-center justify-between gap-3 px-4 py-2 rounded-sm transition-colors ${
                  isCurrentGame
                    ? "bg-gradient-to-r from-[#3c6e71]/10 to-[#284b63]/10 border border-[#3c6e71]/30 text-[#284b63] dark:from-[#3c6e71]/20 dark:to-[#284b63]/20 dark:text-[#3c6e71] font-semibold"
                    : winnerName
                    ? "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    : "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="font-medium">
                  Set {game.gameNumber}:{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    {game.side1Score ?? 0} - {game.side2Score ?? 0}
                  </span>
                </span>
                {winnerName && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-[#3c6e71]/20 text-[#284b63] dark:bg-[#3c6e71]/30 dark:text-[#3c6e71] border-0"
                  >
                    {winnerName}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
