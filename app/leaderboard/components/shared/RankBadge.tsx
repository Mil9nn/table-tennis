interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  return (
    <span className="text-sm font-medium tabular-nums text-[#353535]">
      {rank}
    </span>
  );
}