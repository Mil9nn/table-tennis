import { Shot, Side } from "@/types/shot.type";
import { Participant, InitialServerConfig } from "@/types/match.type";
import { getAbsoluteSector, getRelativeSector } from "@/lib/sector-utils";
import { flipDoublesRotationForNextGame } from "@/services/match/serverCalculationService";

export interface ShotCommentary {
  // ABSOLUTE (perspective-independent - used for statistics)
  absoluteSector: "top" | "middle" | "bottom" | null;
  zone: "short" | "mid" | "deep" | null;
  line: "down the line" | "diagonal" | "cross court" | "middle line" | null;
  
  // RELATIVE (perspective-dependent - used for commentary/UI only)
  sector: "backhand" | "crossover" | "forehand" | null;
  
  // Additional info
  originZone: "close-to-table" | "mid-distance" | "far-distance" | null;
}

/* ---------------------------------------------------------
   Enhanced Analysis Functions
--------------------------------------------------------- */

/**
 * Calculate where the trajectory from origin to landing intersects the table boundary
 * Used when origin is off-table to determine effective origin sector/zone
 *
 * @param originX - Origin X coordinate (may be off-table: -50 to 150)
 * @param originY - Origin Y coordinate (may be off-table: -50 to 150)
 * @param landingX - Landing X coordinate (on-table: 0 to 100)
 * @param landingY - Landing Y coordinate (on-table: 0 to 100)
 * @returns Intersection point {x, y} on table boundary, or null if origin is on-table
 */
function calculateTableIntersection(
  originX: number,
  originY: number,
  landingX: number,
  landingY: number
): { x: number; y: number } | null {
  // Check if origin is already on table
  if (originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100) {
    return null; // Origin is on-table, no intersection needed
  }

  // Line parametric equation: P(t) = origin + t * (landing - origin), t ∈ [0, 1]
  const dx = landingX - originX;
  const dy = landingY - originY;

  let minT = Infinity;
  let intersectionX = originX;
  let intersectionY = originY;

  // Check intersection with left edge (X = 0)
  if (originX < 0) {
    const t = (0 - originX) / dx;
    if (t >= 0 && t <= 1) {
      const y = originY + t * dy;
      if (y >= 0 && y <= 100 && t < minT) {
        minT = t;
        intersectionX = 0;
        intersectionY = y;
      }
    }
  }

  // Check intersection with right edge (X = 100)
  if (originX > 100) {
    const t = (100 - originX) / dx;
    if (t >= 0 && t <= 1) {
      const y = originY + t * dy;
      if (y >= 0 && y <= 100 && t < minT) {
        minT = t;
        intersectionX = 100;
        intersectionY = y;
      }
    }
  }

  // Check intersection with top edge (Y = 0)
  if (originY < 0) {
    const t = (0 - originY) / dy;
    if (t >= 0 && t <= 1) {
      const x = originX + t * dx;
      if (x >= 0 && x <= 100 && t < minT) {
        minT = t;
        intersectionX = x;
        intersectionY = 0;
      }
    }
  }

  // Check intersection with bottom edge (Y = 100)
  if (originY > 100) {
    const t = (100 - originY) / dy;
    if (t >= 0 && t <= 1) {
      const x = originX + t * dx;
      if (x >= 0 && x <= 100 && t < minT) {
        minT = t;
        intersectionX = x;
        intersectionY = 100;
      }
    }
  }

  // If no valid intersection found (shouldn't happen if landing is on-table), return origin
  if (minT === Infinity) {
    return { x: originX, y: originY };
  }

  return { x: intersectionX, y: intersectionY };
}

/**
 * Determine zone based on landing X coordinate (horizontal)
 * Zones: Deep (closest to player) | Mid | Short (closest to net)
 * Left side: Deep (0-25) | Mid (25-40) | Short (40-50)
 * Right side: Short (50-60) | Mid (60-75) | Deep (75-100)
 */
