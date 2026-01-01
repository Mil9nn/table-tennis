import { ServeType, Stroke } from "./shot.type";
import { Side } from "./shot.type";

export type SelectionStep = "player" | "shot" | "serveType" | "origin" | "landing";

export interface ShotSelectorState {
  currentStep: SelectionStep;
  selectedShot: Stroke | null;
  selectedServeType: ServeType | null;
  originPoint: { x: number; y: number } | null;
  landingPoint: { x: number; y: number } | null;
  isSubmitting: boolean;
  error: string | null;
}

export type ShotSelectorAction =
  | { type: "SET_STEP"; step: SelectionStep }
  | { type: "SELECT_SHOT"; shot: Stroke }
  | { type: "SELECT_SERVE_TYPE"; serveType: ServeType }
  | { type: "SET_ORIGIN"; point: { x: number; y: number } }
  | { type: "SET_LANDING"; point: { x: number; y: number } }
  | { type: "GO_BACK" }
  | { type: "RESET" }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CLEAR_ERROR" };

export interface ShotData {
  originX: number;
  originY: number;
  landingX: number;
  landingY: number;
  serveType?: ServeType | null;
}

export interface ShotSelectorProps {
  pendingPlayer: { side: Side; playerId?: string } | null;
  players: Array<{ _id: string; fullName?: string; username?: string } | string>;
  needsPlayerSelection: boolean;
  onClose: () => void;
  onSubmit: (shotData: ShotData) => Promise<void>;
}


