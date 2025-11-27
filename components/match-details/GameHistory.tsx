import { IndividualMatch } from "@/types/match.type";
import { Trophy } from "lucide-react";

interface Props {
  match: IndividualMatch;
}

export default function GamesHistory({ match }: Props) {
  if (!match.games?.length) return null;

  return (
    <div className="p-5">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Game Scores
      </h3>
      <div className="space-y-2">
        {match.games.map((g: any) => {
          const side1Won = g.winnerSide === "side1";
          const side2Won = g.winnerSide === "side2";

          return (
            <div
              key={g.gameNumber}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
            >
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Game {g.gameNumber}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold tabular-nums ${
                  side1Won
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {g.side1Score}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">-</span>
                <span className={`text-sm font-semibold tabular-nums ${
                  side2Won
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {g.side2Score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}