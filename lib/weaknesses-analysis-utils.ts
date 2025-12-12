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
} from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { analyzeShotPlacement, getZone, getSector } from "@/lib/shot-commentary-utils";

/**
 * Core algorithm: Determine point winners from shot sequences
 *
 * Strategy: Track score progression through the game
 * - Group shots by point (rally)
 * - Determine who won each point based on score changes
 * - The last shot in a rally belongs to the point winner
 */
export function determinePointOutcomes(game: any): PointOutcome[] {
  const outcomes: PointOutcome[] = [];
  const shots = game.shots || [];

  if (shots.length === 0) return outcomes;

  // Track current scores as we iterate through shots
  let currentSide1Score = 0;
  let currentSide2Score = 0;
  let currentRallyShots: any[] = [];

  shots.forEach((shot: any, index: number) => {
    currentRallyShots.push({ shot, index });

    // Check if score changed after this shot
    // In the database, shots are stored in order, and the score is cumulative
    const nextShot = shots[index + 1];
    const gameEnded = index === shots.length - 1;

    // Determine if point ended (score increased)
    let pointEnded = false;
    let winningSide: "side1" | "side2" | null = null;

    if (gameEnded) {
      // Last shot of the game - check final scores
      const finalSide1 = game.side1Score ?? game.team1Score ?? 0;
      const finalSide2 = game.side2Score ?? game.team2Score ?? 0;

      if (finalSide1 > currentSide1Score) {
        pointEnded = true;
        winningSide = "side1";
        currentSide1Score = finalSide1;
      } else if (finalSide2 > currentSide2Score) {
        pointEnded = true;
        winningSide = "side2";
        currentSide2Score = finalSide2;
      }
    } else {
      // Check if next shot indicates score change
      // We infer score change by rally reset patterns or explicit tracking if available
      // For now, assume each shot that ends a sequence (validated by winnerSide) won the point
      // This is a simplified approach - in production, explicit point tracking would be better

      // Use a heuristic: if server changes or significant time gap, point likely ended
      const serverChanged = nextShot && shot.server?.toString() !== nextShot.server?.toString();

      if (serverChanged) {
        // Server changed = point ended
        pointEnded = true;
        // Determine winner by shot side
        winningSide = shot.side as "side1" | "side2";

        if (winningSide === "side1") {
          currentSide1Score++;
        } else if (winningSide === "side2") {
          currentSide2Score++;
        }
      }
    }

    if (pointEnded && winningSide && currentRallyShots.length > 0) {
      // Process all shots in this rally
      currentRallyShots.forEach(({ shot: rallyShot, index: rallyIndex }) => {
        const playerId = rallyShot.player?._id?.toString() || rallyShot.player?.toString();
        const shotSide = rallyShot.side;
        const wonPoint = shotSide === winningSide;

        // Get opponent's last stroke in this rally (for opponent pattern analysis)
        const opponentShots = currentRallyShots
          .filter(({ shot: s }) => s.side !== shotSide)
          .map(({ shot: s }) => s.stroke)
          .filter(Boolean);
        const opponentStroke = opponentShots[opponentShots.length - 1] || null;

        outcomes.push({
          shotIndex: rallyIndex,
          playerId,
          stroke: rallyShot.stroke,
          landingX: rallyShot.landingX,
          landingY: rallyShot.landingY,
          server: rallyShot.server?.toString() || null,
          won: wonPoint,
          opponentStroke,
        });
      });

      // Reset for next rally
      currentRallyShots = [];
    }
  });

  return outcomes;
}

/**
 * Calculate shot weaknesses for a specific user
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

  // Convert to ShotWeaknessData array
  const weaknesses: ShotWeaknessData[] = Object.entries(strokeStats).map(
    ([stroke, stats]) => {
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
    }
  );

  return weaknesses.sort((a, b) => a.winRate - b.winRate); // Sort by win rate ascending (weakest first)
}

/**
 * Calculate zone-based weaknesses (10x10 grid)
 * 
 * Since only winning shots are recorded:
 * - If shot.player === userId: user won the point (win)
 * - If shot.player !== userId: opponent won the point (loss for user)
 */
