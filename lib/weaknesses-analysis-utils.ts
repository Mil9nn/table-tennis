// lib/weaknesses-analysis-utils.ts

import {
  ShotWeaknessData,
  ZoneWeaknessData,
  ZoneCell,
  VulnerableZone,
  SafeZone,
  ServeWeaknessData,
  ReceiveWeaknessData,
  OpponentPattern,
  OverallInsights,
  WeaknessAnalysisResult,
  PointOutcome,
  ShotWithOutcome,
  ZoneSectorWeakness,
  LineWeakness,
  OriginDistanceWeakness,
  SemanticZoneAnalysis,
  DataLimitation,
} from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { analyzeShotPlacement, getZone, getSector } from "@/lib/shot-commentary-utils";
import { getAbsoluteSector, getRelativeSector } from "@/lib/sector-utils";

// Minimum sample sizes for statistical significance
const MIN_SHOT_ATTEMPTS = 1; // Minimum shots for shot weakness analysis
const MIN_ZONE_SHOTS = 1; // Minimum shots per zone for zone analysis
const MIN_SERVE_ATTEMPTS = 1; // Minimum serves for serve analysis
const MIN_RECEIVE_ATTEMPTS = 1; // Minimum receives for receive analysis

/**
 * Core algorithm: Determine point winners from shot sequences
 *
 * CRITICAL: Based on the data model, when a score increments, a shot MUST be provided.
 * This shot represents the winning shot of that point. However, the system may store
 * all shots in a rally, not just the winning shot.
 *
 * Strategy:
 * - Group shots by rally (points between score changes)
 * - The last shot before a score change is the winning shot
 * - For opponent pattern analysis, track opponent's last stroke in each rally
 */
export function determinePointOutcomes(game: any): PointOutcome[] {
  const outcomes: PointOutcome[] = [];
  
  // Validate game data
  if (!game) return outcomes;
  const shots = game.shots || [];
  if (shots.length === 0) return outcomes;

  // Get final scores to determine total points
  const finalSide1Score = game.side1Score ?? game.team1Score ?? 0;
  const finalSide2Score = game.side2Score ?? game.team2Score ?? 0;
  const totalPoints = finalSide1Score + finalSide2Score;

  // If we have fewer shots than points, it means only winning shots are stored
  // If we have more shots, it means all rally shots are stored
  const onlyWinningShotsStored = shots.length <= totalPoints;

  if (onlyWinningShotsStored) {
    // Simple case: Each shot = one point won by that shot's player
    // Note: We can't track opponent strokes or losing shots in this case
    shots.forEach((shot: any, index: number) => {
      const playerId = shot.player?._id?.toString() || shot.player?.toString();
      if (!playerId) return;
      
      // Since only winning shots are stored, this shot won the point
      outcomes.push({
        shotIndex: index,
        playerId,
        stroke: shot.stroke || null,
        landingX: shot.landingX ?? null,
        landingY: shot.landingY ?? null,
        server: shot.server?.toString() || null,
        won: true, // This player won the point
        opponentStroke: null, // Can't determine opponent stroke if only winning shots stored
      });
    });
  } else {
    // Complex case: All rally shots are stored, need to group by rally
    // Group shots by rally - a rally ends when the server changes (new point starts)
    let currentRallyShots: Array<{ shot: any; index: number }> = [];
    let previousServer: string | null = null;

    shots.forEach((shot: any, index: number) => {
      const currentServer = shot.server?.toString() || null;
      const serverChanged = previousServer !== null && currentServer !== previousServer;

      if (serverChanged && currentRallyShots.length > 0) {
        // Server changed = new point started, previous rally ended
        // Process the previous rally
        processRally(currentRallyShots, outcomes);
        currentRallyShots = [];
      }

      currentRallyShots.push({ shot, index });
      previousServer = currentServer;
    });

    // Process the last rally
    if (currentRallyShots.length > 0) {
      processRally(currentRallyShots, outcomes);
    }
  }

  return outcomes;
}

/**
 * Helper function to process a rally and determine outcomes
 */
function processRally(
  rallyShots: Array<{ shot: any; index: number }>,
  outcomes: PointOutcome[]
): void {
  if (rallyShots.length === 0) return;

  // The last shot in the rally is the winning shot
  const winningShot = rallyShots[rallyShots.length - 1];
  const winningSide = winningShot.shot.side;
  const winningPlayerId = winningShot.shot.player?._id?.toString() || winningShot.shot.player?.toString();

  // Get opponent's last stroke in this rally (for pattern analysis)
  const opponentShots = rallyShots
    .filter(({ shot }) => shot.side !== winningSide)
    .map(({ shot }) => shot.stroke)
    .filter(Boolean);
  const opponentStroke = opponentShots[opponentShots.length - 1] || null;

  // Process all shots in the rally
  rallyShots.forEach(({ shot, index }) => {
    const playerId = shot.player?._id?.toString() || shot.player?.toString();
    if (!playerId) return;

    const wonPoint = playerId === winningPlayerId;

    outcomes.push({
      shotIndex: index,
      playerId,
      stroke: shot.stroke || null,
      landingX: shot.landingX ?? null,
      landingY: shot.landingY ?? null,
      server: shot.server?.toString() || null,
      won: wonPoint,
      opponentStroke: wonPoint ? opponentStroke : null, // Only track opponent stroke for winning shots
    });
  });
}

/**
 * Calculate shot weaknesses for a specific user
 * 
 * NOTE: When only winning shots are stored (most common case), all outcomes have won: true.
 * In this case, for user shots (outcome.playerId === userId), outcome.won will always be true,
 * so stats.losses will always be 0. The outcome.won check is still needed for rally data scenarios.
 */
