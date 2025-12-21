export function LeaderboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 lb-font-primary">
      <div
        className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
        style={{ borderColor: '#18c3f8', borderTopColor: 'transparent' }}
      />
      <span
        className="text-[0.875rem]"
        style={{ color: '#ccbcbc' }}
      >
        Loading leaderboard...
      </span>
    </div>
  );
}
