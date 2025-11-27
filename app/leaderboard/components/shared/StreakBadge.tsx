import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isWin = streak > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isWin ? "text-emerald-600" : "text-rose-600"
      )}
    >
      <Flame className="w-3 h-3" />
      {Math.abs(streak)}
    </span>
  );
}