export function calculateShotWeaknesses(
  allGames: any[],
  userId: string
): ShotWeaknessData[] {
  const strokeStats: Record<
    string,
    {
      attempts: number;
      wins: number;
      losses: number;
      landingXSum: number;
      landingYSum: number;
      landingCount: number;
    }
  > = {};

  // Process all games
  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);

    outcomes.forEach((outcome) => {
      // Only process user's shots
      if (outcome.playerId !== userId || !outcome.stroke) return;

      if (!strokeStats[outcome.stroke]) {
        strokeStats[outcome.stroke] = {
          attempts: 0,
          wins: 0,
          losses: 0,
          landingXSum: 0,
          landingYSum: 0,
          landingCount: 0,
        };
      }

      const stats = strokeStats[outcome.stroke];
      stats.attempts++;

      // When only winning shots are stored, outcome.won is always true for user shots.
      // When rally data exists, outcome.won can be false if user lost the point.
      if (outcome.won) {
        stats.wins++;
      } else {
        stats.losses++;
      }

      if (outcome.landingX != null && outcome.landingY != null) {
        stats.landingXSum += outcome.landingX;
        stats.landingYSum += outcome.landingY;
        stats.landingCount++;
      }
    });
  });

  // Convert to ShotWeaknessData array, filter by minimum sample size
  const weaknesses: ShotWeaknessData[] = Object.entries(strokeStats)
    .filter(([_, stats]) => stats.attempts >= MIN_SHOT_ATTEMPTS) // Only include shots with sufficient data
    .map(([stroke, stats]) => {
      const winRate = stats.attempts > 0 ? (stats.wins / stats.attempts) * 100 : 0;
      const lossRate = 100 - winRate;

      const avgLandingZone =
        stats.landingCount > 0
          ? {
              x: Math.round(stats.landingXSum / stats.landingCount),
              y: Math.round(stats.landingYSum / stats.landingCount),
            }
          : null;

      const recommendation = generateShotRecommendation(stroke, winRate, stats.attempts);

      return {
        stroke,
        totalAttempts: stats.attempts,
        pointsWon: stats.wins,
        pointsLost: stats.losses,
        winRate: Math.round(winRate * 10) / 10,
        lossRate: Math.round(lossRate * 10) / 10,
        avgLandingZone,
        recommendation,
      };
    });

  return weaknesses.sort((a, b) => a.winRate - b.winRate); // Sort by win rate ascending (weakest first)
}

/**
 * Calculate zone-based weaknesses with fine-grained grid aligned to zone-sector boundaries
 * 
 * Grid structure: 20 columns × 9 rows = 180 cells
 * - X-axis: 20 columns (5% width each) aligns with zone boundaries:
 *   - Columns 0-4 (0-25%): Left Deep
 *   - Columns 5-7 (25-40%): Left Mid
 *   - Columns 8-9 (40-50%): Left Short
 *   - Columns 10-11 (50-60%): Right Short
 *   - Columns 12-14 (60-75%): Right Mid
 *   - Columns 15-19 (75-100%): Right Deep
 * 
 * - Y-axis: 9 rows (~11.11% height each) aligns with sector boundaries:
 *   - Rows 0-2 (0-33.33%): Top/Backhand
 *   - Rows 3-5 (33.33-66.67%): Middle/Crossover
 *   - Rows 6-8 (66.67-100%): Bottom/Forehand
 * 
 * Uses determinePointOutcomes to correctly handle both cases:
 * - If only winning shots are stored: each shot = one point
 * - If all rally shots are stored: need to determine which shots won points
 * 
 * NOTE: totalShots represents total points (winning shots only), not total shot attempts.
 * The function only processes outcomes where outcome.won === true.
 */
export function calculateZoneWeaknesses(
  allGames: any[],
  userId: string
): ZoneWeaknessData {
  // Initialize 20x9 grid (180 cells)
  const GRID_COLS = 20;
  const GRID_ROWS = 9;
  
  const grid: Record<
    string,
    {
      x: number;
      y: number;
      totalShots: number;
      wins: number;
      losses: number;
      strokes: Record<string, number>;
    }
  > = {};

  // Process all games using determinePointOutcomes for consistency
  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);
    
    outcomes.forEach((outcome) => {
      // Only count shots that won points (won = true) for zone analysis
      // This ensures we're tracking where points were actually won/lost
      if (!outcome.won) return; // Skip losing shots in rally
      if (outcome.landingX == null || outcome.landingY == null) return;

      // Map landing position to grid cell (aligned with zone-sector boundaries)
      // X: 20 columns, 5% width each
      const zoneX = Math.min(GRID_COLS - 1, Math.floor(outcome.landingX / 5));
      // Y: 9 rows, ~11.11% height each
      const zoneY = Math.min(GRID_ROWS - 1, Math.floor(outcome.landingY / (100 / GRID_ROWS)));
      const zoneKey = `${zoneX},${zoneY}`;

      if (!grid[zoneKey]) {
        grid[zoneKey] = {
          x: zoneX,
          y: zoneY,
          totalShots: 0,
          wins: 0,
          losses: 0,
          strokes: {},
        };
      }

      const zone = grid[zoneKey];
      zone.totalShots++;

      // Track if user won or lost the point in this zone
      if (outcome.playerId === userId) {
        zone.wins++;
      } else {
        zone.losses++;
      }

      if (outcome.stroke) {
        zone.strokes[outcome.stroke] = (zone.strokes[outcome.stroke] || 0) + 1;
      }
    });
  });

  // Convert to 2D array and calculate vulnerability
  const heatmapGrid: ZoneCell[][] = [];
  const allWinRates: number[] = [];

  for (let y = 0; y < GRID_ROWS; y++) {
    const row: ZoneCell[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      const zoneKey = `${x},${y}`;
      const zoneData = grid[zoneKey];

      if (zoneData && zoneData.totalShots > 0) {
        const winRate = (zoneData.wins / zoneData.totalShots) * 100;
        allWinRates.push(winRate);

        const dominantStroke =
          Object.entries(zoneData.strokes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        row.push({
          x,
          y,
          totalShots: zoneData.totalShots,
          wins: zoneData.wins,
          losses: zoneData.losses,
          winRate: Math.round(winRate * 10) / 10,
          dominantStroke,
          vulnerability: "medium", // Will be calculated below
        });
      } else {
        row.push({
          x,
          y,
          totalShots: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          dominantStroke: null,
          vulnerability: "low",
        });
      }
    }
    heatmapGrid.push(row);
  }

  // Calculate vulnerability classification
  if (allWinRates.length > 0) {
    const avgWinRate = allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length;
    const variance =
      allWinRates.reduce((sum, rate) => sum + Math.pow(rate - avgWinRate, 2), 0) /
      allWinRates.length;
    const stdDev = Math.sqrt(variance);

    heatmapGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.totalShots > 0) {
          // Only calculate vulnerability if we have minimum sample size
          if (cell.totalShots >= MIN_ZONE_SHOTS) {
            if (cell.winRate < avgWinRate - stdDev / 2) {
              cell.vulnerability = "high";
            } else if (cell.winRate > avgWinRate + stdDev / 2) {
              cell.vulnerability = "low";
            } else {
              cell.vulnerability = "medium";
            }
          } else {
            // Insufficient data - mark as medium (neutral) to avoid false positives
            cell.vulnerability = "medium";
          }
        }
      });
    });
  }

  // Identify top vulnerable and safe zones (only include zones with sufficient data)
  const flatZones = heatmapGrid.flat().filter((z) => z.totalShots >= MIN_ZONE_SHOTS);
  const vulnerableZones: VulnerableZone[] = flatZones
    .filter((z) => z.vulnerability === "high")
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3)
    .map((z) => ({
      zone: getZoneDescription(z.x, z.y),
      lossRate: Math.round((100 - z.winRate) * 10) / 10,
      totalPoints: z.totalShots,
      dominantOpponentShot: null, // Would need opponent analysis
      recommendation: `Practice defending ${getZoneDescription(z.x, z.y)} - currently ${Math.round(100 - z.winRate)}% loss rate`,
    }));

  const safeZones: SafeZone[] = flatZones
    .filter((z) => z.vulnerability === "low")
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3)
    .map((z) => ({
      zone: getZoneDescription(z.x, z.y),
      winRate: z.winRate,
      totalPoints: z.totalShots,
      dominantStroke: z.dominantStroke,
    }));

  return {
    heatmapGrid,
    vulnerableZones,
    safeZones,
  };
}