export function getZone(landingX: number, receivingSide?: Side): "short" | "mid" | "deep" | null {
  // Determine which side of the table the ball landed on
  const isLeftSide = landingX <= 50;
  
  if (isLeftSide) {
    // Left side zones: Deep | Mid | Short (towards net)
    if (landingX < THRESHOLDS.ZONE_DEEP_LEFT) {
      return "deep";
    } else if (landingX < THRESHOLDS.ZONE_MID_LEFT) {
      return "mid";
    } else if (landingX < THRESHOLDS.ZONE_SHORT_LEFT) {
      return "short";
    } else {
      // Exactly at center line (x=50), consider it short (closest to net)
      return "short";
    }
  } else {
    // Right side zones: Short | Mid | Deep (away from net)
    if (landingX < THRESHOLDS.ZONE_SHORT_RIGHT) {
      return "short";
    } else if (landingX < THRESHOLDS.ZONE_MID_RIGHT) {
      return "mid";
    } else {
      return "deep";
    }
  }
}

/**
 * Determine sector based on landing Y coordinate (vertical)
 * Sectors: Backhand (top) | Crossover (middle) | Forehand (bottom)
 * Left side player: Backhand (y=0-33.33) | Crossover (y=33.33-66.67) | Forehand (y=66.67-100)
 * Right side player: Forehand (y=0-33.33) | Crossover (y=33.33-66.67) | Backhand (y=66.67-100)
 * 
 * @param landingY - Y coordinate where ball lands (0-100)
 * @param receivingSide - Which side the receiving player is on ("side1" or "side2")
 * @param isLeftHanded - Whether receiving player is left-handed (default: false)
 */
export function getSector(
  landingY: number,
  receivingSide?: Side,
  isLeftHanded: boolean = false
): "backhand" | "crossover" | "forehand" | null {
  // Determine sector based on Y coordinate
  let sector: "backhand" | "crossover" | "forehand";
  
  if (landingY < THRESHOLDS.SECTOR_BACKHAND) {
    sector = "backhand";
  } else if (landingY < THRESHOLDS.SECTOR_CROSSOVER) {
    sector = "crossover";
  } else {
    sector = "forehand";
  }
  
  // For right side player (side2/team2), flip backhand/forehand
  // Right side: Forehand (top) | Crossover (middle) | Backhand (bottom)
  if (receivingSide === "side2" || receivingSide === "team2") {
    if (sector === "backhand") {
      sector = "forehand";
    } else if (sector === "forehand") {
      sector = "backhand";
    }
  }
  
  // For left-handed players, reverse backhand/forehand
  if (isLeftHanded) {
    if (sector === "backhand") {
      sector = "forehand";
    } else if (sector === "forehand") {
      sector = "backhand";
    }
  }
  
  return sector;
}

/**
 * Determine line of play based on sector transitions from hitter to receiver
 *
 * Classification Rules (from receiver's perspective):
 * - Down the line: FH→BH, CrossOver→CrossOver, BH→FH (straight shots)
 * - Diagonal: (FH→FH OR BH→BH) AND both zones are deep (deep cross-court)
 * - Cross court: (FH→FH OR BH→BH) AND at least one zone is NOT deep
 * - Middle line: FH→CrossOver, BH→CrossOver (shots toward middle)
 *
 * Note: Sectors are automatically mirrored based on side (side1 vs side2)
 * Note: For off-table origins, intersection point is used for origin sector/zone
 *
 * @param originY - Y coordinate of origin (or intersection point if off-table)
 * @param landingY - Y coordinate where ball landed (0-100)
 * @param originSide - Which side the hitter is on ("side1" or "side2")
 * @param receivingSide - Which side the receiver is on ("side1" or "side2")
 * @param originZone - Zone at origin/intersection point ("short" | "mid" | "deep")
 * @param landingZone - Zone where ball landed ("short" | "mid" | "deep")
 * @param isLeftHanded - Whether players are left-handed (default: false)
 * @returns Line classification or null if coordinates are invalid
 */
function getLine(
  originY: number,
  landingY: number,
  originSide: Side,
  receivingSide: Side,
  originZone: "short" | "mid" | "deep" | null,
  landingZone: "short" | "mid" | "deep" | null,
  isLeftHanded: boolean = false
): "down the line" | "diagonal" | "cross court" | "middle line" | null {
  // Get origin sector (hitter's perspective)
  const originSector = getSector(originY, originSide, isLeftHanded);

  // Get landing sector (receiver's perspective)
  const landingSector = getSector(landingY, receivingSide, isLeftHanded);

  // Return null if either sector is invalid
  if (!originSector || !landingSector) {
    return null;
  }

  // Down the line: FH→BH, CrossOver→CrossOver, BH→FH
  if (
    (originSector === "forehand" && landingSector === "backhand") ||
    (originSector === "crossover" && landingSector === "crossover") ||
    (originSector === "backhand" && landingSector === "forehand")
  ) {
    return "down the line";
  }

  // Diagonal or Cross court: FH→FH, BH→BH (depends on zones)
  if (
    (originSector === "forehand" && landingSector === "forehand") ||
    (originSector === "backhand" && landingSector === "backhand")
  ) {
    // Check if both zones are "deep" for diagonal classification
    if (originZone === "deep" && landingZone === "deep") {
      return "diagonal";
    }
    // Otherwise it's regular cross court
    return "cross court";
  }

  // Middle line: FH→CrossOver, BH→CrossOver, or CrossOver→FH/BH
  return "middle line";
}

