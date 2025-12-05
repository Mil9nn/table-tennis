import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface LeaderboardEmptyProps {
  message: string;
  icon?: React.ReactNode; // optional icon
}

export function LeaderboardEmpty({ message, icon }: LeaderboardEmptyProps) {
  const IconToRender = icon || <GroupWorkIcon className="size-6 text-muted-foreground" />;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-2">{IconToRender}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
