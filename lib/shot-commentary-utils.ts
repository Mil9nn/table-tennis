import { Shot } from "@/types/shot.type";
import { Participant } from "@/types/match.type";

export interface ShotCommentary {
  // New enhanced fields
  zone: "short" | "mid" | "deep" | null;
  sector: "backhand" | "crossover" | "forehand" | null;
  line: "down the line" | "cross court" | "middle line" | null;
  originZone: "close-to-table" | "mid-distance" | "far-distance" | null;
  // Legacy fields (for backward compatibility)
  direction: "down the line" | "across the table" | null;
  depth: "short ball" | "deep ball" | null;
  placement: "edge ball" | null;
  originDistance: "away from the table" | "close to the table" | "over the table" | null;
  netProximity: "close to the net" | null;
  centerPlacement: "down the middle" | null;
}

/* ---------------------------------------------------------
   Helper: Direction logic
   - "Down the line" = shot stays on the same side (left or right)
   - "Across the table" = shot crosses from one side to the other
   - Center line (net) is at X = 50
--------------------------------------------------------- */

function getShotDirection(originX: number, landingX: number): "down the line" | "across the table" {
  // Determine which side of the table each coordinate is on
  // Use <= 50 for left to handle exactly 50 as center (neutral)
  const originSide = originX <= 50 ? "left" : "right";
  const landingSide = landingX <= 50 ? "left" : "right";

  // If both are on the same side, it's down the line
  if (originSide === landingSide) {
    return "down the line";
  }

  // Otherwise, it's across the table
  return "across the table";
}

/* ---------------------------------------------------------
   Enhanced Analysis Functions
--------------------------------------------------------- */

/**
 * Determine zone based on landing X coordinate (horizontal)
 * Zones: Deep (closest to player) | Mid | Short (closest to net)
 * Left side: Deep (0-16.67) | Mid (16.67-33.33) | Short (33.33-50)
 * Right side: Short (50-66.67) | Mid (66.67-83.33) | Deep (83.33-100)
 */
