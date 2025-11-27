import { Play, BarChart3, Radio } from "lucide-react";
import Link from "next/link";
import { IndividualGame, Match, SubMatch } from "@/types/match.type";

interface Props {
  match: Match;
  matchId: string;
  isScorer: boolean;
}

export default function MatchActions({ match, matchId, isScorer }: Props) {
  const hasShots =
    (match.matchCategory === "individual" &&
      match.games?.some((g: IndividualGame) => g.shots?.length)) ||
    (match.matchCategory === "team" &&
      match.subMatches?.some((sm: SubMatch) =>
        sm.games?.some((g) => g.shots?.length)
      ));

  const showLiveAction = ["scheduled", "in_progress"].includes(match.status);

  if (!showLiveAction && !hasShots) return null;

  return (
    <div className="p-5">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Actions
      </h3>

      <div className="flex flex-col gap-3">
        {showLiveAction && (
          <Link
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white text-sm font-medium"
            href={
              isScorer
                ? `/matches/${matchId}/score?category=${match.matchCategory}`
                : `/matches/${matchId}/live?category=${match.matchCategory}`
            }
          >
            {isScorer ? (
              <>
                <Play className="w-4 h-4" />
                {match.status === "scheduled" ? "Start Match" : "Continue Match"}
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                View Live
              </>
            )}
          </Link>
        )}

        {hasShots && (
          <Link
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all text-zinc-700 dark:text-zinc-200 text-sm font-medium"
            href={`/matches/${matchId}/stats?category=${match.matchCategory}`}
          >
            <BarChart3 className="w-4 h-4" />
            View Match Insights
          </Link>
        )}
      </div>
    </div>
  );
}
