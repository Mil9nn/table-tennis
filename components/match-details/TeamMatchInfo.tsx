import { ListOrdered, Layers } from "lucide-react";
import { TeamMatch } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export function TeamMatchFormat({ match }: Props) {
  const displaySetCount = match.numberOfGamesPerRubber || 3;
  const displayMatchCount = match.subMatches?.length || 0;
  const matchFormatName = getMatchFormatName(match.matchFormat);

  return (
    <section className="px-6 py-5 space-y-5">
      <header>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Match Structure
        </h3>
      </header>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

        <div className="space-y-0.5">
          <p className="text-sm font-semibold truncate">
            {match.team1.name}
          </p>
          <p className="text-xs text-zinc-500">
            {match.team1.players?.length || 0} players
          </p>
        </div>

        {/* Center VS */}
        <div className="flex flex-col items-center">
          <span className="px-3 py-1 rounded-md text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide">
            VS
          </span>
        </div>

        <div className="space-y-0.5 text-right">
          <p className="text-sm font-semibold truncate">
            {match.team2.name}
          </p>
          <p className="text-xs text-zinc-500">
            {match.team2.players?.length || 0} players
          </p>
        </div>

      </div>

      {/* Format Info */}
      <div className="flex items-center justify-between rounded-md bg-zinc-50 dark:bg-zinc-800/60 px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{displayMatchCount} {matchFormatName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Best of {displaySetCount} games</span>
        </div>
      </div>
    </section>
  );
}

// Helper function to get match format name
function getMatchFormatName(format?: string): string {
  const formatNames: Record<string, string> = {
    five_singles: "Singles",
    singles_doubles_singles: "S-D-S",
    single_double_single: "S-D-S",
    custom: "Matches",
  };
  return formatNames[format || "five_singles"] || format || "Matches";
}