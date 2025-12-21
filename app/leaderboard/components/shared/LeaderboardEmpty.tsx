import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface LeaderboardEmptyProps {
  message: string;
  subtext?: string;
  icon?: React.ReactNode;
}

export function LeaderboardEmpty({ message, subtext, icon }: LeaderboardEmptyProps) {
  const IconToRender = icon || (
    <GroupWorkIcon
      className="size-16"
      style={{ color: 'rgba(204, 188, 188, 0.5)' }}
    />
  );

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3 lb-font-primary">
      <div>{IconToRender}</div>
      <p
        className="text-[1.125rem] font-semibold"
        style={{ color: '#323139' }}
      >
        {message}
      </p>
      {subtext && (
        <p
          className="text-[0.875rem]"
          style={{ color: '#ccbcbc' }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
