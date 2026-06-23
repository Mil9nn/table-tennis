export function LeaderboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
        style={{ borderColor: '#3c6e71', borderTopColor: 'transparent' }}
      />
      <span
        className="text-sm font-medium"
        style={{ color: '#d9d9d9' }}
      >
        Loading leaderboard...
      </span>
    </div>
  );
}
