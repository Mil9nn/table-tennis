import { Shot } from "@/types/shot.type";

export interface ShotCommentary {
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
} as const;

export function analyzeShotPlacement(shot: Shot): ShotCommentary {
  const { originX, originY, landingX, landingY } = shot;

  if (
    originX == null ||
    originY == null ||
    landingX == null ||
    landingY == null
  ) {
    return {
      direction: null,
      depth: null,
      placement: null,
      originDistance: null,
      netProximity: null,
      centerPlacement: null,
    };
  }

  const commentary: ShotCommentary = {
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
  // STEP 2: Direction (independent check)
  // ============================================================
  commentary.direction = getShotDirection(originX, landingX);

  // ============================================================
  // STEP 3: Net Proximity vs Center Placement (MUTUALLY EXCLUSIVE)
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
  // STEP 4: Edge Detection (independent, but excludes top edge if close to net)
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
  // STEP 5: Depth (only if not conflicting with edge placement)
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
  // STEP 6: Origin Distance (independent check)
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
  const parts: string[] = [];

  // Start with stroke
  parts.push(strokeName);

  // Add direction first (more natural)
  if (commentary.direction) {
    parts.push(commentary.direction);
  }

  // Add origin only if it's not "over the table" (default assumption)
  if (commentary.originDistance && commentary.originDistance !== "over the table") {
    parts.push(`from ${commentary.originDistance}`);
  }

  // Add landing details
  const landingDetails: string[] = [];
  if (commentary.depth) landingDetails.push(commentary.depth);
  if (commentary.placement) landingDetails.push(commentary.placement);
  if (commentary.centerPlacement) landingDetails.push(commentary.centerPlacement);
  if (commentary.netProximity) landingDetails.push(commentary.netProximity);

  if (landingDetails.length > 0) {
    parts.push(`landing ${landingDetails.join(", ")}`);
  }

  // Join with natural flow - use commas between phrases
  return parts.join(", ");
}

export function getShotPlacementDetails(shot: Shot): {
  label: string;
  value: string;
}[] {
  const commentary = analyzeShotPlacement(shot);
  const details: { label: string; value: string }[] = [];

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