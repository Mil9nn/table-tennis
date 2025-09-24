import { Types } from "mongoose";
import { Participant } from "./match.type";

export type Side = "side1" | "side2";

export type Stroke =
  | "forehand_drive"
  | "backhand_drive"
  | "forehand_topspin"
  | "backhand_topspin"
  | "forehand_loop"
  | "backhand_loop"
  | "forehand_smash"
  | "backhand_smash"
  | "forehand_push"
  | "backhand_push"
  | "forehand_chop"
  | "backhand_chop"
  | "forehand_flick"
  | "backhand_flick"
  | "forehand_block"
  | "backhand_block"
  | "forehand_drop"
  | "backhand_drop";

export type ErrorType = "net" | "long" | "serve";

export type Outcome = "winner" | "error" | "let";

export interface Shot {
  _id: string;
  shotNumber?: number;
  player: Participant;
  side: Side;
  shotType?: string | null;
  stroke?: Stroke | null;
  errorType?: ErrorType | null;
  outcome: Outcome;
  server: Participant;
  timestamp?: string;
}
