"use client";

import { Badge } from "@/components/ui/badge";
import { IndividualGame, Participant } from "@/types/match.type";
import clsx from "clsx";

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
  if (!games?.length) return null;

  return (
    <section className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold tracking-tight">
          Match Timeline
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Set-by-set progression
        </p>
      </header>

      <div className="px-6 py-5 space-y-2">
        {games.map((game) => (
          <GameHistoryItem
            key={game.gameNumber}
            game={game}
            isCurrent={game.gameNumber === currentGame && !game.winnerSide}
            participants={participants}
          />
        ))}
      </div>
    </section>
  );
}


function GameHistoryItem({
  game,
  isCurrent,
  participants,
}: {
  game: IndividualGame;
  isCurrent: boolean;
  participants?: Participant[];
}) {
  const winnerName =
    game.winnerSide === "side1"
      ? participants?.[0]?.fullName ?? participants?.[0]?.username
      : game.winnerSide === "side2"
      ? participants?.[1]?.fullName ?? participants?.[1]?.username
      : null;

  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4 py-2.5 rounded-md transition",
        "bg-zinc-50 dark:bg-zinc-800/60",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        {
          "ring-1 ring-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10":
            isCurrent,
        }
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-zinc-500">
          Set {game.gameNumber}
        </span>

        <span className="font-semibold tabular-nums tracking-tight">
          {game.side1Score ?? 0}
          <span className="mx-1 text-zinc-400">–</span>
          {game.side2Score ?? 0}
        </span>
      </div>

      {winnerName && (
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {winnerName}
        </span>
      )}

      {isCurrent && (
        <span className="ml-3 text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Live
        </span>
      )}
    </div>
  );
}