/**
 * Analyze serve and receive weaknesses
 * 
 * CRITICAL: This function counts ALL points when user was serving/receiving (won + lost),
 * not just points the user won. This is necessary because only winning shots are stored.
 * 
 * - Points when serving: outcome.server === userId
 *   - Won: outcome.playerId === userId && outcome.won === true
 *   - Lost: outcome.playerId !== userId && outcome.won === true (opponent won)
 * 
 * - Points when receiving: outcome.server !== userId && outcome.server !== null
 *   - Won: outcome.playerId === userId && outcome.won === true
 *   - Lost: outcome.playerId !== userId && outcome.won === true (opponent won)
 */
export function analyzeServeReceivePatterns(
  allGames: any[],
  userId: string
): { serve: ServeWeaknessData; receive: ReceiveWeaknessData } {
  let totalServes = 0;
  let servesWon = 0;
  let totalReceives = 0;
  let receivesWon = 0;
  const receiveVsStroke: Record<string, { received: number; won: number }> = {};

  const userIdStr = userId.toString();

  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);

    outcomes.forEach((outcome) => {
      // Skip if no server info
      if (!outcome.server) return;

      const serverId = outcome.server.toString();
      const playerId = outcome.playerId?.toString();
      
      // Determine if user was serving or receiving
      const userWasServing = serverId === userIdStr;
      const userWon = playerId === userIdStr && outcome.won;

      if (userWasServing) {
        // User was serving - count ALL points (won + lost)
        totalServes++;
        if (userWon) {
          servesWon++;
        }
        // servesLost = totalServes - servesWon (calculated later)
      } else {
        // User was receiving - count ALL points (won + lost)
        totalReceives++;
        if (userWon) {
          receivesWon++;
        }
        // receivesLost = totalReceives - receivesWon (calculated later)

        // Track opponent serve types when user was receiving
        // Note: We can only track when user won (we can't see opponent's serve type when they won)
        if (outcome.opponentStroke && userWon) {
          if (!receiveVsStroke[outcome.opponentStroke]) {
            receiveVsStroke[outcome.opponentStroke] = { received: 0, won: 0 };
          }
          receiveVsStroke[outcome.opponentStroke].received++;
          receiveVsStroke[outcome.opponentStroke].won++;
        }
      }
    });
  });

  // Only calculate rates if we have minimum sample size
  const serveWinRate = totalServes >= MIN_SERVE_ATTEMPTS 
    ? (servesWon / totalServes) * 100 
    : 0;
  const receiveWinRate = totalReceives >= MIN_RECEIVE_ATTEMPTS
    ? (receivesWon / totalReceives) * 100
    : 0;

  const vsStrokeType: Record<string, { received: number; won: number; winRate: number }> = {};
  Object.entries(receiveVsStroke).forEach(([stroke, stats]) => {
    // Only include stroke types with sufficient data
    if (stats.received >= MIN_RECEIVE_ATTEMPTS) {
      vsStrokeType[stroke] = {
        ...stats,
        winRate: stats.received > 0 ? (stats.won / stats.received) * 100 : 0,
      };
    }
  });

  const servesLost = totalServes - servesWon;
  const receivesLost = totalReceives - receivesWon;

  // Create data limitation info
  const serveDataLimitation: DataLimitation = {
    message: "Analysis based on point outcomes when serving, not serve success rates",
    limitations: [
      "Only winning shots are recorded, so we can't calculate actual serve success rates",
      "We show point win rates when serving, which includes both serve winners and rally outcomes",
      "Lost serves that resulted in opponent winning the point are counted"
    ],
    availableMetrics: [
      "Points won when serving",
      "Points lost when serving",
      "Point win rate when serving"
    ]
  };

  const receiveDataLimitation: DataLimitation = {
    message: "Analysis based on point outcomes when receiving, not receive success rates",
    limitations: [
      "Only winning shots are recorded, so we can't calculate actual receive success rates",
      "We show point win rates when receiving, which includes both return winners and rally outcomes",
      "Lost receives that resulted in opponent winning the point are counted",
      "Opponent serve types are only visible when user won the point"
    ],
    availableMetrics: [
      "Points won when receiving",
      "Points lost when receiving",
      "Point win rate when receiving",
      "Success rate vs different serve types (when user won)"
    ]
  };

  return {
    serve: {
      // Legacy fields for backward compatibility
      totalServes,
      servesWon,
      servesLost,
      serveWinRate: Math.round(serveWinRate * 10) / 10,
      // New fields for clarity
      totalPointsWhenServing: totalServes,
      pointsWonWhenServing: servesWon,
      pointsLostWhenServing: servesLost,
      pointWinRateWhenServing: Math.round(serveWinRate * 10) / 10,
      patternAnalysis: {}, // Could be enhanced with serve type analysis
      recommendation: totalServes >= MIN_SERVE_ATTEMPTS
        ? generateServeRecommendation(serveWinRate, totalServes)
        : "Need more serve data for analysis",
      dataLimitation: serveDataLimitation,
    },
    receive: {
      // Legacy fields for backward compatibility
      totalReceives,
      receivesWon,
      receivesLost,
      receiveWinRate: Math.round(receiveWinRate * 10) / 10,
      // New fields for clarity
      totalPointsWhenReceiving: totalReceives,
      pointsWonWhenReceiving: receivesWon,
      pointsLostWhenReceiving: receivesLost,
      pointWinRateWhenReceiving: Math.round(receiveWinRate * 10) / 10,
      vsStrokeType,
      recommendation: totalReceives >= MIN_RECEIVE_ATTEMPTS
        ? generateReceiveRecommendation(receiveWinRate, totalReceives, vsStrokeType)
        : "Need more receive data for analysis",
      dataLimitation: receiveDataLimitation,
    },
  };
}

