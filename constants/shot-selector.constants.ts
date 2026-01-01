import { SelectionStep } from "@/types/shot-selector.types";
import { ServeType } from "@/types/shot.type";
import {
  RotateCw,
  Target,
  MapPin,
  User,
  Zap,
  Shield,
  Circle,
  ArrowRight,
} from "lucide-react";

export const STEP_ORDER: SelectionStep[] = [
  "player",
  "shot",
  "serveType",
  "origin",
  "landing",
];

export const STEP_CONFIG: Record<
  SelectionStep,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
  }
> = {
  player: {
    label: "Select Player",
    description: "Choose the player who scored",
    icon: User,
    order: 0,
  },
  shot: {
    label: "Select Shot",
    description: "Choose the type of shot played",
    icon: Zap,
    order: 1,
  },
  serveType: {
    label: "Serve Type",
    description: "Select the type of serve",
    icon: RotateCw,
    order: 2,
  },
  origin: {
    label: "Shot Origin",
    description: "Click where the shot originated",
    icon: Target,
    order: 3,
  },
  landing: {
    label: "Ball Landing",
    description: "Click where the ball landed",
    icon: MapPin,
    order: 4,
  },
};

export const SERVE_TYPES: Array<{
  value: ServeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "side_spin",
    label: "Side-spin Serve",
    description: "Ball spins sideways",
    icon: RotateCw,
  },
  {
    value: "top_spin",
    label: "Top-spin Serve",
    description: "Forward rotation",
    icon: ArrowRight,
  },
  {
    value: "back_spin",
    label: "Back-spin Serve",
    description: "Backward rotation",
    icon: Shield,
  },
  {
    value: "mix_spin",
    label: "Mix-spin Serve",
    description: "Combined rotation",
    icon: Circle,
  },
  {
    value: "no_spin",
    label: "No-spin Serve",
    description: "No rotation",
    icon: Circle,
  },
];

export function getStepIndex(step: SelectionStep): number {
  return STEP_CONFIG[step].order;
}

export function getTotalSteps(needsPlayerSelection: boolean, isServe: boolean): number {
  let steps = 3; // shot, origin, landing (base)
  if (needsPlayerSelection) steps += 1; // player
  if (isServe) steps += 1; // serveType
  return steps;
}


