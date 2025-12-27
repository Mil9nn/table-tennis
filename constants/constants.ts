export const shotCategories = {
  drive: {
    intent: "attack",
    shots: [
      { value: "forehand_drive", label: "Forehand Drive" },
      { value: "backhand_drive", label: "Backhand Drive" },
    ],
  },
  topspin: {
    intent: "pressure",
    shots: [
      { value: "forehand_topspin", label: "Forehand Topspin" },
      { value: "backhand_topspin", label: "Backhand Topspin" },
    ],
  },
  loop: {
    intent: "pressure",
    shots: [
      { value: "forehand_loop", label: "Forehand Loop" },
      { value: "backhand_loop", label: "Backhand Loop" },
    ],
  },
  smash: {
    intent: "attack",
    shots: [
      { value: "forehand_smash", label: "Forehand Smash" },
      { value: "backhand_smash", label: "Backhand Smash" },
    ],
  },
  push: {
    intent: "control",
    shots: [
      { value: "forehand_push", label: "Forehand Push" },
      { value: "backhand_push", label: "Backhand Push" },
    ],
  },
  chop: {
    intent: "defense",
    shots: [
      { value: "forehand_chop", label: "Forehand Chop" },
      { value: "backhand_chop", label: "Backhand Chop" },
    ],
  },
  flick: {
    intent: "accent",
    shots: [
      { value: "forehand_flick", label: "Forehand Flick" },
      { value: "backhand_flick", label: "Backhand Flick" },
    ],
  },
  block: {
    intent: "defense",
    shots: [
      { value: "forehand_block", label: "Forehand Block" },
      { value: "backhand_block", label: "Backhand Block" },
    ],
  },
  drop: {
    intent: "control",
    shots: [
      { value: "forehand_drop", label: "Forehand Drop" },
      { value: "backhand_drop", label: "Backhand Drop" },
    ],
  },
  net: {
    intent: "error",
    shots: [{ value: "net_point", label: "Net Point" }],
  },
  serve: {
    intent: "serve",
    shots: [{ value: "serve_point", label: "Serve Point" }],
  },
};

// constants/constants.ts

export const SHOT_TYPE_COLORS: Record<string, string> = {
  // Attack (drives, smashes)
  forehand_drive: "#DC2626",
  backhand_drive: "#DC2626",
  forehand_smash: "#DC2626",
  backhand_smash: "#DC2626",

  // Pressure (topspin, loop)
  forehand_topspin: "#F59E0B",
  backhand_topspin: "#F59E0B",
  forehand_loop: "#F59E0B",
  backhand_loop: "#F59E0B",

  // Control (push, drop)
  forehand_push: "#16A34A",
  backhand_push: "#16A34A",
  forehand_drop: "#16A34A",
  backhand_drop: "#16A34A",

  // Defense (block, chop)
  forehand_block: "#2563EB",
  backhand_block: "#2563EB",
  forehand_chop: "#2563EB",
  backhand_chop: "#2563EB",

  // Accent (flicks)
  forehand_flick: "#7C3AED",
  backhand_flick: "#7C3AED",

  // Special cases (neutralized)
  net_point: "#9CA3AF",   // neutral gray
  serve_point: "#64748B", // slate
};


