export const shotCategories = {
  drive: [
    { value: "forehand_drive", label: "Forehand Drive" },
    { value: "backhand_drive", label: "Backhand Drive" },
  ],
  topspin: [
    { value: "forehand_topspin", label: "Forehand Topspin" },
    { value: "backhand_topspin", label: "Backhand Topspin" },
  ],
  loop: [
    { value: "forehand_loop", label: "Forehand Loop" },
    { value: "backhand_loop", label: "Backhand Loop" },
  ],
  smash: [
    { value: "forehand_smash", label: "Forehand Smash" },
    { value: "backhand_smash", label: "Backhand Smash" },
  ],
  push: [
    { value: "forehand_push", label: "Forehand Push" },
    { value: "backhand_push", label: "Backhand Push" },
  ],
  chop: [
    { value: "forehand_chop", label: "Forehand Chop" },
    { value: "backhand_chop", label: "Backhand Chop" },
  ],
  flick: [
    { value: "forehand_flick", label: "Forehand Flick" },
    { value: "backhand_flick", label: "Backhand Flick" },
  ],
  block: [
    { value: "forehand_block", label: "Forehand Block" },
    { value: "backhand_block", label: "Backhand Block" },
  ],
  drop: [
    { value: "forehand_drop", label: "Forehand Drop" },
    { value: "backhand_drop", label: "Backhand Drop" },
  ],
  net: [{ value: "net_point", label: "Net Point" }],
  serve: [{ value: "serve_point", label: "Serve Point" }],
};

// constants/constants.ts
export const SHOT_TYPE_COLORS: Record<string, string> = {
  forehand_drive: "#E6194B", // strong red
  backhand_drive: "#F58231", // orange
  forehand_topspin: "#FFC20E", // golden yellow
  backhand_topspin: "#BFEF45", // lime
  forehand_loop: "#3CB44B", // green
  backhand_loop: "#42D4F4", // sky blue
  forehand_smash: "#4363D8", // clean blue
  backhand_smash: "#911EB4", // purple
  forehand_push: "#F032E6", // pink-magenta
  backhand_push: "#FABED4", // soft pink
  forehand_chop: "#469990", // teal
  backhand_chop: "#9A6324", // brown
  forehand_flick: "#800000", // dark red
  backhand_flick: "#808000", // olive
  forehand_block: "#000075", // deep navy
  backhand_block: "#A9A9A9", // dark gray
  forehand_drop: "#82CAFF", // light blue
  backhand_drop: "#AAFFC3", // mint green
  net_point: "#FF6B6B", // coral red
  serve_point: "#4ECDC4", // turquoise
  // Serve type specific colors
  side_spin: "#F94144",
  top_spin: "#F3722C",
  back_spin: "#F8961E",
  mix_spin: "#90BE6D",
  no_spin: "#577590",
};
