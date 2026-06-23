import type { TeamMatchFormat, TeamSubMatchType } from "@/shared/match/teamMatchTypes.core";

export interface TeamCustomSubMatchConfig {
  matchNumber: number;
  matchType: TeamSubMatchType;
}

export interface TeamConfigInput {
  matchFormat: TeamMatchFormat;
  setsPerSubMatch: number;
  customSubMatches?: TeamCustomSubMatchConfig[];
}

/** Default custom tie: five singles rubbers (editable at creation). */
export const DEFAULT_CUSTOM_SUB_MATCHES: TeamCustomSubMatchConfig[] = [
  { matchNumber: 1, matchType: "singles" },
  { matchNumber: 2, matchType: "singles" },
  { matchNumber: 3, matchType: "singles" },
  { matchNumber: 4, matchType: "singles" },
  { matchNumber: 5, matchType: "singles" },
];

export function normalizeTeamConfig<T extends TeamConfigInput>(teamConfig: T): T {
  if (!teamConfig?.matchFormat) return teamConfig;

  if (teamConfig.matchFormat === "custom") {
    const existing = teamConfig.customSubMatches?.filter(
      (m) => m?.matchNumber && m?.matchType
    );
    if (!existing?.length) {
      return {
        ...teamConfig,
        customSubMatches: DEFAULT_CUSTOM_SUB_MATCHES.map((m) => ({ ...m })),
      };
    }
    return {
      ...teamConfig,
      customSubMatches: existing.map((m, i) => ({
        matchNumber: m.matchNumber ?? i + 1,
        matchType: m.matchType,
      })),
    };
  }

  const { customSubMatches: _removed, ...rest } = teamConfig;
  return rest as T;
}

export function formatTeamMatchFormatLabel(matchFormat?: string): string {
  switch (matchFormat) {
    case "five_singles":
      return "5 singles (Swaythling)";
    case "single_double_single":
      return "Single–double–single";
    case "custom":
      return "Custom";
    default:
      return matchFormat?.replace(/_/g, " ") || "N/A";
  }
}

export function formatCustomRubbersSummary(
  customSubMatches?: TeamCustomSubMatchConfig[]
): string {
  if (!customSubMatches?.length) return "Not configured";
  const singles = customSubMatches.filter((m) => m.matchType === "singles").length;
  const doubles = customSubMatches.filter((m) => m.matchType === "doubles").length;
  const parts: string[] = [];
  if (singles) parts.push(`${singles} singles`);
  if (doubles) parts.push(`${doubles} doubles`);
  return `${customSubMatches.length} rubbers (${parts.join(", ")})`;
}
