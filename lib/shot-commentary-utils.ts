import { Shot } from "@/types/shot.type";

export interface ShotCommentary {
  direction: "down the line" | "across the table" | null;
  depth: "short ball" | "deep ball" | null;
  placement: "edge ball" | null;
  originDistance: "away from the table" | "close to the table" | "over the table" | null;
  netProximity: "close to the net" | null;
}

/* ---------------------------------------------------------
   Helper: Direction logic
   - "Down the line" = shot stays on the same side (left or right)
   - "Across the table" = shot crosses from one side to the other
   - Center line (net) is at X = 50
--------------------------------------------------------- */

function getShotDirection(originX: number, landingX: number): "down the line" | "across the table" {
  // Determine which side of the table each coordinate is on
  const originSide = originX < 50 ? "left" : "right";
  const landingSide = landingX < 50 ? "left" : "right";

  // If both are on the same side, it's down the line
  if (originSide === landingSide) {
    return "down the line";
  }

  // Otherwise, it's across the table
  return "across the table";
}

/* ---------------------------------------------------------
   Main Analyzer
--------------------------------------------------------- */

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
    };
  }

  const commentary: ShotCommentary = {
    direction: null,
    depth: null,
    placement: null,
    originDistance: null,
    netProximity: null,
  };


  commentary.direction = getShotDirection(originX, landingX);

  
  if (landingY < 30) {
    commentary.depth = "short ball";
  } else if (landingY > 70) {
    commentary.depth = "deep ball";
  }

  const edgeThreshold = 10;
  const isNearLeftEdge = landingX < edgeThreshold;
  const isNearRightEdge = landingX > 100 - edgeThreshold;
  const isNearTopEdge = landingY < edgeThreshold;
  const isNearBottomEdge = landingY > 100 - edgeThreshold;

  if (isNearLeftEdge || isNearRightEdge || isNearTopEdge || isNearBottomEdge) {
    commentary.placement = "edge ball";
  }

  const isInsideTable =
    originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100;

  if (isInsideTable) {
    commentary.originDistance = "over the table"; // flicks, pushes, drops
  } else {
    // Calculate distance from nearest table edge (considering both X and Y)
    const distanceX = originX < 0 ? Math.abs(originX) : originX > 100 ? originX - 100 : 0;
    const distanceY = originY < 0 ? Math.abs(originY) : originY > 100 ? originY - 100 : 0;
    const distanceFromTable = Math.max(distanceX, distanceY);

    if (distanceFromTable < 20) {
      commentary.originDistance = "close to the table"; // blocks, counters
    } else {
      commentary.originDistance = "away from the table"; // lobs, deep loops
    }
  }


  // Check lateral proximity to center line (X=50)
  // Note: This checks if the ball lands close to the center line,
  // not the depth proximity to the net
  const distanceFromCenterLine = Math.abs(landingX - 50);
  if (distanceFromCenterLine < 15) {
    commentary.netProximity = "close to the net";
  }

  return commentary;
}

export function generateShotCommentary(
  shot: Shot,
  playerName: string
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  const parts: string[] = [];

  let description = `${playerName} played a ${strokeName}`;

  if (commentary.direction) parts.push(commentary.direction);
  if (commentary.originDistance) parts.push(commentary.originDistance);
  if (commentary.depth) parts.push(commentary.depth);
  if (commentary.placement) parts.push(commentary.placement);
  if (commentary.netProximity) parts.push(`landing ${commentary.netProximity}`);

  if (parts.length > 0) {
    description += " " + parts.join(", ");
  }

  return description;
}

export function generateShortCommentary(shot: Shot): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  const parts: string[] = [strokeName];

  if (commentary.direction) parts.push(commentary.direction);
  if (commentary.originDistance) parts.push(commentary.originDistance);
  if (commentary.depth) parts.push(commentary.depth);
  if (commentary.placement) parts.push(commentary.placement);
  if (commentary.netProximity) parts.push(`landing ${commentary.netProximity}`);

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

  return details;
}

export function formatStrokeName(stroke?: string | null): string {
  if (!stroke) return "Unknown";

  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}