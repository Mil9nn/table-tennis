import { Play, BarChart3, Radio } from "lucide-react";
import Link from "next/link";
import { IndividualGame, Match, SubMatch } from "@/types/match.type";

interface Props {
  match: Match;
  matchId: string;
  isScorer: boolean;
}

export default function MatchActions({ match, matchId, isScorer }: Props) {
  const status = match.status;

  const isScheduled = status === "scheduled";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  const hasShots =
    match.matchCategory === "individual"
      ? match.games?.some((g: IndividualGame) => g.shots?.length)
      : match.subMatches?.some((sm: SubMatch) =>
          sm.games?.some((g) => g.shots?.length)
        );

  const showScorerAction = isScorer && (isScheduled || isInProgress);
  const showViewLive = !isScorer && isInProgress;

  // If completed but no shots, no actions → hide section
  const hasAnyAction = showScorerAction || showViewLive || hasShots;

  if (!hasAnyAction) return null;

  return (
    <div className="p-5 border-t border-zinc-100 dark:border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Actions
      </h3>

      <div className="flex flex-col gap-2.5">
        {showScorerAction && (
          <Link
            className="group flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-all text-white text-sm font-semibold shadow-sm hover:shadow"
            href={`/matches/${matchId}/score?category=${match.matchCategory}`}
          >
            <Play className="w-4 h-4 transition-transform group-hover:scale-110" />
            {isScheduled ? "Start Match" : "Continue Match"}
          </Link>
        )}

        {showViewLive && (
          <Link
            className="group flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-all text-white text-sm font-semibold shadow-sm hover:shadow"
            href={`/matches/${matchId}/live?category=${match.matchCategory}`}
          >
            <Radio className="w-4 h-4 transition-transform group-hover:scale-110" />
            View Live
          </Link>
        )}

        {hasShots && (
          <Link
            className="group flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all text-zinc-700 dark:text-zinc-200 text-sm font-semibold shadow-sm hover:shadow"
            href={`/matches/${matchId}/stats?category=${match.matchCategory}`}
          >
            <BarChart3 className="w-4 h-4 transition-transform group-hover:scale-110" />
            View Match Insights
          </Link>
        )}
      </div>
    </div>
  );
}