/**
 * Determine origin zone based on where shot was played from
 * Origin Zones: Close-to-Table, Mid-distance, Far-distance
 * These distances only apply when the player is hitting from OFF the table.
 * If the origin is ON the table, the player is already close-to-the-table by definition.
 */
function getOriginZone(originX: number, originY: number): "close-to-table" | "mid-distance" | "far-distance" | null {
  // Check if origin is on the table
  const isInsideTable = originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100;
  
  if (isInsideTable) {
    // If on table, player is close-to-the-table by definition
    // Return null to indicate it's the default case (won't be mentioned in commentary)
    return null;
  }
  
  // If off table, calculate distance from table edge
  // Calculate the minimum distance from any table edge
  const distanceX = originX < 0 ? Math.abs(originX) : originX > 100 ? originX - 100 : 0;
  const distanceY = originY < 0 ? Math.abs(originY) : originY > 100 ? originY - 100 : 0;
  const distanceFromTable = Math.max(distanceX, distanceY);
  
  if (distanceFromTable < THRESHOLDS.ORIGIN_DISTANCE_CLOSE) {
    return "close-to-table";
  } else if (distanceFromTable < THRESHOLDS.ORIGIN_DISTANCE_MID) {
    return "mid-distance";
  } else {
    return "far-distance";
  }
}

/* ---------------------------------------------------------
   Main Analyzer
   Coordinate system:
   - Origin: -50 to 150 (player can hit from anywhere)
   - Landing: 0 to 100 (ball landed on table)
   - X: 0-50 = left side, 50-100 = right side
   - Y: 0 = near net (top), 100 = deep (back)
--------------------------------------------------------- */

// Threshold constants - single source of truth
const THRESHOLDS = {
  EDGE: 12,                    // Distance from table edge to be considered "edge ball"
  CENTER_LINE: 12,             // Distance from center line (X=50) to be considered "center"
  SHORT_BALL: 25,              // Y < 25 = short ball
  DEEP_BALL: 75,               // Y > 75 = deep ball
  CLOSE_TO_NET_Y: 50,          // Y < 50 = front half, considered "close to net" area
  ORIGIN_CLOSE_TO_TABLE: 26,   // Distance from table edge for "close to table" (70cm)
  // Zone thresholds (horizontal/X-based): Deep | Mid | Short on each side
  ZONE_DEEP_LEFT: 25,          // Left side: Deep zone (0-25)
  ZONE_MID_LEFT: 40,           // Left side: Mid zone (25-40)
  ZONE_SHORT_LEFT: 50,         // Left side: Short zone (40-50)
  ZONE_SHORT_RIGHT: 60,        // Right side: Short zone (50-60)
  ZONE_MID_RIGHT: 75,          // Right side: Mid zone (60-75)
  ZONE_DEEP_RIGHT: 100,        // Right side: Deep zone (75-100)
  // Sector thresholds (vertical/Y-based): Backhand | Crossover | Forehand
  SECTOR_BACKHAND: 33.33,      // Y < 33.33% = Backhand (for left side player)
  SECTOR_CROSSOVER: 66.67,     // Y 33.33-66.67% = Crossover
  SECTOR_FOREHAND: 66.67,      // Y > 66.67% = Forehand (for left side player)
  ORIGIN_CLOSE_Y: 33.33,       // originY < 33.33% = Close-to-Table
  ORIGIN_FAR_Y: 66.67,         // originY > 66.67% = Far-distance
  ORIGIN_DISTANCE_CLOSE: 26,   // Distance from table < 70cm (26 * 2.74 = 71.24cm)
  ORIGIN_DISTANCE_MID: 73,     // Distance from table 70cm-2m (73 * 2.74 = 200.02cm)
  LINE_ANGLE_THRESHOLD: 15,    // Angle threshold for middle line (degrees)
} as const;

