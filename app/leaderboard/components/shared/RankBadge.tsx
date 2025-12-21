import { Crown } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  variant?: 'featured' | 'list'; // featured for top 3 section, list for rank 4+
}

export function RankBadge({ rank, variant = 'list' }: RankBadgeProps) {
  // Featured variant (top 3 cards)
  if (variant === 'featured') {
    
    
  }

  // List variant (rank 4+)
  return (
    <div
      className="flex items-center justify-center lb-font-primary"
    >
      <span className="text-sm font-medium">{rank}</span>
    </div>
  );
}
