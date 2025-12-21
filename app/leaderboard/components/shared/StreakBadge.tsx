import { Flame, TrendingDown } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isWin = streak > 0;

  return (
    <span
      className="lb-font-primary inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
      style={{
        backgroundColor: isWin ? 'rgba(24, 195, 248, 0.15)' : 'rgba(50, 49, 57, 0.1)',
        color: isWin ? '#18c3f8' : '#ef4444',
      }}
    >
      {isWin ? (
        <Flame className="w-3 h-3" style={{ color: '#18c3f8' }} />
      ) : (
        <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
      )}
      {Math.abs(streak)}
    </span>
  );
}
