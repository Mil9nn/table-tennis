import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  // Only show positive streaks
  if (streak <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-1 text-xs font-semibold text-orange-500">
      <Flame className="h-3 w-3 text-orange-500" />
      {streak}
    </span>
  );
}