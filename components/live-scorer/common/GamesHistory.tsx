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
    <section className="rounded-xl bg-white dark:bg-zinc-950 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
      <header className="px-6 py-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Sets history
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Game-by-game breakdown
        </p>
      </header>

      <div className="px-6 pb-6 flex flex-wrap gap-2">
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
        "flex items-center gap-2 px-4 py-2 text-sm transition-all",
        "bg-zinc-50 dark:bg-zinc-900",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        {
          "ring-1 ring-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10":
            isCurrent,
        }
      )}
    >
      <span className="font-medium text-zinc-800 dark:text-zinc-200">
        Set {game.gameNumber}
        <span className="ml-2 text-zinc-500 font-normal tabular-nums">
          {game.side1Score ?? 0}–{game.side2Score ?? 0}
        </span>
      </span>

      {winnerName && (
        <Badge
          variant="secondary"
          className="ml-auto text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        >
          {winnerName}
        </Badge>
      )}
    </div>
  );
}
