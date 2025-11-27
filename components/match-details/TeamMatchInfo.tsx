import { Users, ListOrdered, Layers } from "lucide-react";
import { TeamMatch } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export function TeamMatchFormat({ match }: Props) {
  return (
    <div className="p-5">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Teams
      </h3>

      <div className="flex items-center justify-between gap-4">
        {/* Team 1 */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {match.team1.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {match.team1.players?.length || 0} players
          </p>
        </div>

        {/* VS Badge */}
        <div className="flex-shrink-0">
          <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            VS
          </span>
        </div>

        {/* Team 2 */}
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {match.team2.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {match.team2.players?.length || 0} players
          </p>
        </div>
      </div>

      {/* Format Info */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{match.subMatches?.length || 0} matches</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Best of {match.numberOfSetsPerSubMatch}</span>
        </div>
      </div>
    </div>
  );
}