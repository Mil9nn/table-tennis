import { Crown } from "lucide-react";

interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
        <Crown className="w-4 h-4 text-amber-600" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-600">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="text-sm font-semibold text-orange-700">3</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <span className="text-sm text-muted-foreground">{rank}</span>
    </div>
  );
}
