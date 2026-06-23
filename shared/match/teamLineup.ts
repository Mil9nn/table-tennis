/**
 * Team match lineup utilities (position labels A/B/C vs X/Y/Z).
 * Single source for pairing order, validation, and rubber preview.
 */

import {
  FORMAT_REQUIREMENTS,
  TeamMatchFormat,
  TeamSubMatchType,
} from "./teamMatchTypes.core";

/** playerId → position label (e.g. "A", "X") */
export type PlayerAssignments = Record<string, string>;

export interface RubberPairing {
  matchNumber: number;
  matchType: TeamSubMatchType;
  team1Position: string;
  team2Position: string;
}

export interface RubberPreview extends RubberPairing {
  team1PlayerId: string | null;
  team2PlayerId: string | null;
  team1PlayerName?: string;
  team2PlayerName?: string;
}

export const FIVE_SINGLES_PAIRINGS: ReadonlyArray<readonly [string, string]> = [
  ["A", "X"],
  ["B", "Y"],
  ["C", "Z"],
  ["A", "Y"],
  ["B", "X"],
] as const;

/** Build position → playerId map from playerId → position assignments */
export function toPositionPlayerMap(
  assignments: PlayerAssignments
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [playerId, position] of Object.entries(assignments)) {
    if (position) map.set(position, playerId);
  }
  return map;
}

/** Convert position-first slots (position → playerId) to API assignment shape */
export function slotsToPlayerAssignments(
  slots: Record<string, string | null | undefined>
): PlayerAssignments {
  const out: PlayerAssignments = {};
  for (const [position, playerId] of Object.entries(slots)) {
    if (playerId) out[playerId] = position;
  }
  return out;
}

export function getPairingsForFormat(format: TeamMatchFormat): RubberPairing[] {
  switch (format) {
    case "five_singles":
      return FIVE_SINGLES_PAIRINGS.map((pair, index) => ({
        matchNumber: index + 1,
        matchType: "singles" as const,
        team1Position: pair[0],
        team2Position: pair[1],
      }));
    case "single_double_single":
      return [
        {
          matchNumber: 1,
          matchType: "singles",
          team1Position: "A",
          team2Position: "X",
        },
        {
          matchNumber: 2,
          matchType: "doubles",
          team1Position: "A+B",
          team2Position: "X+Y",
        },
        {
          matchNumber: 3,
          matchType: "singles",
          team1Position: "B",
          team2Position: "Y",
        },
      ];
    default:
      return [];
  }
}

export function formatRequiresLineup(format: TeamMatchFormat): boolean {
  return FORMAT_REQUIREMENTS[format].team1.length > 0;
}

export interface LineupValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate match-time lineup for standard team formats.
 */
export function validateLineupForFormat(
  format: TeamMatchFormat,
  team1Assignments: PlayerAssignments,
  team2Assignments: PlayerAssignments,
  team1Name = "Team 1",
  team2Name = "Team 2"
): LineupValidationResult {
  const requirements = FORMAT_REQUIREMENTS[format];
  const errors: string[] = [];

  if (requirements.team1.length === 0) {
    return { valid: true, errors: [] };
  }

  const validateSide = (
    assignments: PlayerAssignments,
    requiredPositions: string[],
    label: string
  ) => {
    if (Object.keys(assignments).length === 0) {
      errors.push(`${label}: assign players to positions for this match.`);
      return;
    }

    const positionToPlayer = toPositionPlayerMap(assignments);
    const usedPositions = new Set<string>();

    for (const [, position] of Object.entries(assignments)) {
      if (!position) continue;
      if (usedPositions.has(position)) {
        errors.push(`${label}: position ${position} is assigned to more than one player.`);
      }
      usedPositions.add(position);
    }

    for (const pos of requiredPositions) {
      if (!positionToPlayer.has(pos)) {
        errors.push(`${label}: position ${pos} is required.`);
      }
    }

    const allowed = new Set(requiredPositions);
    for (const pos of usedPositions) {
      if (!allowed.has(pos)) {
        errors.push(`${label}: position ${pos} is not used in this format.`);
      }
    }
  };

  validateSide(team1Assignments, requirements.team1, team1Name);
  validateSide(team2Assignments, requirements.team2, team2Name);

  return { valid: errors.length === 0, errors };
}

export function buildRubberPreview(
  format: TeamMatchFormat,
  team1Assignments: PlayerAssignments,
  team2Assignments: PlayerAssignments,
  resolvePlayerName?: (playerId: string, side: "team1" | "team2") => string | undefined
): RubberPreview[] {
  const team1Map = toPositionPlayerMap(team1Assignments);
  const team2Map = toPositionPlayerMap(team2Assignments);
  const pairings = getPairingsForFormat(format);

  return pairings.map((pairing) => {
    let team1PlayerId: string | null = null;
    let team2PlayerId: string | null = null;
    let team1PlayerName: string | undefined;
    let team2PlayerName: string | undefined;

    if (pairing.matchType === "doubles") {
      const [p1, p2] = pairing.team1Position.split("+");
      const [x, y] = pairing.team2Position.split("+");
      const ids1 = [team1Map.get(p1), team1Map.get(p2)].filter(Boolean) as string[];
      const ids2 = [team2Map.get(x), team2Map.get(y)].filter(Boolean) as string[];
      team1PlayerId = ids1[0] ?? null;
      team2PlayerId = ids2[0] ?? null;
      team1PlayerName = ids1
        .map((id) => resolvePlayerName?.(id, "team1") ?? "?")
        .join(" + ");
      team2PlayerName = ids2
        .map((id) => resolvePlayerName?.(id, "team2") ?? "?")
        .join(" + ");
    } else {
      team1PlayerId = team1Map.get(pairing.team1Position) ?? null;
      team2PlayerId = team2Map.get(pairing.team2Position) ?? null;
      team1PlayerName = team1PlayerId
        ? resolvePlayerName?.(team1PlayerId, "team1")
        : undefined;
      team2PlayerName = team2PlayerId
        ? resolvePlayerName?.(team2PlayerId, "team2")
        : undefined;
    }

    return {
      ...pairing,
      team1PlayerId,
      team2PlayerId,
      team1PlayerName,
      team2PlayerName,
    };
  });
}

export function formatRubberPreviewLabel(preview: RubberPreview): string {
  const p1 = preview.team1PlayerName ?? preview.team1Position;
  const p2 = preview.team2PlayerName ?? preview.team2Position;
  return `${p1} vs ${p2}`;
}