export function analyzeShotPlacement(shot: Pick<Shot, 'originX' | 'originY' | 'landingX' | 'landingY' | 'side'>, receivingSide?: Side): ShotCommentary {
  const { originX, originY, landingX, landingY, side } = shot;

  if (
    originX == null ||
    originY == null ||
    landingX == null ||
    landingY == null
  ) {
    return {
      absoluteSector: null,
      zone: null,
      sector: null,
      line: null,
      originZone: null,
    };
  }

  const commentary: ShotCommentary = {
    // ABSOLUTE (perspective-independent)
    absoluteSector: null,
    zone: null,
    line: null,
    // RELATIVE (perspective-dependent)
    sector: null,
    // Additional
    originZone: null,
  };

  // ============================================================
  // STEP 1: Calculate basic metrics (used throughout)
  // ============================================================
  const distanceFromCenterLine = Math.abs(landingX - 50);
  const isNearLeftEdge = landingX < THRESHOLDS.EDGE;
  const isNearRightEdge = landingX > 100 - THRESHOLDS.EDGE;
  const isNearTopEdge = landingY < THRESHOLDS.EDGE;
  const isNearBottomEdge = landingY > 100 - THRESHOLDS.EDGE;
  const isNearCenter = distanceFromCenterLine < THRESHOLDS.CENTER_LINE;
  const isInFrontHalf = landingY < THRESHOLDS.CLOSE_TO_NET_Y;

  // ============================================================
  // STEP 2: Enhanced Analysis (New terminology)
  // ============================================================
  // Zone (landing position - horizontal/X-based)
  // Determine receiving side: if shot is from side1, receiving side is side2, and vice versa
  // The ball lands on the receiving player's side
  const shotReceivingSide = receivingSide || (side === "side1" ? "side2" : "side1");
  commentary.zone = getZone(landingX, shotReceivingSide);
  
  // ABSOLUTE SECTOR (landing position - vertical/Y-based, perspective-independent)
  // This is used for statistics and analysis, ALWAYS the same regardless of side
  commentary.absoluteSector = getAbsoluteSector(landingY);
  
  // RELATIVE SECTOR (landing position - vertical/Y-based, relative to receiving player)
  // This is only for UI display and commentary, changes based on perspective
  commentary.sector = getRelativeSector(landingY, shotReceivingSide, false);
  
  // Line (shot trajectory based on sectors and zones)
  // Determine origin side (where the hitter is)
  const originSide = side;

  // Calculate intersection point if origin is off-table
  const intersection = calculateTableIntersection(originX, originY, landingX, landingY);

  // Use intersection point for origin sector/zone if off-table, otherwise use actual origin
  const effectiveOriginX = intersection ? intersection.x : originX;
  const effectiveOriginY = intersection ? intersection.y : originY;

  // Calculate origin zone using intersection point (if off-table) or actual origin
  const originZone = getZone(effectiveOriginX, originSide);

  // Get line classification
  commentary.line = getLine(
    effectiveOriginY,
    landingY,
    originSide,
    shotReceivingSide,
    originZone,
    commentary.zone, // Landing zone already calculated above
    false
  );
  
  // Origin Zone (where shot was played from)
  commentary.originZone = getOriginZone(originX, originY);

  return commentary;
}

/**
 * Commentary Generation - Natural Sentence Flow
--------------------------------------------------------- */

export function generateShotCommentary(
  shot: Shot,
  playerName: string
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  // Start with player and stroke
  let description = `${playerName} played a ${strokeName}`;

  // Build natural sentence flow using consistent terminology:
  // 1. Origin zone (where from) - only if relevant
  // 2. Line (trajectory pattern)
  // 3. Landing zone (where to)

  const phrases: string[] = [];

  // Add origin zone if not close-to-table (default assumption)
  if (commentary.originZone && commentary.originZone !== "close-to-table") {
    const originText = commentary.originZone.replace("-", " ");
    if (originText === "far distance") {
      phrases.push("from far distance");
    } else if (originText === "mid distance") {
      phrases.push("from mid distance");
    } else {
      phrases.push(`from ${originText}`);
    }
  }

  // Add line (trajectory pattern)
  if (commentary.line) {
    phrases.push(commentary.line);
  }

  // Add landing zone
  if (commentary.zone) {
    phrases.push(`into ${commentary.zone} zone`);
  }

  // Combine phrases naturally with commas
  if (phrases.length > 0) {
    description += ", " + phrases.join(", ") + ".";
  } else {
    description += ".";
  }

  return description;
}

