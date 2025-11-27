interface MatchScoreSummaryProps {
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  totalPoints: number;
  totalGames: number;
}

export function MatchScoreSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
  totalPoints,
  totalGames,
}: MatchScoreSummaryProps) {
  const isSide1Winning = side1Sets > side2Sets;
  const isSide2Winning = side2Sets > side1Sets;

  return (
    <div className="w-full max-w-sm mx-auto p-2 space-y-2">
      {/* Main Score Section */}
      <div className="flex items-center justify-between">
        {/* Side 1 */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {side1Name}
          </p>
          <p
            className={`text-lg font-semibold ${
              isSide1Winning ? "text-blue-400" : "text-zinc-200"
            }`}
          >
            {side1Sets}
          </p>
        </div>

        {/* Minimal VS */}
        <div className="text-[10px] px-2 text-zinc-500 font-semibold">vs</div>

        {/* Side 2 */}
        <div className="flex-1 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {side2Name}
          </p>
          <p
            className={`text-lg font-semibold ${
              isSide2Winning ? "text-blue-400" : "text-zinc-200"
            }`}
          >
            {side2Sets}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800"></div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-center">
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">Total Points</p>
          <p className="text-sm font-semibold text-white">{totalPoints}</p>
        </div>

        <div className="w-px h-6 bg-zinc-800"></div>

        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">Games Played</p>
          <p className="text-sm font-semibold text-white">{totalGames}</p>
        </div>
      </div>
    </div>
  );
}