/**
 * Analyze opponent patterns (what opponents do to win)
 * 
 * IMPORTANT: Since only winning shots are stored, this analysis shows:
 * - What strokes opponents used when they WON points (not their overall patterns)
 * - What zones opponents targeted when they WON points
 * - The percentage of opponent's total points won that came from each stroke
 * 
 * This does NOT show:
 * - Opponent strokes that lost points (we don't have that data)
 * - Opponent's overall stroke usage rates
 * - Opponent's success rates with different strokes
 * 
 * The "effectivenessRate" represents what % of opponent's total points came from this stroke,
 * not the success rate of that stroke.
 */
export function analyzeOpponentPatterns(
  allGames: any[],
  userId: string
): OpponentPattern[] {
  const opponentStrokes: Record<
    string,
    { timesUsed: number; pointsWonByOpponent: number; zones: string[] }
  > = {};

  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);

    outcomes.forEach((outcome) => {
      // Track what opponents did when they WON points (user lost)
      // If opponentStroke is available, use it (means all rally shots were stored)
      // Otherwise, if the outcome is from opponent winning, track their stroke directly
      if (outcome.opponentStroke) {
        // Case: All rally shots stored, opponentStroke was captured
        if (outcome.playerId === userId && !outcome.won) {
          const stroke = outcome.opponentStroke;
          if (!opponentStrokes[stroke]) {
            opponentStrokes[stroke] = { timesUsed: 0, pointsWonByOpponent: 0, zones: [] };
          }
          opponentStrokes[stroke].timesUsed++;
          opponentStrokes[stroke].pointsWonByOpponent++;

        if (outcome.landingX != null && outcome.landingY != null) {
          const zoneX = Math.min(19, Math.floor(outcome.landingX / 5));
          const zoneY = Math.min(8, Math.floor(outcome.landingY / (100 / 9)));
          opponentStrokes[stroke].zones.push(getZoneDescription(zoneX, zoneY));
        }
      }
    } else if (outcome.won && outcome.playerId !== userId && outcome.stroke) {
      // Case: Only winning shots stored - opponent won, track their winning stroke
      const stroke = outcome.stroke;
      if (!opponentStrokes[stroke]) {
        opponentStrokes[stroke] = { timesUsed: 0, pointsWonByOpponent: 0, zones: [] };
      }
      opponentStrokes[stroke].timesUsed++;
      opponentStrokes[stroke].pointsWonByOpponent++;

      if (outcome.landingX != null && outcome.landingY != null) {
        const zoneX = Math.min(19, Math.floor(outcome.landingX / 5));
        const zoneY = Math.min(8, Math.floor(outcome.landingY / (100 / 9)));
        opponentStrokes[stroke].zones.push(getZoneDescription(zoneX, zoneY));
      }
    }
    });
  });

  // Calculate total points opponent won (for context)
  let totalOpponentPoints = 0;
  Object.values(opponentStrokes).forEach(stats => {
    totalOpponentPoints += stats.pointsWonByOpponent;
  });

  const patterns: OpponentPattern[] = Object.entries(opponentStrokes)
    .map(([stroke, stats]) => {
      // Since only winning shots are stored, we can't calculate true "success rate"
      // Instead, show what % of opponent's points came from this stroke
      const pointShareRate = totalOpponentPoints > 0 
        ? (stats.pointsWonByOpponent / totalOpponentPoints) * 100 
        : 0;

      // Get common zones (most frequent)
      const zoneCounts: Record<string, number> = {};
      stats.zones.forEach((zone) => {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      });
      const commonZones = Object.entries(zoneCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map((e) => e[0]);

      return {
        stroke,
        count: stats.timesUsed, // Since only winning shots are stored, this = points won
        effectivenessRate: Math.round(pointShareRate * 10) / 10, // % of opponent's points from this stroke
        commonZones,
        recommendation: `Opponent won ${stats.pointsWonByOpponent} points with ${formatStrokeName(stroke)} (${Math.round(pointShareRate)}% of their total)`,
      };
    })
    .filter((p) => p.count > 0) // Include all patterns with data
    .sort((a, b) => b.effectivenessRate - a.effectivenessRate)
    .slice(0, 5); // Top 5

  return patterns;
}

/**
 * Generate overall insights and improvement priorities
 */
