import type { Types } from "mongoose";

/** Canonical scoring identifier stored on match points */
export type MatchPointSide = string;

/** Shape returned to clients (matches legacy embedded shot subdocuments) */
export interface MatchShotPayload {
  _id?: Types.ObjectId | string;
  /** Present when loaded from `matchpoints` (for analytics joins). */
  gameNumber?: number;
  /** Team rubbers only */
  teamSubMatchId?: Types.ObjectId | string;
  shotNumber?: number;
  side: MatchPointSide;
  player: Types.ObjectId | string | Record<string, unknown>;
  stroke: string | null;
  serveType: string | null;
  server: Types.ObjectId | string | Record<string, unknown> | null;
  originX?: number;
  originY?: number;
  landingX?: number;
  landingY?: number;
  timestamp: Date | string;
}
