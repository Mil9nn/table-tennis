import { IndividualMatch } from "@/types/match.type";
import { Trophy } from "lucide-react";
import { getSinglesParticipantIds, singlesGamePointScores, singlesGameWinnerPlayerId } from "@/lib/match/singlesClient";

interface Props {
  match: IndividualMatch;
}

export default function GamesHistory({ match }: Props) {
  if (!match.games?.length) return null;

  return (
    <div className="p-4 border-b border-zinc-100">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
        Set Scores
      </h3>
      <div className="space-y-2 p-2">
        {match.games.map((g: any) => {
          const ids = getSinglesParticipantIds(match.participants || []);
          const pts = ids
            ? singlesGamePointScores(g, ids[0], ids[1])
            : { side1Score: g.side1Score ?? 0, side2Score: g.side2Score ?? 0 };
          const gameWinnerId = ids ? singlesGameWinnerPlayerId(g, ids[0], ids[1]) : null;
          const side1Won = gameWinnerId
            ? String(gameWinnerId) === String(match.participants?.[0]?._id)
            : g.winnerSide === "side1";
          const side2Won = gameWinnerId
            ? String(gameWinnerId) === String(match.participants?.[1]?._id)
            : g.winnerSide === "side2";

          return (
            <div
              key={g.gameNumber}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Set {g.gameNumber}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold tabular-nums ${
                  side1Won
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {pts.side1Score}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">-</span>
                <span className={`text-sm font-semibold tabular-nums ${
                  side2Won
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {pts.side2Score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}