export function generateShortCommentary(shot: Shot): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  // Build natural sentence for short commentary
  // Format: [Shot type] played [origin distance], [line], into [zone] zone
  // Note: Sectors are omitted - they're for analytics, not commentary
  const parts: string[] = [];

  // Start with stroke
  parts.push(strokeName);

  // Add origin distance if not close-to-table (default assumption)
  if (commentary.originZone && commentary.originZone !== "close-to-table") {
    const originText = commentary.originZone.replace("-", " ");
    if (originText === "far distance") {
      parts.push("played far from the table");
    } else if (originText === "mid distance") {
      parts.push("played from mid distance");
    } else {
      parts.push(`played ${originText}`);
    }
  }

  // Add line (trajectory)
  if (commentary.line) {
    parts.push(commentary.line);
  }

  // Add landing zone (sectors omitted - they're for analytics, not commentary)
  if (commentary.zone) {
    parts.push(`into ${commentary.zone} zone`);
  }

  // Join with commas and add period at the end
  return parts.join(", ") + ".";
}

/**
 * Helper function to get server information from shot
 */
function getServerInfo(shot: Shot, participants?: Participant[]): { name: string; id: string | null } | null {
  if (!shot.server) return null;
  
  const serverId = typeof shot.server === 'string' ? shot.server : shot.server._id?.toString() || null;
  if (!serverId) return null;
  
  // If participants provided, find the server
  if (participants && participants.length > 0) {
    const serverIndex = participants.findIndex(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === serverId;
    });
    
    if (serverIndex !== -1) {
      const server = participants[serverIndex];
      const serverObj = typeof server === 'string' ? null : server;
      const serverName = serverObj?.fullName || serverObj?.username || "Unknown";
      
      return {
        name: serverName,
        id: serverId
      };
    }
  }
  
  // Fallback: try to get from shot.server directly
  const serverObj = typeof shot.server === 'string' ? null : shot.server;
  if (serverObj) {
    return {
      name: serverObj.fullName || serverObj.username || "Unknown",
      id: serverId
    };
  }
  
  return null;
}

/**
 * Helper function to map rotation key to participant index
 * Rotation keys: "side1_main" -> 0, "side1_partner" -> 1, "side2_main" -> 2, "side2_partner" -> 3
 * Or: "team1_main" -> 0, "team1_partner" -> 1, "team2_main" -> 2, "team2_partner" -> 3
 */
function getParticipantIndexFromRotationKey(rotationKey: string): number {
  if (rotationKey.includes("main")) {
    if (rotationKey.startsWith("side1") || rotationKey.startsWith("team1")) {
      return 0;
    } else {
      return 2;
    }
  } else if (rotationKey.includes("partner")) {
    if (rotationKey.startsWith("side1") || rotationKey.startsWith("team1")) {
      return 1;
    } else {
      return 3;
    }
  }
  return -1;
}

/**
 * Helper function to get receiver information from rotation
 * For doubles, calculates the specific receiver based on rotation order
 * For singles, receiver is the other player
 */
