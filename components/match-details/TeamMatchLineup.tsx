import { Trophy, Radio } from "lucide-react";
import MatchTypeBadge from "@/components/MatchTypeBadge";
import { SubMatch, TeamMatch } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export default function TeamMatchLineup({ match }: Props) {
  return (
    <div className="p-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Match Lineup
      </h3>
      <div className="space-y-2">
        {match.subMatches?.map((subMatch: SubMatch, idx: number) => (
          <SubMatchCard key={idx} subMatch={subMatch} index={idx} />
        ))}
      </div>
    </div>
  );
}

function SubMatchCard({ subMatch, index }: { subMatch: SubMatch; index: number }) {
  const isCompleted = subMatch.status === "completed";
  const isInProgress = subMatch.status === "in_progress";

  const team1Players = Array.isArray(subMatch.playerTeam1)
    ? subMatch.playerTeam1
    : [subMatch.playerTeam1];
  const team2Players = Array.isArray(subMatch.playerTeam2)
    ? subMatch.playerTeam2
    : [subMatch.playerTeam2];

  const team1Names = team1Players
    .map((p: any) => p?.fullName || p?.username || "TBD")
    .join(" & ");
  const team2Names = team2Players
    .map((p: any) => p?.fullName || p?.username || "TBD")
    .join(" & ");

  const team1Won = subMatch.winnerSide === "team1";
  const team2Won = subMatch.winnerSide === "team2";

  return (
    <div
      className={`p-4 transition-all ${
        isInProgress
          ? "bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800"
          : isCompleted
          ? "bg-zinc-50 dark:bg-zinc-800/50"
          : "bg-zinc-50 dark:bg-zinc-800/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            M{index + 1} • <span className="text-xs">{subMatch.matchType}</span>
          </p>
        </div>
        <StatusBadge status={subMatch.status} />
      </div>

      {/* Players */}
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-medium flex-1 ${
          team1Won
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-700 dark:text-zinc-300"
        }`}>
          {team1Names}
        </p>

        {isCompleted && subMatch.finalScore ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900">
            <span className={`text-sm font-bold tabular-nums ${
              team1Won ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
            }`}>
              {subMatch.finalScore.team1Sets}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 text-xs">:</span>
            <span className={`text-sm font-bold tabular-nums ${
              team2Won ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
            }`}>
              {subMatch.finalScore.team2Sets}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 px-2">vs</span>
        )}

        <p className={`text-sm font-medium flex-1 text-right ${
          team2Won
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-700 dark:text-zinc-300"
        }`}>
          {team2Names}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
        <Radio className="w-3 h-3 animate-pulse" />
        Live
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        Done
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
      Pending
    </span>
  );
}