export function generateOverallInsights(
  shotWeaknesses: ShotWeaknessData[],
  zoneWeaknesses: ZoneWeaknessData,
  serveReceive: { serve: ServeWeaknessData; receive: ReceiveWeaknessData },
  opponentPatterns: OpponentPattern[],
  semanticZones: SemanticZoneAnalysis // NEW: Semantic zone analysis
): OverallInsights {
  // Find primary weakness
  const criticalShotWeaknesses = shotWeaknesses.filter(
    (s) => s.winRate < 40 && s.totalAttempts >= 10
  );
  const primaryShotWeakness = criticalShotWeaknesses[0];

  const criticalZoneWeakness = zoneWeaknesses.vulnerableZones[0];

  let primaryWeakness = "No critical weaknesses identified";
  if (primaryShotWeakness) {
    primaryWeakness = `${formatStrokeName(primaryShotWeakness.stroke)} (${primaryShotWeakness.winRate}% win rate)`;
  } else if (criticalZoneWeakness) {
    primaryWeakness = `${criticalZoneWeakness.zone} defense`;
  } else if (serveReceive.receive.receiveWinRate < 45) {
    primaryWeakness = "Receiving serves";
  }

  // Find secondary weakness
  let secondaryWeakness: string | null = null;
  if (criticalShotWeaknesses[1]) {
    secondaryWeakness = `${formatStrokeName(criticalShotWeaknesses[1].stroke)} (${criticalShotWeaknesses[1].winRate}% win rate)`;
  } else if (zoneWeaknesses.vulnerableZones[1]) {
    secondaryWeakness = `${zoneWeaknesses.vulnerableZones[1].zone} defense`;
  }

  // Find strength
  const strongShots = shotWeaknesses.filter((s) => s.winRate > 60 && s.totalAttempts > 0);
  const strengthToMaintain = strongShots[strongShots.length - 1] // Strongest shot
    ? `${formatStrokeName(strongShots[strongShots.length - 1].stroke)} (${strongShots[strongShots.length - 1].winRate}% win rate)`
    : "Consistent performance";

  // Generate improvement priorities
  const improvementPriority: string[] = [];

  if (primaryShotWeakness) {
    improvementPriority.push(primaryShotWeakness.recommendation);
  }

  if (criticalZoneWeakness) {
    improvementPriority.push(criticalZoneWeakness.recommendation);
  }

  if (serveReceive.serve.serveWinRate < 50) {
    improvementPriority.push(serveReceive.serve.recommendation);
  }

  if (serveReceive.receive.receiveWinRate < 50) {
    improvementPriority.push(serveReceive.receive.recommendation);
  }

  if (opponentPatterns[0]) {
    improvementPriority.push(
      `Counter opponent's ${formatStrokeName(opponentPatterns[0].stroke)} attacks`
    );
  }

  // NEW: Add semantic zone weaknesses to improvement priorities
  if (semanticZones.topVulnerableZoneSectors[0]) {
    const topZoneSector = semanticZones.topVulnerableZoneSectors[0];
    improvementPriority.push(
      `Defend ${topZoneSector.zone} ${topZoneSector.sector} zone (${topZoneSector.winRate.toFixed(0)}% win rate)`
    );
  }

  // Check for line weaknesses
  const vulnerableLine = semanticZones.lineWeaknesses
    .filter(l => l.totalShots > 0)
    .sort((a, b) => a.winRate - b.winRate)[0];

  if (vulnerableLine && vulnerableLine.winRate < 45) {
    improvementPriority.push(vulnerableLine.recommendation);
  }

  // Check for distance weaknesses
  const vulnerableDistance = semanticZones.originDistanceWeaknesses
    .filter(d => d.totalShots > 0)
    .sort((a, b) => a.winRate - b.winRate)[0];

  if (vulnerableDistance && vulnerableDistance.winRate < 45) {
    improvementPriority.push(vulnerableDistance.recommendation);
  }

  // Limit to top 5 priorities
  return {
    primaryWeakness,
    secondaryWeakness,
    strengthToMaintain,
    improvementPriority: improvementPriority.slice(0, 5),
  };
}

/**
 * Calculate zone-sector weaknesses using semantic zones from shot-commentary-utils
 * Analyzes 9 combinations: 3 zones (short/mid/deep) × 3 sectors (backhand/crossover/forehand)
 * 
 * NOTE: This function processes ALL shots (both user and opponent winning shots).
 * Since only winning shots are recorded:
 * - If shot.player === userId: user won the point (counted as win)
 * - If shot.player !== userId: opponent won the point (counted as loss for user)
 * totalShots represents total points (winning shots), not total shot attempts.
 */
export function calculateZoneSectorWeaknesses(
  allGames: any[],
  userId: string,
  userSide?: "side1" | "side2" | "team1" | "team2"
): ZoneSectorWeakness[] {
  // Determine user's side from shots if not provided
  let side = userSide;
  if (!side && allGames.length > 0) {
    // Find first shot from user to determine which side they were on
    for (const game of allGames) {
      const userShot = (game.shots || []).find((shot: any) => {
        const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString() || shot.player;
        return shotPlayerId === userId.toString();
      });
      if (userShot && userShot.side) {
        side = userShot.side;
        break;
      }
    }
  }

  // Track stats for each zone-sector combination
  const zoneSectorStats: Record<
    string, // key: "zone-sector"
    {
      totalShots: number;
      wins: number;
      losses: number;
      strokes: Record<string, number>;
    }
  > = {};

  // Initialize all 9 combinations
  const zones: Array<"short" | "mid" | "deep"> = ["short", "mid", "deep"];
  // RELATIVE SECTORS (based on user's perspective)
  const sectors: Array<"backhand" | "crossover" | "forehand"> = ["backhand", "crossover", "forehand"];

  zones.forEach(zone => {
    sectors.forEach(sector => {
      const key = `${zone}-${sector}`;
      zoneSectorStats[key] = { totalShots: 0, wins: 0, losses: 0, strokes: {} };
    });
  });

  // Process all games
  // Since only winning shots are recorded:
  // - If shot.player === userId: user won the point (win)
  // - If shot.player !== userId: opponent won the point (loss for user)
  const userIdStr = userId.toString();
  allGames.forEach((game) => {
    const shots = game.shots || [];
    
    shots.forEach((shot: any) => {
      const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString() || shot.player;
      if (!shotPlayerId) return;
      if (shot.landingX == null || shot.landingY == null) return;

      // Use getZone and getRelativeSector (user's perspective)
      const zone = getZone(shot.landingX);
      const sector = getRelativeSector(shot.landingY, side);

      if (!zone || !sector) return; // Skip if null

      const key = `${zone}-${sector}`;
      const stats = zoneSectorStats[key];

      stats.totalShots++;
      
      // If shot is from user, they won the point. If from opponent, user lost the point.
      // Compare as strings to handle ObjectId and string comparisons
      if (shotPlayerId.toString() === userIdStr) {
        stats.wins++;
      } else {
        stats.losses++;
      }

      if (shot.stroke) {
        stats.strokes[shot.stroke] = (stats.strokes[shot.stroke] || 0) + 1;
      }
    });
  });

  // Calculate win rates and vulnerability
  const allWinRates: number[] = [];
  Object.values(zoneSectorStats).forEach(stats => {
    if (stats.totalShots > 0) {
      const winRate = (stats.wins / stats.totalShots) * 100;
      allWinRates.push(winRate);
    }
  });

  const avgWinRate = allWinRates.length > 0
    ? allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length
    : 50;
  const variance = allWinRates.length > 0
    ? allWinRates.reduce((sum, rate) => sum + Math.pow(rate - avgWinRate, 2), 0) / allWinRates.length
    : 0;
  const stdDev = Math.sqrt(variance);

  // Convert to ZoneSectorWeakness array
  const weaknesses: ZoneSectorWeakness[] = [];

  zones.forEach(zone => {
    sectors.forEach(sector => {
      const key = `${zone}-${sector}`;
      const stats = zoneSectorStats[key];
      const winRate = stats.totalShots > 0 ? (stats.wins / stats.totalShots) * 100 : 0;

      // Determine vulnerability
      let vulnerability: "high" | "medium" | "low" = "medium";
      if (stats.totalShots > 0) {
        if (winRate < avgWinRate - stdDev / 2) {
          vulnerability = "high";
        } else if (winRate > avgWinRate + stdDev / 2) {
          vulnerability = "low";
        }
      }

      // Get dominant stroke
      const dominantStroke = stats.totalShots > 0
        ? Object.entries(stats.strokes).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        : null;

      // Generate recommendation with proper zone-sector naming
      // Sector is already relative (backhand, crossover, forehand)
      
      // Format zone name (capitalize first letter)
      const formattedZone = zone === "mid" ? "Mid" : zone.charAt(0).toUpperCase() + zone.slice(1);
      
      // Format sector name (capitalize first letter)
      const formattedSector = sector === "crossover" 
        ? "Crossover" 
        : sector.charAt(0).toUpperCase() + sector.slice(1);
      
      const zoneSectorName = `${formattedZone} ${formattedSector}`;
      let recommendation = "";
      if (vulnerability === "high") {
        recommendation = `${zoneSectorName} zone is vulnerable (${winRate.toFixed(0)}% win rate). Practice defending this area.`;
      } else if (vulnerability === "low") {
        recommendation = `${zoneSectorName} zone is a strength (${winRate.toFixed(0)}% win rate). Use this advantage.`;
      } else {
        recommendation = `${zoneSectorName} zone performance is average (${winRate.toFixed(0)}% win rate). Maintain consistency.`;
      }

      weaknesses.push({
        zone,
        sector,
        totalShots: stats.totalShots,
        wins: stats.wins,
        losses: stats.losses,
        winRate: Math.round(winRate * 10) / 10,
        dominantStroke,
        vulnerability,
        recommendation,
      });
    });
  });

  return weaknesses;
}