function getReceiverInfo(
  shot: Shot, 
  participants?: Participant[],
  serverConfig?: InitialServerConfig | null,
  gameNumber?: number,
  currentGameScore?: { side1Score: number; side2Score: number }
): { name: string; id: string | null } | null {
  if (!shot.server || !participants || participants.length === 0) return null;
  
  const serverId = typeof shot.server === 'string' ? shot.server : shot.server._id?.toString() || null;
  if (!serverId) return null;
  
  const isDoubles = participants.length === 4;
  
  // Singles: receiver is always the other player
  if (participants.length === 2) {
    const serverIndex = participants.findIndex(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === serverId;
    });
    
    if (serverIndex === -1) return null;
    
    const receiver = participants[serverIndex === 0 ? 1 : 0] || null;
    if (!receiver) return null;
    
    const receiverObj = typeof receiver === 'string' ? null : receiver;
    const receiverName = receiverObj?.fullName || receiverObj?.username || "Unknown";
    
    return {
      name: receiverName,
      id: receiverObj?._id?.toString() || null
    };
  }
  
  // Doubles: calculate receiver from rotation
  if (isDoubles && serverConfig?.serverOrder && serverConfig.serverOrder.length === 4) {
    // Get the rotation for this game (account for flips every 2 games)
    let rotation = [...serverConfig.serverOrder];
    if (gameNumber && gameNumber % 2 === 0) {
      rotation = flipDoublesRotationForNextGame(rotation);
    }
    
    // Find which player is serving
    const serverIndex = participants.findIndex(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === serverId;
    });
    
    if (serverIndex === -1) return null;
    
    // Map server participant index to expected rotation key
    // participants[0] = side1_main or team1_main
    // participants[1] = side1_partner or team1_partner
    // participants[2] = side2_main or team2_main
    // participants[3] = side2_partner or team2_partner
    const expectedServerKeys = [
      rotation.find(key => (key.includes("side1") || key.includes("team1")) && key.includes("main")),
      rotation.find(key => (key.includes("side1") || key.includes("team1")) && key.includes("partner")),
      rotation.find(key => (key.includes("side2") || key.includes("team2")) && key.includes("main")),
      rotation.find(key => (key.includes("side2") || key.includes("team2")) && key.includes("partner"))
    ];
    
    const serverRotationKey = expectedServerKeys[serverIndex];
    
    // If we can't find the server in rotation, fallback to simple opposite side logic
    if (!serverRotationKey) {
      const isServerSide1 = serverIndex < 2;
      const receiver = isServerSide1 ? participants[2] : participants[0];
      if (!receiver) return null;
      const receiverObj = typeof receiver === 'string' ? null : receiver;
      return {
        name: receiverObj?.fullName || receiverObj?.username || "Unknown",
        id: receiverObj?._id?.toString() || null
      };
    }
    
    // Calculate total points to determine current position in rotation cycle
    const totalPoints = currentGameScore 
      ? currentGameScore.side1Score + currentGameScore.side2Score 
      : 0;
    const serveCycle = Math.floor(totalPoints / 2);
    const currentRotationIndex = serveCycle % 4;
    
    // The rotation cycles through: [server, receiver, server's partner, receiver's partner]
    // At any point, the current server is at rotation[currentRotationIndex]
    // The receiver is at rotation[(currentRotationIndex + 1) % 4]
    // Verify that the server from the shot matches the expected server at this rotation position
    const expectedServerKey = rotation[currentRotationIndex];
    if (expectedServerKey !== serverRotationKey) {
      // Server doesn't match expected position - fallback to simple logic
      const isServerSide1 = serverIndex < 2;
      const receiver = isServerSide1 ? participants[2] : participants[0];
      if (!receiver) return null;
      const receiverObj = typeof receiver === 'string' ? null : receiver;
      return {
        name: receiverObj?.fullName || receiverObj?.username || "Unknown",
        id: receiverObj?._id?.toString() || null
      };
    }
    
    const receiverRotationIndex = (currentRotationIndex + 1) % 4;
    const receiverRotationKey = rotation[receiverRotationIndex];
    
    // Map receiver rotation key to participant index
    const receiverParticipantIndex = getParticipantIndexFromRotationKey(receiverRotationKey);
    if (receiverParticipantIndex === -1 || receiverParticipantIndex >= participants.length) return null;
    
    const receiver = participants[receiverParticipantIndex];
    if (!receiver) return null;
    
    const receiverObj = typeof receiver === 'string' ? null : receiver;
    const receiverName = receiverObj?.fullName || receiverObj?.username || "Unknown";
    
    return {
      name: receiverName,
      id: receiverObj?._id?.toString() || null
    };
  }
  
  // Fallback: if no serverConfig, use simple opposite side logic
  const serverIndex = participants.findIndex(p => {
    const pid = typeof p === 'string' ? p : p._id?.toString();
    return pid === serverId;
  });
  
  if (serverIndex === -1) return null;
  
  const isServerSide1 = serverIndex < 2;
  const receiver = isServerSide1 ? participants[2] : participants[0];
  if (!receiver) return null;
  
  const receiverObj = typeof receiver === 'string' ? null : receiver;
  return {
    name: receiverObj?.fullName || receiverObj?.username || "Unknown",
    id: receiverObj?._id?.toString() || null
  };
}

/**
 * Helper function to get set score at the time of shot
 * This is called with the set score calculated at the game level
 */
function getSetScoreAtShot(
  setScore: { side1Sets: number; side2Sets: number }
): { side1Sets: number; side2Sets: number } {
  return setScore;
}