function getZone(landingX: number, receivingSide?: "side1" | "side2"): "short" | "mid" | "deep" | null {
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
function getSector(
  landingY: number, 
  receivingSide?: "side1" | "side2",
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
  
  // For right side player (side2), flip backhand/forehand
  // Right side: Forehand (top) | Crossover (middle) | Backhand (bottom)
  if (receivingSide === "side2") {
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
 * Determine line of play based on shot trajectory
 * Lines: Down the line (parallel to long sides), Cross court (diagonal), Middle line (between)
 */
function getLine(originX: number, originY: number, landingX: number, landingY: number): "down the line" | "cross court" | "middle line" | null {
  // Determine which side of table origin and landing are on
  const originSide = originX <= 50 ? "left" : "right";
  const landingSide = landingX <= 50 ? "left" : "right";
  
  // Calculate horizontal and vertical distances
  const deltaX = Math.abs(landingX - originX);
  const deltaY = Math.abs(landingY - originY);
  
  // Calculate the angle of the shot trajectory
  // Angle in degrees: 0 = horizontal, 90 = vertical
  const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
  
  // Down the line: ball travels parallel to long sides (same X side, mostly vertical movement)
  if (originSide === landingSide) {
    // If same side and angle is close to vertical (mostly Y movement, little X movement)
    if (angle > 60 || deltaX < 15) {
      return "down the line";
    }
    // Same side but more horizontal movement = middle line
    return "middle line";
  }
  
  // Cross court: ball travels diagonally (opposite X sides, diagonal angle)
  if (originSide !== landingSide) {
    // Diagonal shot: angle between 30-60 degrees indicates cross court
    if (angle > 25 && angle < 65) {
      return "cross court";
    }
    // If crossing sides but angle is too steep or too shallow, it's middle line
    return "middle line";
  }
  
  // Default to middle line for ambiguous cases
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
  ORIGIN_CLOSE_TO_TABLE: 20,   // Distance from table edge for "close to table"
  // Zone thresholds (horizontal/X-based): Deep | Mid | Short on each side
  ZONE_DEEP_LEFT: 16.67,       // Left side: Deep zone (0-16.67)
  ZONE_MID_LEFT: 33.33,        // Left side: Mid zone (16.67-33.33)
  ZONE_SHORT_LEFT: 50,         // Left side: Short zone (33.33-50)
  ZONE_SHORT_RIGHT: 66.67,     // Right side: Short zone (50-66.67)
  ZONE_MID_RIGHT: 83.33,       // Right side: Mid zone (66.67-83.33)
  ZONE_DEEP_RIGHT: 100,        // Right side: Deep zone (83.33-100)
  // Sector thresholds (vertical/Y-based): Backhand | Crossover | Forehand
  SECTOR_BACKHAND: 33.33,      // Y < 33.33% = Backhand (for left side player)
  SECTOR_CROSSOVER: 66.67,     // Y 33.33-66.67% = Crossover
  SECTOR_FOREHAND: 66.67,      // Y > 66.67% = Forehand (for left side player)
  ORIGIN_CLOSE_Y: 33.33,       // originY < 33.33% = Close-to-Table
  ORIGIN_FAR_Y: 66.67,         // originY > 66.67% = Far-distance
  ORIGIN_DISTANCE_CLOSE: 20,   // Distance from table < 20 = Close-to-Table
  ORIGIN_DISTANCE_MID: 40,     // Distance from table 20-40 = Mid-distance
  LINE_ANGLE_THRESHOLD: 15,    // Angle threshold for middle line (degrees)
} as const;

export function analyzeShotPlacement(shot: Shot, receivingSide?: "side1" | "side2"): ShotCommentary {
  const { originX, originY, landingX, landingY, side } = shot;

  if (
    originX == null ||
    originY == null ||
    landingX == null ||
    landingY == null
  ) {
    return {
      zone: null,
      sector: null,
      line: null,
      originZone: null,
      direction: null,
      depth: null,
      placement: null,
      originDistance: null,
      netProximity: null,
      centerPlacement: null,
    };
  }

  const commentary: ShotCommentary = {
    // New enhanced fields
    zone: null,
    sector: null,
    line: null,
    originZone: null,
    // Legacy fields
    direction: null,
    depth: null,
    placement: null,
    originDistance: null,
    netProximity: null,
    centerPlacement: null,
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
  
  // Sector (landing position - vertical/Y-based, relative to receiving player, default right-handed)
  commentary.sector = getSector(landingY, shotReceivingSide, false);
  
  // Line (shot trajectory)
  commentary.line = getLine(originX, originY, landingX, landingY);
  
  // Origin Zone (where shot was played from)
  commentary.originZone = getOriginZone(originX, originY);

  // ============================================================
  // STEP 3: Direction (legacy - independent check)
  // ============================================================
  commentary.direction = getShotDirection(originX, landingX);

  // ============================================================
  // STEP 4: Net Proximity vs Center Placement (MUTUALLY EXCLUSIVE)
  // Priority: "close to the net" > "down the middle"
  // ============================================================
  if (isNearCenter && isInFrontHalf) {
    // Ball near center AND in front half = "close to the net"
    commentary.netProximity = "close to the net";
  } else if (isNearCenter && !isInFrontHalf) {
    // Ball near center BUT in back half = "down the middle"
    commentary.centerPlacement = "down the middle";
  }

  // ============================================================
  // STEP 5: Edge Detection (independent, but excludes top edge if close to net)
  // ============================================================
  const isCloseToNet = commentary.netProximity !== null;
  const isEdgeBall = 
    isNearLeftEdge || 
    isNearRightEdge || 
    isNearBottomEdge || 
    (isNearTopEdge && !isCloseToNet);
  
  if (isEdgeBall) {
    commentary.placement = "edge ball";
  }

  // ============================================================
  // STEP 6: Depth (legacy - only if not conflicting with edge placement)
  // ============================================================
  const isSideEdgeOnly = (isNearLeftEdge || isNearRightEdge) && !isNearTopEdge && !isNearBottomEdge;
  
  // Only set depth if it's not an edge ball, or if it's only a side edge
  if (!isEdgeBall || isSideEdgeOnly) {
    if (landingY < THRESHOLDS.SHORT_BALL) {
      commentary.depth = "short ball";
    } else if (landingY > THRESHOLDS.DEEP_BALL) {
      commentary.depth = "deep ball";
    }
  }
  
  // Safety check: prevent impossible combinations
  if (isNearBottomEdge && commentary.depth === "short ball") {
    commentary.depth = null;
  }
  if (isNearTopEdge && commentary.depth === "deep ball") {
    commentary.depth = null;
  }

  // ============================================================
  // STEP 7: Origin Distance (legacy - independent check)
  // ============================================================
  const isInsideTable =
    originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100;

  if (isInsideTable) {
    commentary.originDistance = "over the table";
  } else {
    const distanceX = originX < 0 ? Math.abs(originX) : originX > 100 ? originX - 100 : 0;
    const distanceY = originY < 0 ? Math.abs(originY) : originY > 100 ? originY - 100 : 0;
    const distanceFromTable = Math.max(distanceX, distanceY);

    if (distanceFromTable < THRESHOLDS.ORIGIN_CLOSE_TO_TABLE) {
      commentary.originDistance = "close to the table";
    } else {
      commentary.originDistance = "away from the table";
    }
  }

  return commentary;
}

/* ---------------------------------------------------------
   Commentary Generation - Natural Sentence Flow
--------------------------------------------------------- */

export function generateShotCommentary(
  shot: Shot,
  playerName: string
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  // Start with player and stroke
  let description = `${playerName} played a ${strokeName}`;

  // Build natural sentence flow:
  // 1. Origin position (where from) - only if relevant
  // 2. Direction (how the shot was played)
  // 3. Landing details (where to - depth, placement, net proximity)

  const phrases: string[] = [];

  // Add direction first (more natural flow)
  if (commentary.direction) {
    phrases.push(commentary.direction);
  }

  // Add origin position only if it's not "over the table" (default assumption)
  // This avoids redundant "from over the table" when it's obvious
  if (commentary.originDistance && commentary.originDistance !== "over the table") {
    phrases.push(`from ${commentary.originDistance}`);
  }

  // Build landing description
  const landingParts: string[] = [];
  
  if (commentary.depth) {
    landingParts.push(commentary.depth);
  }
  
  if (commentary.placement) {
    landingParts.push(commentary.placement);
  }
  
  if (commentary.centerPlacement) {
    landingParts.push(commentary.centerPlacement);
  }
  
  if (commentary.netProximity) {
    landingParts.push(commentary.netProximity);
  }

  if (landingParts.length > 0) {
    phrases.push(`landing ${landingParts.join(", ")}`);
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
  // Format: [Shot type] played [origin distance], [line], hitting [sector] sector in [zone] zone
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
  } else if (commentary.originDistance && commentary.originDistance !== "over the table") {
    parts.push(`played ${commentary.originDistance}`);
  }

  // Add line (trajectory)
  if (commentary.line) {
    parts.push(commentary.line);
  }

  // Add landing details: hitting [sector] sector in [zone] zone
  const landingParts: string[] = [];
  if (commentary.sector) {
    // Convert "crossover" to "central" for better readability
    const sectorName = commentary.sector === "crossover" ? "central" : commentary.sector;
    landingParts.push(`${sectorName} sector`);
  }
  if (commentary.zone) {
    landingParts.push(`${commentary.zone} zone`);
  }
  
  if (landingParts.length > 0) {
    parts.push(`hitting ${landingParts.join(" in ")}`);
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
    const server = participants.find(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === serverId;
    });
    
    if (server) {
      const serverObj = typeof server === 'string' ? null : server;
      return {
        name: serverObj?.fullName || serverObj?.username || "Unknown",
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
 * Helper function to get receiver information (opposite side of server)
 * The receiver is on the opposite side of the server
 */
function getReceiverInfo(shot: Shot, participants?: Participant[]): { name: string; id: string | null } | null {
  if (!shot.server || !participants || participants.length === 0) return null;
  
  const serverId = typeof shot.server === 'string' ? shot.server : shot.server._id?.toString() || null;
  if (!serverId) return null;
  
  // Find server to determine which side they're on
  const serverIndex = participants.findIndex(p => {
    const pid = typeof p === 'string' ? p : p._id?.toString();
    return pid === serverId;
  });
  
  if (serverIndex === -1) return null;
  
  // Determine which side server is on
  // Side1 = indices 0,1 (or 0 for singles); Side2 = indices 2,3 (or 1 for singles)
  const isServerSide1 = participants.length === 2 ? serverIndex === 0 : serverIndex < 2;
  
  // Receiver is on opposite side
  let receiver: Participant | null = null;
  
  if (participants.length === 2) {
    // Singles: receiver is the other player
    receiver = participants[serverIndex === 0 ? 1 : 0] || null;
  } else if (participants.length === 4) {
    // Doubles: receiver is on opposite side (pick first player of opposite side)
    receiver = isServerSide1 ? (participants[2] || null) : (participants[0] || null);
  }
  
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
  currentGameScore?: { side1Score: number; side2Score: number }
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);
  
  // Get server and receiver info
  const serverInfo = getServerInfo(shot, participants);
  const receiverInfo = getReceiverInfo(shot, participants);
  
  // Get winner (player who hit the shot)
  const winnerId = typeof shot.player === 'string' ? shot.player : shot.player._id?.toString() || null;
  let winnerName = "Unknown";
  if (participants && winnerId) {
    const winner = participants.find(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === winnerId;
    });
    const winnerObj = typeof winner === 'string' ? null : winner;
    winnerName = winnerObj?.fullName || winnerObj?.username || "Unknown";
  } else {
    const playerObj = typeof shot.player === 'string' ? null : shot.player;
    winnerName = playerObj?.fullName || playerObj?.username || "Unknown";
  }
  
  // Build shot description in natural language
  // Format: [sector lowercase] [shot type lowercase] from [distance], played [line] into [zone]
  const shotParts: string[] = [];
  
  // Add sector first (lowercase), then shot type (lowercase)
  // Only add sector if it's not redundant with the stroke name
  const sectorName = formatSectorName(commentary.sector);
  const strokeLower = strokeName.toLowerCase();
  
  // Check if stroke already contains the sector (e.g., "forehand topspin" already has "forehand")
  const strokeHasSector = sectorName && strokeLower.includes(sectorName.toLowerCase());
  
  if (sectorName && !strokeHasSector) {
    shotParts.push(sectorName.toLowerCase());
  }
  
  shotParts.push(strokeLower);
  
  // Add distance descriptor if available (where shot was played from)
  // Only mention distance if the player is hitting from OFF the table
  const distanceDesc = formatDistanceDescriptor(commentary.originZone);
  if (distanceDesc) {
    shotParts.push(`from ${distanceDesc.toLowerCase()}`);
  }
  
  // Add line of play if available, with proper formatting
  if (commentary.line) {
    // Format line: "cross court" -> "cross-court", "down the line" -> "down the line", "middle line" -> "middle line"
    let lineFormatted = commentary.line;
    if (commentary.line === "cross court") {
      lineFormatted = "cross-court";
    }
    shotParts.push(`played ${lineFormatted}`);
  }
  
  // Add landing details: focus on specific placement with zones
  const landingDetails: string[] = [];
  
  // Check for extreme corners/edges first
  if (shot.landingX !== null && shot.landingX !== undefined && shot.landingY !== null && shot.landingY !== undefined) {
    const isExtremeLeft = shot.landingX < 12;
    const isExtremeRight = shot.landingX > 88;
    const isExtremeTop = shot.landingY < 12;
    const isExtremeBottom = shot.landingY > 88;
    
    if (isExtremeLeft && isExtremeTop) {
      landingDetails.push("into the extreme left corner of the table");
    } else if (isExtremeRight && isExtremeTop) {
      landingDetails.push("into the extreme right corner of the table");
    } else if (isExtremeLeft && isExtremeBottom) {
      landingDetails.push("into the extreme left corner (deep) of the table");
    } else if (isExtremeRight && isExtremeBottom) {
      landingDetails.push("into the extreme right corner (deep) of the table");
    } else if (isExtremeLeft) {
      landingDetails.push("into the extreme left side of the table");
    } else if (isExtremeRight) {
      landingDetails.push("into the extreme right side of the table");
    } else if (isExtremeTop) {
      landingDetails.push("close to the net");
    } else if (isExtremeBottom) {
      landingDetails.push("deep on the table");
    } else {
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
  
  // Join shot parts with commas where appropriate
  const shotDescription = shotParts.join(", ");
  
  // Determine winner's first name for score display
  const winnerFirstName = winnerName.split(" ")[0];
  
  // Get game score
  let gameScoreText = "";
  if (currentGameScore !== undefined) {
    // Determine which side won the point
    const winnerSide = shot.side;
    const winnerScore = winnerSide === "side1" ? currentGameScore.side1Score : currentGameScore.side2Score;
    const loserScore = winnerSide === "side1" ? currentGameScore.side2Score : currentGameScore.side1Score;
    const winnerFullName = winnerSide === "side1" ? (side1Name || "Player 1") : (side2Name || "Player 2");
    
    // Use en dash (–) instead of hyphen (-) for score
    gameScoreText = ` The game score is now <strong>${winnerScore}–${loserScore}</strong> in favor of <strong>${winnerFullName}</strong>.`;
  }
  
  // Build full commentary in the exact format requested
  // Format: "[Server] serves to [Receiver]. [Winner] wins the point with a [Shot description]. The game score is now [X–Y] in favor of [Winner]."
  let fullCommentary = "";
  
  // Server and receiver info - "serves to" instead of "serving"
  if (serverInfo && receiverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves to <strong>${receiverInfo.name}</strong>. `;
  } else if (serverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves. `;
  }
  
  // Winner and shot description - "wins the point with a" instead of "wins the point by"
  fullCommentary += `<strong>${winnerFirstName}</strong> wins the point with a <strong>${shotDescription}</strong>.`;
  
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

  // New enhanced fields
  if (commentary.zone)
    details.push({ label: "Zone", value: commentary.zone });

  if (commentary.sector)
    details.push({ label: "Sector", value: commentary.sector });

  if (commentary.line)
    details.push({ label: "Line", value: commentary.line });

  if (commentary.originZone)
    details.push({ label: "Origin Zone", value: commentary.originZone.replace("-", " ") });

  // Legacy fields (for backward compatibility)
  if (commentary.direction)
    details.push({ label: "Direction", value: commentary.direction });

  if (commentary.depth)
    details.push({ label: "Depth", value: commentary.depth });

  if (commentary.placement)
    details.push({ label: "Placement", value: commentary.placement });

  if (commentary.originDistance)
    details.push({ label: "Origin", value: commentary.originDistance });

  if (commentary.netProximity)
    details.push({ label: "Net Proximity", value: commentary.netProximity });

  if (commentary.centerPlacement)
    details.push({ label: "Center Placement", value: commentary.centerPlacement });

  return details;
}

export function formatStrokeName(stroke?: string | null): string {
  if (!stroke) return "Unknown";

  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}