/**
 * Calculate line-of-play weaknesses
 * Analyzes 4 line types: down the line, diagonal, cross court, middle line
 * 
 * NOTE: When only winning shots are stored, all outcomes have won: true.
 * For user shots, outcome.won will always be true (so losses will be 0).
 * For opponent shots, outcome.won will always be true (so opponentWins should equal opponentTotal).
 * The outcome.won checks are still needed for rally data scenarios.
 */
export function calculateLineWeaknesses(
  allGames: any[],
  userId: string
): LineWeakness[] {
  const lineStats: Record<
    string, // line type
    {
      totalShots: number;
      wins: number;
      losses: number;
      opponentTotal: number; // times opponent used this line against user
      opponentWins: number; // times opponent won using this line
    }
  > = {
    "down the line": { totalShots: 0, wins: 0, losses: 0, opponentTotal: 0, opponentWins: 0 },
    "diagonal": { totalShots: 0, wins: 0, losses: 0, opponentTotal: 0, opponentWins: 0 },
    "cross court": { totalShots: 0, wins: 0, losses: 0, opponentTotal: 0, opponentWins: 0 },
    "middle line": { totalShots: 0, wins: 0, losses: 0, opponentTotal: 0, opponentWins: 0 },
  };

  // Process all games
  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);

    outcomes.forEach((outcome) => {
      // Skip if missing data
      if (!outcome.stroke) return;

      // Build shot object - need origin and landing for line analysis
      // Try to get side from the original shot in the game
      const originalShot = game.shots?.[outcome.shotIndex];
      const shotSide = originalShot?.side || null;
      
      const shot: any = {
        landingX: outcome.landingX || 50,
        landingY: outcome.landingY || 50,
        originX: null, // Would need from previous shot
        originY: null,
        side: shotSide,
      };

      // Determine receiving side - handle both individual (side1/side2) and team (team1/team2) matches
      let receivingSide: "side1" | "side2" | "team1" | "team2";
      if (shotSide === "side1" || shotSide === "team1") {
        receivingSide = shotSide === "side1" ? "side2" : "team2";
      } else if (shotSide === "side2" || shotSide === "team2") {
        receivingSide = shotSide === "side2" ? "side1" : "team1";
      } else {
        // Fallback: default to side2 for individual matches
        receivingSide = "side2";
      }
      const placement = analyzeShotPlacement(shot, receivingSide);

      if (!placement.line) return;

      if (outcome.playerId === userId) {
        // User's shot
        // When only winning shots are stored, outcome.won is always true for user shots.
        // When rally data exists, outcome.won can be false if user lost the point.
        const stats = lineStats[placement.line];
        stats.totalShots++;
        if (outcome.won) stats.wins++;
        else stats.losses++;
      } else {
        // Opponent's shot against user
        // When only winning shots are stored, outcome.won is always true for opponent shots.
        // When rally data exists, outcome.won is false if opponent lost (user won).
        const stats = lineStats[placement.line];
        stats.opponentTotal++;
        if (outcome.won) stats.opponentWins++; // Opponent won the point
      }
    });
  });

  // Convert to LineWeakness array
  const weaknesses: LineWeakness[] = Object.entries(lineStats).map(([line, stats]) => {
    const winRate = stats.totalShots > 0 ? (stats.wins / stats.totalShots) * 100 : 0;
    const averageOpponentWinRate = stats.opponentTotal > 0
      ? (stats.opponentWins / stats.opponentTotal) * 100
      : 0;

    let recommendation = "";
    if (winRate < 45) {
      recommendation = `Your ${line} shots are weak (${winRate.toFixed(0)}% win rate). Work on accuracy and placement.`;
    } else if (averageOpponentWinRate > 60 && stats.opponentTotal > 0) {
      recommendation = `Opponents exploit ${line} shots against you (${averageOpponentWinRate.toFixed(0)}% success). Improve positioning and anticipation.`;
    } else if (winRate > 60) {
      recommendation = `Your ${line} shots are effective (${winRate.toFixed(0)}% win rate). Use them strategically.`;
    } else {
      recommendation = `Your ${line} performance is solid (${winRate.toFixed(0)}% win rate). Maintain consistency.`;
    }

    return {
      line: line as "down the line" | "diagonal" | "cross court" | "middle line",
      totalShots: stats.totalShots,
      wins: stats.wins,
      losses: stats.losses,
      winRate: Math.round(winRate * 10) / 10,
      averageOpponentWinRate: Math.round(averageOpponentWinRate * 10) / 10,
      recommendation,
    };
  });

  return weaknesses;
}