/**
 * Helper function to format zone name with proper capitalization
 */
function formatZoneName(zone: string | null): string {
  if (!zone) return "";
  const zoneMap: Record<string, string> = {
    "short": "Short Zone",
    "mid": "Mid Zone",
    "deep": "Deep Zone"
  };
  return zoneMap[zone] || zone;
}

/**
 * Helper function to format sector name with proper capitalization
 */
function formatSectorName(sector: string | null): string {
  if (!sector) return "";
  const sectorMap: Record<string, string> = {
    "forehand": "Forehand",
    "backhand": "Backhand",
    "crossover": "CrossOver"
  };
  return sectorMap[sector] || sector;
}

/**
 * Helper function to format distance descriptor
 */
function formatDistanceDescriptor(originZone: string | null): string {
  if (!originZone) return "";
  const distanceMap: Record<string, string> = {
    "close-to-table": "close-to-the-table",
    "mid-distance": "Mid-distance",
    "far-distance": "Far distance"
  };
  return distanceMap[originZone] || originZone;
}

/**
 * Generate full commentary with server info and game score
 * Format: "[Server] serving [Receiver]. [Winner] wins the point by [Sector] [Shot type] to [placement with zones/sectors/lines], and game score now is [X-Y] ([player1-player2])"
 */
export function generateFullCommentary(
  shot: Shot,
  participants?: Participant[],
  games?: Array<{ gameNumber: number; side1Score?: number; side2Score?: number; winnerSide?: string | null; completed?: boolean }>,
  finalScore?: { side1Sets: number; side2Sets: number },
  side1Name?: string,
  side2Name?: string,
  currentGameScore?: { side1Score: number; side2Score: number },
  serverConfig?: InitialServerConfig | null,
  gameNumber?: number
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);
  
  // Check if detailed shot tracking data is available
  // Detailed tracking requires both stroke type AND coordinates
  const hasDetailedTracking =
    shot.stroke != null &&
    shot.originX != null &&
    shot.originY != null &&
    shot.landingX != null &&
    shot.landingY != null;

  // Check if this is doubles
  const isDoubles = participants && participants.length === 4;
  
  // Get server and receiver info (always use individual player names)
  const serverInfo = getServerInfo(shot, participants);
  const receiverInfo = getReceiverInfo(shot, participants, serverConfig, gameNumber, currentGameScore);

  // Get winner (player who hit the shot)
  // In simple mode for doubles, use side name instead of individual player name
  // because we don't know which specific player scored
  let winnerName = "Unknown";
  
  // In simple mode (no detailed tracking) for doubles, use side name
  if (!hasDetailedTracking && isDoubles) {
    const winnerSide = shot.side as string;
    if (winnerSide === "side1" || winnerSide === "team1") {
      winnerName = side1Name || "Side 1";
    } else if (winnerSide === "side2" || winnerSide === "team2") {
      winnerName = side2Name || "Side 2";
    }
  } else {
    // In detailed mode or singles, show individual player name
    const winnerId = typeof shot.player === 'string' ? shot.player : shot.player._id?.toString() || null;
    
    if (participants && winnerId) {
      const winnerIndex = participants.findIndex(p => {
        const pid = typeof p === 'string' ? p : p._id?.toString();
        return pid === winnerId;
      });
      
      if (winnerIndex !== -1) {
        const winner = participants[winnerIndex];
        const winnerObj = typeof winner === 'string' ? null : winner;
        winnerName = winnerObj?.fullName || winnerObj?.username || "Unknown";
      }
    } else {
      const playerObj = typeof shot.player === 'string' ? null : shot.player;
      winnerName = playerObj?.fullName || playerObj?.username || "Unknown";
    }
  }

  // Build shot description in natural language
  // Format: [shot type lowercase] from [distance], played [line] into [zone]
  // Note: Sectors are omitted from commentary as they're primarily for analytics
  const shotParts: string[] = [];

  // Only add stroke type and placement details if detailed tracking is available
  if (hasDetailedTracking) {
    // Add shot type (lowercase)
    const strokeLower = strokeName.toLowerCase();
    shotParts.push(strokeLower);
    // Add distance descriptor if available (where shot was played from)
    // Only mention distance if the player is hitting from OFF the table
    const distanceDesc = formatDistanceDescriptor(commentary.originZone);
    if (distanceDesc) {
      shotParts.push(`from ${distanceDesc.toLowerCase()}`);
    }
    
    // Add line of play if available, with proper formatting
    if (commentary.line) {
      // Format line: "cross court" -> "cross court", "down the line" -> "down the line", "middle line" -> "middle line"
      shotParts.push(`played ${commentary.line}`);
    }
    
    // Add landing details: focus on specific placement with zones
    const landingDetails: string[] = [];
    
    // Check for extreme corners/edges first
    if (shot.landingX !== null && shot.landingX !== undefined && shot.landingY !== null && shot.landingY !== undefined) {
      const isExtremeLeft = shot.landingX < 12;
      const isExtremeRight = shot.landingX > 88;
      const isExtremeTop = shot.landingY < 12;
      const isExtremeBottom = shot.landingY > 88;
      
        {
        // Use zone for non-extreme placements (lowercase)
        const zoneName = formatZoneName(commentary.zone);
        if (zoneName) {
          landingDetails.push(`into the ${zoneName.toLowerCase()}`);
        }
      }
    } else {
      // Fallback to zone (lowercase)
      const zoneName = formatZoneName(commentary.zone);
      if (zoneName) {
        landingDetails.push(`into the ${zoneName.toLowerCase()}`);
      }
    }
    
    if (landingDetails.length > 0) {
      shotParts.push(landingDetails.join(", "));
    }
  }
  
  // Join shot parts with commas where appropriate
  const shotDescription = shotParts.join(", ");
  
  // Use full name for the player who made the shot
  const winnerDisplayName = winnerName;
  
  // Get game score
  let gameScoreText = "";
  if (currentGameScore !== undefined) {
    // Determine which side won the point
    // Support both individual (side1/side2) and team (team1/team2) matches
    const winnerSide = shot.side as string;
    const isSide1 = winnerSide === "side1" || winnerSide === "team1";
    const winnerScore = isSide1 ? currentGameScore.side1Score : currentGameScore.side2Score;
    const loserScore = isSide1 ? currentGameScore.side2Score : currentGameScore.side1Score;
    
    // Use en dash (–) instead of hyphen (-) for score
    gameScoreText = ` The game score is now <strong>${winnerScore}–${loserScore}</strong>.`;
  }
  
  // Build full commentary in the exact format requested
  // Format: "[Server] serves to [Receiver]. [Winner] wins the point with a [Shot description]. The game score is now [X–Y] in favor of [Winner]."
  let fullCommentary = "";
  
  // Server and receiver info - "serves to" instead of "serving"
  // For doubles, server and receiver are individual players (not both players)
  if (serverInfo && receiverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves to <strong>${receiverInfo.name}</strong>.<br />`;
  } else if (serverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves. `;
  }
  
  // Winner and shot description
  // If detailed tracking is available, include shot description; otherwise just say "wins the point"
  // For doubles in simple mode, we use side names (singular), so use "wins"
  // For doubles in detailed mode, we use individual player names, so use "win"
  const usePluralVerb = isDoubles && hasDetailedTracking;
  if (hasDetailedTracking && shotDescription) {
    fullCommentary += `<strong>${winnerDisplayName}</strong> ${usePluralVerb ? 'win' : 'wins'} the point with a <strong>${shotDescription}</strong>.`;
  } else {
    fullCommentary += `<strong>${winnerDisplayName}</strong> ${usePluralVerb ? 'win' : 'wins'} the point.`;
  }
  
  // Game score
  if (gameScoreText) {
    fullCommentary += gameScoreText;
  }
  
  return fullCommentary;
}

export function getShotPlacementDetails(shot: Shot): {
  label: string;
  value: string;
}[] {
  const commentary = analyzeShotPlacement(shot);
  const details: { label: string; value: string }[] = [];

  // Enhanced fields
  if (commentary.zone)
    details.push({ label: "Zone", value: commentary.zone });

  if (commentary.sector)
    details.push({ label: "Sector", value: commentary.sector });

  if (commentary.line)
    details.push({ label: "Line", value: commentary.line });

  if (commentary.originZone)
    details.push({ label: "Origin Zone", value: commentary.originZone.replace("-", " ") });

  if (commentary.absoluteSector)
    details.push({ label: "Absolute Sector", value: commentary.absoluteSector });

  return details;
}

export function formatStrokeName(stroke?: string | null): string {
  if (!stroke) return "Unknown";

  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}