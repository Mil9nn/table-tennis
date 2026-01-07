interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  return (
    <span className="text-xs font-medium tabular-nums text-[#353535]">
      {rank}
    </span>
  );
}