/**
 * Calculate origin distance weaknesses
 * Analyzes 4 categories: on-table, close-to-table, mid-distance, far-distance
 * 
 * NOTE: This function processes ALL shots (both user and opponent winning shots).
 * Since only winning shots are recorded:
 * - If shot.player === userId: user won the point (counted as win)
 * - If shot.player !== userId: opponent won the point (counted as loss for user)
 * totalShots represents total points (winning shots), not total shot attempts.
 */
export function calculateOriginDistanceWeaknesses(
  allGames: any[],
  userId: string
): OriginDistanceWeakness[] {
  const distanceStats: Record<
    string, // origin zone
    {
      totalShots: number;
      wins: number;
      losses: number;
      strokes: Record<string, number>;
    }
  > = {
    "on-table": { totalShots: 0, wins: 0, losses: 0, strokes: {} },
    "close-to-table": { totalShots: 0, wins: 0, losses: 0, strokes: {} },
    "mid-distance": { totalShots: 0, wins: 0, losses: 0, strokes: {} },
    "far-distance": { totalShots: 0, wins: 0, losses: 0, strokes: {} },
  };

  // Process all games
  // Since only winning shots are recorded:
  // - If shot.player === userId: user won the point (win)
  // - If shot.player !== userId: opponent won the point (loss for user)
  allGames.forEach((game) => {
    const shots = game.shots || [];
    
    shots.forEach((shot: any) => {
      const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
      if (!shotPlayerId) return;
      
      // Need origin coordinates to determine distance from table
      if (shot.originX == null || shot.originY == null || shot.landingX == null || shot.landingY == null) {
        return; // Skip if missing coordinate data
      }

      const shotForAnalysis: any = {
        landingX: shot.landingX,
        landingY: shot.landingY,
        originX: shot.originX,
        originY: shot.originY,
        side: shot.side,
      };

      // Determine receiving side based on shot side - handle both individual and team matches
      let receivingSide: "side1" | "side2" | "team1" | "team2";
      if (shot.side === "side1" || shot.side === "team1") {
        receivingSide = shot.side === "side1" ? "side2" : "team2";
      } else if (shot.side === "side2" || shot.side === "team2") {
        receivingSide = shot.side === "side2" ? "side1" : "team1";
      } else {
        // Fallback: default to side2 for individual matches
        receivingSide = "side2";
      }
      const placement = analyzeShotPlacement(shotForAnalysis, receivingSide);

      // If originZone is null, categorize as "on-table"
      const originZone = placement.originZone || "on-table";
      const stats = distanceStats[originZone];

      stats.totalShots++;
      
      // If shot is from user, they won the point. If from opponent, user lost the point.
      if (shotPlayerId === userId) {
        stats.wins++;
      } else {
        stats.losses++;
      }

      if (shot.stroke) {
        stats.strokes[shot.stroke] = (stats.strokes[shot.stroke] || 0) + 1;
      }
    });
  });

  // Convert to OriginDistanceWeakness array
  const weaknesses: OriginDistanceWeakness[] = Object.entries(distanceStats).map(([originZone, stats]) => {
    const winRate = stats.totalShots > 0 ? (stats.wins / stats.totalShots) * 100 : 0;

    // Get top 3 common strokes
    const commonStrokes = Object.entries(stats.strokes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([stroke, count]) => ({ stroke, count }));

    let recommendation = "";
    const zoneName = originZone.replace("-", " ");
    if (winRate < 45) {
      const topStroke = commonStrokes[0]?.stroke || "shots";
      recommendation = `Your ${zoneName} game is weak (${winRate.toFixed(0)}% win rate). Primary stroke: ${formatStrokeName(topStroke)} - work on consistency from this position.`;
    } else if (winRate > 60) {
      recommendation = `Your ${zoneName} performance is strong (${winRate.toFixed(0)}% win rate). Maintain positioning advantage.`;
    } else {
      recommendation = `Your ${zoneName} play is solid (${winRate.toFixed(0)}% win rate).`;
    }

    return {
      originZone: originZone as "close-to-table" | "mid-distance" | "far-distance" | "on-table",
      totalShots: stats.totalShots,
      wins: stats.wins,
      losses: stats.losses,
      winRate: Math.round(winRate * 10) / 10,
      commonStrokes,
      recommendation,
    };
  });

  return weaknesses;
}

/**
 * Perform complete semantic zone analysis
 */
export function analyzeSemanticZones(
  allGames: any[],
  userId: string,
  userSide?: "side1" | "side2" | "team1" | "team2"
): SemanticZoneAnalysis {
  const zoneSectorWeaknesses = calculateZoneSectorWeaknesses(allGames, userId, userSide);
  const lineWeaknesses = calculateLineWeaknesses(allGames, userId);
  const originDistanceWeaknesses = calculateOriginDistanceWeaknesses(allGames, userId);

  // Identify top 3 vulnerable zone-sectors
  const topVulnerableZoneSectors = zoneSectorWeaknesses
    .filter(z => z.totalShots > 0)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3);

  // Identify top 3 safe zone-sectors
  const topSafeZoneSectors = zoneSectorWeaknesses
    .filter(z => z.totalShots > 0)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  return {
    zoneSectorWeaknesses,
    lineWeaknesses,
    originDistanceWeaknesses,
    topVulnerableZoneSectors,
    topSafeZoneSectors,
  };
}

/**
 * Main function: Analyze all weaknesses for a user
 * 
 * @param allGames - All games with all shots (user + opponent). Required for analyses that need both sides.
 * @param userId - The user ID to analyze
 * @param userSide - Optional user side for semantic zone analysis
 * @param userGamesOnly - Optional: games filtered to only user's shots. If provided, used for user-specific analyses to improve performance.
 */
