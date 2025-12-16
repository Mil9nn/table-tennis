import { ListOrdered, Layers } from "lucide-react";
import { TeamMatch } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export function TeamMatchFormat({ match }: Props) {
  // DEBUG: Log match data at component load
  console.log("🔵 [TEAM MATCH DISPLAY] Match data received:", {
    id: match._id,
    matchFormat: match.matchFormat,
    numberOfSetsPerSubMatch: match.numberOfSetsPerSubMatch,
    numberOfSetsPerSubMatch_type: typeof match.numberOfSetsPerSubMatch,
    subMatches_length: match.subMatches?.length,
    match_full: JSON.stringify(match, null, 2),
  });

  // Extract display values
  const displaySetCount = match.numberOfSetsPerSubMatch || 3;
  const displayMatchCount = match.subMatches?.length || 0;
  const matchFormatName = getMatchFormatName(match.matchFormat);

  // DEBUG: Log display values
  console.log("🟢 [TEAM MATCH DISPLAY] Display values:", {
    displaySetCount,
    displaySetCount_type: typeof displaySetCount,
    displayMatchCount,
    matchFormatName,
  });

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
          <span>
            {displayMatchCount} {matchFormatName}
            {/* DEBUG: Show what's being rendered */}
            <span style={{ color: 'red', marginLeft: '10px' }}>
              (setsPerSubMatch: {displaySetCount})
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Best of {displaySetCount}</span>
        </div>
      </div>

      {/* DEBUG: Log when submatches render */}
      {match.subMatches && match.subMatches.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
          <strong>DEBUG: SubMatches Detail:</strong>
          {match.subMatches.slice(0, 3).map((sm: any, idx: number) => (
            <div key={idx}>
              SubMatch {idx + 1}: numberOfSets={sm.numberOfSets}
            </div>
          ))}
        </div>
      )}
    </div>
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