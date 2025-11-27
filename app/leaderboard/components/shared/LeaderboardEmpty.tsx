import { Trophy } from "lucide-react";

interface LeaderboardEmptyProps {
  message: string;
}

export function LeaderboardEmpty({ message }: LeaderboardEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Play matches to appear on the leaderboard
      </p>
    </div>
  );
}
