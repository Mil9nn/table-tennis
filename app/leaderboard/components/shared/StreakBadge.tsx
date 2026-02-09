import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  // Only show positive streaks
  if (streak <= 0) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-1 text-xs font-semibold text-cyan-600">
      <Flame className="h-3 w-3 text-cyan-600" />
      {streak}
    </span>
  );
}