export function calculateZoneWeaknesses(
  allGames: any[],
  userId: string
): ZoneWeaknessData {
  // Initialize 10x10 grid
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

  // Process all games
  allGames.forEach((game) => {
    const shots = game.shots || [];
    
    shots.forEach((shot: any) => {
      // Only winning shots are recorded, so check if this shot belongs to the user
      const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
      if (!shotPlayerId) return;
      if (shot.landingX == null || shot.landingY == null) return;

      const zoneX = Math.min(9, Math.floor(shot.landingX / 10));
      const zoneY = Math.min(9, Math.floor(shot.landingY / 10));
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

      // If shot is from user, they won the point. If from opponent, user lost the point.
      if (shotPlayerId === userId) {
        zone.wins++;
      } else {
        zone.losses++;
      }

      if (shot.stroke) {
        zone.strokes[shot.stroke] = (zone.strokes[shot.stroke] || 0) + 1;
      }
    });
  });

  // Convert to 2D array and calculate vulnerability
  const heatmapGrid: ZoneCell[][] = [];
  const allWinRates: number[] = [];

  for (let y = 0; y < 10; y++) {
    const row: ZoneCell[] = [];
    for (let x = 0; x < 10; x++) {
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
        if (cell.totalShots >= 3) {
          if (cell.winRate < avgWinRate - stdDev / 2) {
            cell.vulnerability = "high";
          } else if (cell.winRate > avgWinRate + stdDev / 2) {
            cell.vulnerability = "low";
          } else {
            cell.vulnerability = "medium";
          }
        }
      });
    });
  }

  // Identify top vulnerable and safe zones
  const flatZones = heatmapGrid.flat().filter((z) => z.totalShots >= 5);
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

  allGames.forEach((game) => {
    const outcomes = determinePointOutcomes(game);

    outcomes.forEach((outcome) => {
      if (outcome.playerId !== userId) return;

      const isServing = outcome.server === userId;

      if (isServing) {
        totalServes++;
        if (outcome.won) servesWon++;
      } else {
        totalReceives++;
        if (outcome.won) receivesWon++;

        // Track what opponent served
        if (outcome.opponentStroke) {
          if (!receiveVsStroke[outcome.opponentStroke]) {
            receiveVsStroke[outcome.opponentStroke] = { received: 0, won: 0 };
          }
          receiveVsStroke[outcome.opponentStroke].received++;
          if (outcome.won) {
            receiveVsStroke[outcome.opponentStroke].won++;
          }
        }
      }
    });
  });

  const serveWinRate = totalServes > 0 ? (servesWon / totalServes) * 100 : 0;
  const receiveWinRate = totalReceives > 0 ? (receivesWon / totalReceives) * 100 : 0;

  const vsStrokeType: Record<string, { received: number; won: number; winRate: number }> = {};
  Object.entries(receiveVsStroke).forEach(([stroke, stats]) => {
    vsStrokeType[stroke] = {
      ...stats,
      winRate: stats.received > 0 ? (stats.won / stats.received) * 100 : 0,
    };
  });

  return {
    serve: {
      totalServes,
      servesWon,
      servesLost: totalServes - servesWon,
      serveWinRate: Math.round(serveWinRate * 10) / 10,
      patternAnalysis: {}, // Could be enhanced with serve type analysis
      recommendation: generateServeRecommendation(serveWinRate, totalServes),
    },
    receive: {
      totalReceives,
      receivesWon,
      receivesLost: totalReceives - receivesWon,
      receiveWinRate: Math.round(receiveWinRate * 10) / 10,
      vsStrokeType,
      recommendation: generateReceiveRecommendation(receiveWinRate, totalReceives, vsStrokeType),
    },
  };
}

