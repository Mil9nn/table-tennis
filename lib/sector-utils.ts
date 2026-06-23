/**
 * Sector Utilities - Absolute vs Relative Classification
 * 
 * This module provides perspective-independent sector classification.
 * 
 * ABSOLUTE SECTORS represent fixed table locations (independent of viewing angle):
 * - "top":     Y 0-33.33     (where left-side players have backhand)
 * - "middle":  Y 33.33-66.67 (crossover/center zone)
 * - "bottom":  Y 66.67-100   (where left-side players have forehand)
 * 
 * RELATIVE SECTORS depend on which side of the table the receiving player is on:
 * - Side1 (top of table):    top→backhand, middle→crossover, bottom→forehand
 * - Side2 (bottom of table): top→forehand, middle→crossover, bottom→backhand
 */

import { Side } from "@/types/shot.type";

// Threshold constants
const THRESHOLDS = {
  SECTOR_BACKHAND: 33.33,   // Y < 33.33% = Top sector
  SECTOR_CROSSOVER: 66.67,  // Y 33.33-66.67% = Middle sector
} as const;

/**
 * Get ABSOLUTE sector based on landing Y coordinate
 * Returns the sector of the table (top, middle, bottom) regardless of viewing perspective
 * This should be used for all statistics and analysis to ensure consistency
 * 
 * @param landingY - Y coordinate where ball landed (0-100)
 * @returns Absolute sector location: "top" | "middle" | "bottom" | null
 */
export function getAbsoluteSector(
  landingY: number
): "top" | "middle" | "bottom" | null {
  if (landingY == null) return null;

  if (landingY < THRESHOLDS.SECTOR_BACKHAND) {
    return "top";
  } else if (landingY < THRESHOLDS.SECTOR_CROSSOVER) {
    return "middle";
  } else {
    return "bottom";
  }
}

/**
 * Get RELATIVE sector based on landing Y coordinate and receiving player side
 * Returns the sector relative to the receiving player's perspective
 * 
 * Example:
 * - Y=10 (absolute top sector) → "backhand" for side1, "forehand" for side2
 * - Y=50 (absolute middle sector) → "crossover" for both sides
 * 
 * This should be used ONLY for UI display and commentary, NOT for statistics
 * 
 * @param landingY - Y coordinate where ball landed (0-100)
 * @param receivingSide - Which side the receiving player is on ("side1", "side2", "team1", or "team2")
 * @param isLeftHanded - Whether receiving player is left-handed (optional, not yet implemented)
 * @returns Relative sector from player perspective: "backhand" | "crossover" | "forehand" | null
 */
export function getRelativeSector(
  landingY: number,
  receivingSide?: Side,
  isLeftHanded: boolean = false
): "backhand" | "crossover" | "forehand" | null {
  // Get the absolute sector first
  const absoluteSector = getAbsoluteSector(landingY);
  
  if (!absoluteSector) return null;

  // Middle sector is always crossover regardless of side
  if (absoluteSector === "middle") {
    return "crossover";
  }

  // Map absolute sectors to relative names based on receiving side
  const isSide2 = receivingSide === "side2" || receivingSide === "team2";

  if (absoluteSector === "top") {
    // Top of table: backhand for side1, forehand for side2
    return isSide2 ? "forehand" : "backhand";
  }

  if (absoluteSector === "bottom") {
    // Bottom of table: forehand for side1, backhand for side2
    return isSide2 ? "backhand" : "forehand";
  }

  return null;
}

/**
 * Convert absolute sector to descriptive string
 * Used for UI labels and user-facing text
 * 
 * @param absoluteSector - The absolute sector ("top" | "middle" | "bottom")
 * @returns Human-readable description
 */
export function formatAbsoluteSector(
  absoluteSector: "top" | "middle" | "bottom" | null
): string {
  if (!absoluteSector) return "";
  
  const sectorMap: Record<string, string> = {
    "top": "Top Sector",
    "middle": "Middle Sector",
    "bottom": "Bottom Sector",
  };
  
  return sectorMap[absoluteSector] || "";
}

/**
 * Convert relative sector to descriptive string
 * Used for UI labels and user-facing text
 * 
 * @param relativeSector - The relative sector ("backhand" | "crossover" | "forehand")
 * @returns Human-readable description with proper capitalization
 */
export function formatRelativeSector(
  relativeSector: "backhand" | "crossover" | "forehand" | null
): string {
  if (!relativeSector) return "";
  
  const sectorMap: Record<string, string> = {
    "forehand": "Forehand",
    "backhand": "Backhand",
    "crossover": "CrossOver",
  };
  
  return sectorMap[relativeSector] || "";
}

/**
 * Check if a sector is a "wing" (forehand or backhand) vs center
 * Useful for grouping statistics
 * 
 * @param absoluteSector - The absolute sector to check
 * @returns True if sector is top or bottom (wing), false if middle (center)
 */
export function isWingSector(
  absoluteSector: "top" | "middle" | "bottom" | null
): boolean {
  return absoluteSector === "top" || absoluteSector === "bottom";
}

/**
 * Check if a sector is center/crossover
 * 
 * @param absoluteSector - The absolute sector to check
 * @returns True if sector is middle (center), false otherwise
 */
export function isCenterSector(
  absoluteSector: "top" | "middle" | "bottom" | null
): boolean {
  return absoluteSector === "middle";
}
