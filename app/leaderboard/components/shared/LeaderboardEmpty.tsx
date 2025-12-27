import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface LeaderboardEmptyProps {
  message: string;
  subtext?: string;
  icon?: React.ReactNode;
}

/**
 * Internal empty state for leaderboard list sections
 * For full-screen empty states, use LeaderboardEmptyState instead
 */
export function LeaderboardEmpty({ message, subtext, icon }: LeaderboardEmptyProps) {
  const IconToRender = icon || (
    <GroupWorkIcon
      className="size-14"
      style={{ color: 'rgba(217, 217, 217, 0.5)' }}
    />
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-2">
      <div className="mb-1">{IconToRender}</div>
      <p
        className="text-base font-semibold"
        style={{ color: '#353535' }}
      >
        {message}
      </p>
      {subtext && (
        <p
          className="text-sm max-w-sm"
          style={{ color: '#d9d9d9' }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
