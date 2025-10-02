"use client";

import type { TeamTie, TeamMatchFormat, SideKey } from "@/types/match.type";

/**
 * Official team match formats
 * Each returns the canonical order of ties with optional type
 */

// ✅ Swaythling Cup (best of 5 ties)
export const buildSwaythlingOrder = (): TeamTie[] => [
  { a: "A", b: "X", type: "singles" },
  { a: "B", b: "Y", type: "singles" },
  { a: "C", b: "Z", type: "singles" },
  { a: "A", b: "Y", type: "singles" },
  { a: "B", b: "X", type: "singles" },
];

// ✅ Extended Swaythling (best of 9 ties)
export const buildSwaythlingBestOf9Order = (): TeamTie[] => [
  { a: "A", b: "X", type: "singles" },
  { a: "B", b: "Y", type: "singles" },
  { a: "C", b: "Z", type: "singles" },
  { a: "B", b: "X", type: "singles" },
  { a: "A", b: "Z", type: "singles" },
  { a: "C", b: "Y", type: "singles" },
  { a: "B", b: "Z", type: "singles" },
  { a: "C", b: "X", type: "singles" },
  { a: "A", b: "Y", type: "singles" },
];

// ✅ Singles–Doubles–Singles (common in leagues)
export const buildSDSOrder = (): TeamTie[] => [
  { a: "A", b: "X", type: "singles" },
  { a: "B", b: "Y", type: "singles" },
  { a: "D", b: "D", type: "doubles" }, // "D" means doubles pair
  { a: "A", b: "Y", type: "singles" },
  { a: "B", b: "X", type: "singles" },
];

// ✅ Three singles format (shorter)
export const buildThreeSinglesOrder = (): TeamTie[] => [
  { a: "A", b: "X", type: "singles" },
  { a: "B", b: "Y", type: "singles" },
  { a: "C", b: "Z", type: "singles" },
];

/**
 * Central builder: chooses correct order depending on format
 */
export const buildTeamOrder = (
  format: TeamMatchFormat,
  options?: { customOrder?: TeamTie[] }
): TeamTie[] => {
  switch (format) {
    case "swaythling-5":
      return buildSwaythlingOrder();
    case "swaythling-9":
      return buildSwaythlingBestOf9Order();
    case "sds":
      return buildSDSOrder();
    case "three-singles":
      return buildThreeSinglesOrder();
    case "extended":
      if (options?.customOrder?.length) return options.customOrder;
      console.warn(
        "[team/helpers] Extended format requires customOrder, falling back to swaythling-5"
      );
      return buildSwaythlingOrder();
    default:
      console.warn(
        `[team/helpers] Unknown format "${format}", falling back to swaythling-5`
      );
      return buildSwaythlingOrder();
  }
};

/**
 * getTeamMatchWinner
 * Decides if sideA or sideB has already won the match given current wins
 */
export const getTeamMatchWinner = (
  sideAWins: number,
  sideBWins: number,
  bestOf: number
): SideKey | null => {
  const needed = Math.ceil(bestOf / 2);
  if (sideAWins >= needed) return "sideA";
  if (sideBWins >= needed) return "sideB";
  return null;
};
