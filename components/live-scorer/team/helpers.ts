import { PlayerKey } from "@/types/match.type";

/* --------------------------------------------------
 *  BASIC SCORING (reuse from individual)
 * -------------------------------------------------- */

export const checkGameWon = (side1: number, side2: number): PlayerKey | null => {
  if ((side1 >= 11 || side2 >= 11) && Math.abs(side1 - side2) >= 2) {
    return side1 > side2 ? "side1" : "side2";
  }
  return null;
};

export const formatScore = (side1: number, side2: number): string =>
  `${side1}-${side2}`;

export const isGameInDeuce = (side1: number, side2: number): boolean =>
  side1 >= 10 && side2 >= 10;

export const getGameStatus = (side1: number, side2: number): string => {
  const winner = checkGameWon(side1, side2);
  if (winner) {
    return winner === "side1" ? "Team 1 Wins Game" : "Team 2 Wins Game";
  }

  if (isGameInDeuce(side1, side2)) {
    const leader = side1 > side2 ? "Team 1" : side2 > side1 ? "Team 2" : null;
    if (leader) {
      return `Deuce - ${leader} Advantage`;
    }
    return "Deuce";
  }

  return "In Progress";
};

export const checkSubMatchWonBySets = (
  side1Sets: number,
  side2Sets: number,
  numberOfSets: number
): PlayerKey | null => {
  const setsNeeded = Math.ceil(numberOfSets / 2);
  if (side1Sets >= setsNeeded) return "side1";
  if (side2Sets >= setsNeeded) return "side2";
  return null;
};

/* --------------------------------------------------
 *  TEAM FORMAT HELPERS
 * -------------------------------------------------- */

/**
 * Build submatch order based on team format and assignments.
 * 
 * Each player in team1 / team2 must have an assignment (A, B, C, D, E / X, Y, Z, P, Q).
 */
export const generateSubMatches = (
  format: string,
  team1: { user: any; assignment?: string }[],
  team2: { user: any; assignment?: string }[]
) => {
  const lookup = (symbol: string) =>
    team1.find((p) => p.assignment === symbol)?.user ||
    team2.find((p) => p.assignment === symbol)?.user ||
    null;

  switch (format) {
    case "swaythling_format": // ABCAB vs XYZYX
      return [
        { type: "singles", team1Players: [lookup("A")], team2Players: [lookup("X")] },
        { type: "singles", team1Players: [lookup("B")], team2Players: [lookup("Y")] },
        { type: "singles", team1Players: [lookup("C")], team2Players: [lookup("Z")] },
        { type: "singles", team1Players: [lookup("A")], team2Players: [lookup("Y")] },
        { type: "singles", team1Players: [lookup("B")], team2Players: [lookup("X")] },
      ];

    case "single_double_single": // A, AB, B vs X, XY, Y
      return [
        { type: "singles", team1Players: [lookup("A")], team2Players: [lookup("X")] },
        {
          type: "doubles",
          team1Players: [lookup("A"), lookup("B")],
          team2Players: [lookup("X"), lookup("Y")],
        },
        { type: "singles", team1Players: [lookup("B")], team2Players: [lookup("Y")] },
      ];

    case "five_singles_full": // ABCDE vs XYZPQ
      return [
        { type: "singles", team1Players: [lookup("A")], team2Players: [lookup("X")] },
        { type: "singles", team1Players: [lookup("B")], team2Players: [lookup("Y")] },
        { type: "singles", team1Players: [lookup("C")], team2Players: [lookup("Z")] },
        { type: "singles", team1Players: [lookup("D")], team2Players: [lookup("P")] },
        { type: "singles", team1Players: [lookup("E")], team2Players: [lookup("Q")] },
      ];

    case "three_singles": // A, B, C vs X, Y, Z
      return [
        { type: "singles", team1Players: [lookup("A")], team2Players: [lookup("X")] },
        { type: "singles", team1Players: [lookup("B")], team2Players: [lookup("Y")] },
        { type: "singles", team1Players: [lookup("C")], team2Players: [lookup("Z")] },
      ];

    default:
      return [];
  }
};

/**
 * Validate that both teams provided required assignments for a given format.
 */
export const validateTeamFormat = (
  format: string,
  team1: { assignment?: string }[],
  team2: { assignment?: string }[]
): boolean => {
  const requiredAssignments: Record<string, string[][]> = {
    swaythling_format: [["A", "B", "C"], ["X", "Y", "Z"]],
    single_double_single: [["A", "B"], ["X", "Y"]],
    five_singles_full: [["A", "B", "C", "D", "E"], ["X", "Y", "Z", "P", "Q"]],
    three_singles: [["A", "B", "C"], ["X", "Y", "Z"]],
  };

  const req = requiredAssignments[format];
  if (!req) return false;

  const team1Symbols = team1.map((p) => p.assignment);
  const team2Symbols = team2.map((p) => p.assignment);

  return (
    req[0].every((sym) => team1Symbols.includes(sym)) &&
    req[1].every((sym) => team2Symbols.includes(sym))
  );
};

/**
 * Check if a team match is decided.
 * - swaythling_format = best of 5 (first to 3)
 * - single_double_single = best of 3 (first to 2)
 * - five_singles_full = best of 5 (first to 3) or all 5, depending on rules
 * - three_singles = best of 3 (first to 2)
 */
export const checkTeamMatchWon = (
  format: string,
  team1Matches: number,
  team2Matches: number
): "team1" | "team2" | null => {
  let matchesNeeded = 0;

  switch (format) {
    case "swaythling_format":
    case "five_singles_full":
      matchesNeeded = 3;
      break;
    case "single_double_single":
    case "three_singles":
      matchesNeeded = 2;
      break;
    default:
      return null;
  }

  if (team1Matches >= matchesNeeded) return "team1";
  if (team2Matches >= matchesNeeded) return "team2";
  return null;
};