/**
 * Analyze opponent patterns (what opponents do to win)
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
      // We want to track what opponents did when they WON points against this user
      if (outcome.playerId === userId && !outcome.won && outcome.opponentStroke) {
        const stroke = outcome.opponentStroke;

        if (!opponentStrokes[stroke]) {
          opponentStrokes[stroke] = { timesUsed: 0, pointsWonByOpponent: 0, zones: [] };
        }

        opponentStrokes[stroke].timesUsed++;
        opponentStrokes[stroke].pointsWonByOpponent++;

        if (outcome.landingX != null && outcome.landingY != null) {
          const zoneX = Math.min(9, Math.floor(outcome.landingX / 10));
          const zoneY = Math.min(9, Math.floor(outcome.landingY / 10));
          opponentStrokes[stroke].zones.push(getZoneDescription(zoneX, zoneY));
        }
      }
    });
  });

  const patterns: OpponentPattern[] = Object.entries(opponentStrokes)
    .map(([stroke, stats]) => {
      const effectivenessRate = (stats.pointsWonByOpponent / stats.timesUsed) * 100;

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
        timesUsed: stats.timesUsed,
        pointsWonByOpponent: stats.pointsWonByOpponent,
        effectivenessRate: Math.round(effectivenessRate * 10) / 10,
        commonZones,
        recommendation: `Opponents exploit this with ${formatStrokeName(stroke)} (${Math.round(effectivenessRate)}% success)`,
      };
    })
    .filter((p) => p.timesUsed >= 5) // Only include patterns with sufficient data
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
  const strongShots = shotWeaknesses.filter((s) => s.winRate > 60 && s.totalAttempts >= 10);
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
    .filter(l => l.totalShots >= 10)
    .sort((a, b) => a.winRate - b.winRate)[0];

  if (vulnerableLine && vulnerableLine.winRate < 45) {
    improvementPriority.push(vulnerableLine.recommendation);
  }

  // Check for distance weaknesses
  const vulnerableDistance = semanticZones.originDistanceWeaknesses
    .filter(d => d.totalShots >= 10)
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
 */
