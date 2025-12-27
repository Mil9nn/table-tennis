// types/weaknesses.type.ts

/**
 * Weakness analysis type definitions for table tennis statistics
 */

export interface ShotWeaknessData {
  stroke: string;
  totalAttempts: number;
  pointsWon: number;
  pointsLost: number;
  winRate: number;
  lossRate: number;
  avgLandingZone: { x: number; y: number } | null;
  recommendation: string;
}

export interface ZoneCell {
  x: number; // Zone X coordinate (0-9)
  y: number; // Zone Y coordinate (0-9)
  totalShots: number;
  wins: number;
  losses: number;
  winRate: number;
  dominantStroke: string | null;
  vulnerability: "high" | "medium" | "low";
}

export interface VulnerableZone {
  zone: string; // Human-readable zone description
  lossRate: number;
  totalPoints: number;
  dominantOpponentShot: string | null;
  recommendation: string;
}

export interface SafeZone {
  zone: string; // Human-readable zone description
  winRate: number;
  totalPoints: number;
  dominantStroke: string | null;
}

export interface ZoneWeaknessData {
  heatmapGrid: ZoneCell[][]; // 20x9 grid (9 rows × 20 columns) aligned with zone-sector boundaries
  vulnerableZones: VulnerableZone[];
  safeZones: SafeZone[];
}

export interface ServeWeaknessData {
  totalServes: number;
  servesWon: number;
  servesLost: number;
  serveWinRate: number;
  patternAnalysis: Record<string, { attempts: number; winRate: number }>;
  recommendation: string;
}

export interface ReceiveWeaknessData {
  totalReceives: number;
  receivesWon: number;
  receivesLost: number;
  receiveWinRate: number;
  vsStrokeType: Record<string, { received: number; won: number; winRate: number }>;
  recommendation: string;
}

export interface OpponentPattern {
  stroke: string;
  timesUsed: number;
  pointsWonByOpponent: number;
  effectivenessRate: number;
  commonZones: string[];
  recommendation: string;
}

export interface OverallInsights {
  primaryWeakness: string;
  secondaryWeakness: string | null;
  strengthToMaintain: string;
  improvementPriority: string[];
}

// Semantic Zone Analysis Types (using shot-commentary-utils zone system)

export interface ZoneSectorWeakness {
  zone: "short" | "mid" | "deep";
  // ABSOLUTE SECTOR (perspective-independent, used for stats)
  // - "top": Y 0-33.33 (where left-side players have backhand)
  // - "middle": Y 33.33-66.67 (crossover/center)
  // - "bottom": Y 66.67-100 (where left-side players have forehand)
  sector: "top" | "middle" | "bottom";
  totalShots: number;
  wins: number;
  losses: number;
  winRate: number;
  dominantStroke: string | null;
  vulnerability: "high" | "medium" | "low";
  recommendation: string;
}

export interface LineWeakness {
  line: "down the line" | "diagonal" | "cross court" | "middle line";
  totalShots: number;
  wins: number;
  losses: number;
  winRate: number;
  averageOpponentWinRate: number; // How often opponents win using this line against the player
  recommendation: string;
}

export interface OriginDistanceWeakness {
  originZone: "close-to-table" | "mid-distance" | "far-distance" | "on-table";
  totalShots: number;
  wins: number;
  losses: number;
  winRate: number;
  commonStrokes: Array<{ stroke: string; count: number }>;
  recommendation: string;
}

export interface SemanticZoneAnalysis {
  zoneSectorWeaknesses: ZoneSectorWeakness[]; // All 9 combinations (3 zones × 3 sectors)
  lineWeaknesses: LineWeakness[]; // All 4 line types
  originDistanceWeaknesses: OriginDistanceWeakness[]; // All 4 distance categories
  topVulnerableZoneSectors: ZoneSectorWeakness[]; // Top 3 most vulnerable
  topSafeZoneSectors: ZoneSectorWeakness[]; // Top 3 safest
}

export interface WeaknessAnalysisResult {
  shotWeaknesses: {
    byStrokeType: ShotWeaknessData[];
    mostVulnerable: ShotWeaknessData[];
    strongest: ShotWeaknessData[];
  };
  zoneWeaknesses: ZoneWeaknessData;
  semanticZoneAnalysis: SemanticZoneAnalysis; // NEW: Semantic zone analysis using shot-commentary-utils
  serveReceiveWeaknesses: {
    serve: ServeWeaknessData;
    receive: ReceiveWeaknessData;
  };
  opponentPatternAnalysis: {
    successfulStrokes: OpponentPattern[];
    successfulZones: VulnerableZone[];
  };
  overallInsights: OverallInsights;
}

// Helper types for internal processing

export interface PointOutcome {
  shotIndex: number;
  playerId: string;
  stroke: string | null;
  landingX: number | null;
  landingY: number | null;
  server: string | null;
  won: boolean; // true if player won the point
  opponentStroke: string | null; // opponent's last stroke in the rally
}

export interface ShotWithOutcome {
  shot: any; // Shot from database
  pointWon: boolean;
  isServer: boolean;
}