export function analyzeWeaknesses(
  allGames: any[],
  userId: string,
  userSide?: "side1" | "side2" | "team1" | "team2",
  userGamesOnly?: any[]
): WeaknessAnalysisResult {
  // Use userGamesOnly if provided for analyses that only process user shots anyway
  // This avoids processing opponent shots unnecessarily
  const gamesForUserAnalysis = userGamesOnly && userGamesOnly.length > 0 
    ? userGamesOnly 
    : allGames;
  
  // Analyses that need ALL shots (user + opponent):
  // - Zone weaknesses: needs to see where points were won/lost by both sides
  // - Semantic zones: origin distance, line weaknesses, zone-sector all need both sides
  // - Opponent patterns: obviously needs opponent shots
  // - Serve/receive: needs to see when opponent served/received
  const zoneWeaknesses = calculateZoneWeaknesses(allGames, userId);
  const semanticZoneAnalysis = analyzeSemanticZones(allGames, userId, userSide);
  const serveReceiveWeaknesses = analyzeServeReceivePatterns(allGames, userId);
  const opponentPatterns = analyzeOpponentPatterns(allGames, userId);
  
  // Analyses that only process user shots (can use filtered games for performance):
  // - Shot weaknesses: filters to outcome.playerId === userId anyway
  const shotWeaknesses = calculateShotWeaknesses(gamesForUserAnalysis, userId);

  const overallInsights = generateOverallInsights(
    shotWeaknesses,
    zoneWeaknesses,
    serveReceiveWeaknesses,
    opponentPatterns,
    semanticZoneAnalysis // NEW: Pass semantic zone analysis
  );

  // Create overall data limitation info
  const overallDataLimitation: DataLimitation = {
    message: "Analysis based on winning shots only. Rally data not available.",
    limitations: [
      "Only the winning shot of each point is recorded",
      "Cannot calculate actual serve/receive success rates (only point outcomes)",
      "Opponent patterns show only what they did when winning, not overall behavior",
      "Rally length and intermediate shots are not available"
    ],
    availableMetrics: [
      "Point outcomes when serving/receiving",
      "Shot effectiveness (what shots win points)",
      "Zone weaknesses (where points are won/lost)",
      "Opponent winning patterns (what they do when they win)"
    ]
  };

  return {
    shotWeaknesses: {
      byStrokeType: shotWeaknesses,
      mostVulnerable: shotWeaknesses.slice(0, 3), // Top 3 weakest
      strongest: shotWeaknesses.slice(-3).reverse(), // Top 3 strongest
    },
    zoneWeaknesses,
    semanticZoneAnalysis, // NEW: Include semantic zone analysis
    serveReceiveWeaknesses,
    opponentPatternAnalysis: {
      successfulStrokes: opponentPatterns,
      successfulZones: zoneWeaknesses.vulnerableZones,
    },
    overallInsights,
    dataLimitation: overallDataLimitation,
  };
}

// Helper functions

function getZoneDescription(x: number, y: number): string {
  // X-axis: 20 columns (0-19), each 5% wide
  // Zone mapping: 0-4=Left Deep, 5-7=Left Mid, 8-9=Left Short, 
  //               10-11=Right Short, 12-14=Right Mid, 15-19=Right Deep
  // Y-axis: 9 rows (0-8), each ~11.11% tall
  // Sector mapping: 0-2=Backhand, 3-5=Crossover, 6-8=Forehand
  
  let xDesc: string;
  if (x <= 4) xDesc = "left deep";
  else if (x <= 7) xDesc = "left mid";
  else if (x <= 9) xDesc = "left short";
  else if (x <= 11) xDesc = "right short";
  else if (x <= 14) xDesc = "right mid";
  else xDesc = "right deep";
  
  const yDesc = y <= 2 ? "backhand" : y <= 5 ? "crossover" : "forehand";
  
  return `${yDesc} ${xDesc}`;
}

function generateShotRecommendation(stroke: string, winRate: number, attempts: number): string {
  if (winRate < 40) {
    return `${formatStrokeName(stroke)} is a critical weakness (${winRate.toFixed(1)}% win rate). Focus practice here.`;
  } else if (winRate < 50) {
    return `${formatStrokeName(stroke)} needs improvement (${winRate.toFixed(1)}% win rate). Work on placement and timing.`;
  } else if (winRate > 70) {
    return `${formatStrokeName(stroke)} is a strength (${winRate.toFixed(1)}% win rate). Use it more often.`;
  } else {
    return `${formatStrokeName(stroke)} is solid (${winRate.toFixed(1)}% win rate). Maintain consistency.`;
  }
}

function generateServeRecommendation(winRate: number, totalServes: number): string {
  if (winRate < 45) {
    return `Your serve win rate is low (${winRate.toFixed(1)}%). Focus on serve placement and variation.`;
  } else if (winRate < 55) {
    return `Your serve is average (${winRate.toFixed(1)}%). Work on adding spin variation and depth control.`;
  } else {
    return `Your serve is strong (${winRate.toFixed(1)}%). Continue using it strategically.`;
  }
}

function generateReceiveRecommendation(
  winRate: number,
  totalReceives: number,
  vsStrokeType: Record<string, { received: number; won: number; winRate: number }>
): string {
  // Find weakest receive type
  const weakestReceive = Object.entries(vsStrokeType)
    .filter(([_, stats]) => stats.received > 0)
    .sort((a, b) => a[1].winRate - b[1].winRate)[0];

  if (winRate < 40) {
    if (weakestReceive) {
      return `Receiving is a major weakness (${winRate.toFixed(1)}%). Especially struggle against ${formatStrokeName(weakestReceive[0])} serves (${weakestReceive[1].winRate.toFixed(1)}% win rate).`;
    }
    return `Receiving is a major weakness (${winRate.toFixed(1)}%). Practice return placement and anticipation.`;
  } else if (winRate < 50) {
    return `Receiving needs work (${winRate.toFixed(1)}%). Focus on reading serve spin and returning deep.`;
  } else {
    return `Your receive game is solid (${winRate.toFixed(1)}%). Keep pressuring opponents' serves.`;
  }
}

/**
 * Check if zone-sector analysis has sufficient data to display
 */
export function hasZoneSectorData(zoneSectorWeaknesses: ZoneSectorWeakness[]): boolean {
  return zoneSectorWeaknesses.length > 0;
}

/**
 * Check if line analysis has sufficient data to display
 */
export function hasLineData(lineWeaknesses: LineWeakness[]): boolean {
  return lineWeaknesses.length > 0;
}

/**
 * Check if origin distance analysis has sufficient data to display
 */
export function hasOriginDistanceData(distanceWeaknesses: OriginDistanceWeakness[]): boolean {
  return distanceWeaknesses.length > 0;
}

/**
 * Check if semantic zone analysis has ANY displayable data
 */
export function hasAnySemanticZoneData(semanticZones: SemanticZoneAnalysis): boolean {
  return hasZoneSectorData(semanticZones.zoneSectorWeaknesses) ||
         hasLineData(semanticZones.lineWeaknesses) ||
         hasOriginDistanceData(semanticZones.originDistanceWeaknesses);
}