export function calculateZoneSectorWeaknesses(
  allGames: any[],
  userId: string
): ZoneSectorWeakness[] {
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
  allGames.forEach((game) => {
    const shots = game.shots || [];
    
    shots.forEach((shot: any) => {
      const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString();
      if (!shotPlayerId) return;
      if (shot.landingX == null || shot.landingY == null) return;

      // Use getZone and getSector directly (they only need landing coordinates)
      const zone = getZone(shot.landingX);
      const sector = getSector(shot.landingY);

      if (!zone || !sector) return; // Skip if null

      const key = `${zone}-${sector}`;
      const stats = zoneSectorStats[key];

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

  // Calculate win rates and vulnerability
  const allWinRates: number[] = [];
  Object.values(zoneSectorStats).forEach(stats => {
    if (stats.totalShots >= 3) {
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
      if (stats.totalShots >= 3) {
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

      // Generate recommendation
      const zoneName = `${zone} ${sector}`;
      let recommendation = "";
      if (stats.totalShots < 3) {
        recommendation = `Insufficient data for ${zoneName} zone. Play more matches to analyze.`;
      } else if (vulnerability === "high") {
        recommendation = `${zoneName.charAt(0).toUpperCase() + zoneName.slice(1)} zone is vulnerable (${winRate.toFixed(0)}% win rate). Practice defending this area.`;
      } else if (vulnerability === "low") {
        recommendation = `${zoneName.charAt(0).toUpperCase() + zoneName.slice(1)} zone is a strength (${winRate.toFixed(0)}% win rate). Use this advantage.`;
      } else {
        recommendation = `${zoneName.charAt(0).toUpperCase() + zoneName.slice(1)} zone performance is average (${winRate.toFixed(0)}% win rate). Maintain consistency.`;
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
      const shot: any = {
        landingX: outcome.landingX || 50,
        landingY: outcome.landingY || 50,
        originX: null, // Would need from previous shot
        originY: null,
        side: null,
      };

      const receivingSide: "side2" | "side1" = "side2";
      const placement = analyzeShotPlacement(shot, receivingSide);

      if (!placement.line) return;

      if (outcome.playerId === userId) {
        // User's shot
        const stats = lineStats[placement.line];
        stats.totalShots++;
        if (outcome.won) stats.wins++;
        else stats.losses++;
      } else {
        // Opponent's shot against user
        const stats = lineStats[placement.line];
        stats.opponentTotal++;
        if (!outcome.won) stats.opponentWins++; // Opponent won if user lost
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
    if (stats.totalShots < 5) {
      recommendation = `Limited data for ${line} shots. Play more to analyze.`;
    } else if (winRate < 45) {
      recommendation = `Your ${line} shots are weak (${winRate.toFixed(0)}% win rate). Work on accuracy and placement.`;
    } else if (averageOpponentWinRate > 60 && stats.opponentTotal >= 5) {
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

      // Determine receiving side based on shot side
      const receivingSide: "side2" | "side1" = shot.side === "side1" ? "side2" : "side1";
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
    if (stats.totalShots < 3) {
      recommendation = `Limited data for ${zoneName} position.`;
    } else if (winRate < 45) {
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
  userId: string
): SemanticZoneAnalysis {
  const zoneSectorWeaknesses = calculateZoneSectorWeaknesses(allGames, userId);
  const lineWeaknesses = calculateLineWeaknesses(allGames, userId);
  const originDistanceWeaknesses = calculateOriginDistanceWeaknesses(allGames, userId);

  // Identify top 3 vulnerable zone-sectors
  const topVulnerableZoneSectors = zoneSectorWeaknesses
    .filter(z => z.totalShots >= 5)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3);

  // Identify top 3 safe zone-sectors
  const topSafeZoneSectors = zoneSectorWeaknesses
    .filter(z => z.totalShots >= 5)
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
 */
export function analyzeWeaknesses(
  allGames: any[],
  userId: string
): WeaknessAnalysisResult {
  const shotWeaknesses = calculateShotWeaknesses(allGames, userId);
  const zoneWeaknesses = calculateZoneWeaknesses(allGames, userId);
  const semanticZoneAnalysis = analyzeSemanticZones(allGames, userId); // NEW
  const serveReceiveWeaknesses = analyzeServeReceivePatterns(allGames, userId);
  const opponentPatterns = analyzeOpponentPatterns(allGames, userId);

  const overallInsights = generateOverallInsights(
    shotWeaknesses,
    zoneWeaknesses,
    serveReceiveWeaknesses,
    opponentPatterns,
    semanticZoneAnalysis // NEW: Pass semantic zone analysis
  );

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
  };
}

// Helper functions

function getZoneDescription(x: number, y: number): string {
  const xDesc = x < 3 ? "left" : x > 6 ? "right" : "middle";
  const yDesc = y < 3 ? "near" : y > 6 ? "deep" : "mid";
  return `${yDesc} ${xDesc}`;
}

function generateShotRecommendation(stroke: string, winRate: number, attempts: number): string {
  if (attempts < 10) {
    return `Limited data for ${formatStrokeName(stroke)}. Play more to analyze.`;
  }

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
  if (totalServes < 10) {
    return "Limited serve data available. Play more matches to analyze.";
  }

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
  if (totalReceives < 10) {
    return "Limited receive data available. Play more matches to analyze.";
  }

  // Find weakest receive type
  const weakestReceive = Object.entries(vsStrokeType)
    .filter(([_, stats]) => stats.received >= 5)
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
  return zoneSectorWeaknesses.some(w => w.totalShots >= 3);
}

/**
 * Check if line analysis has sufficient data to display
 */
export function hasLineData(lineWeaknesses: LineWeakness[]): boolean {
  return lineWeaknesses.some(l => l.totalShots >= 5);
}

/**
 * Check if origin distance analysis has sufficient data to display
 */
export function hasOriginDistanceData(distanceWeaknesses: OriginDistanceWeakness[]): boolean {
  return distanceWeaknesses.some(d => d.totalShots >= 3);
}

/**
 * Check if semantic zone analysis has ANY displayable data
 */
export function hasAnySemanticZoneData(semanticZones: SemanticZoneAnalysis): boolean {
  return hasZoneSectorData(semanticZones.zoneSectorWeaknesses) ||
         hasLineData(semanticZones.lineWeaknesses) ||
         hasOriginDistanceData(semanticZones.originDistanceWeaknesses);
}
