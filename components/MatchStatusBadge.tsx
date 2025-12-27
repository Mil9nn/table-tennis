import React from "react";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type Props = React.ComponentProps<"span"> & {
  status: MatchStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
};

const STATUS_CONFIG: Record<MatchStatus, { label: string; icon: React.ElementType; className: string }> = {
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    className: "text-gray-600 dark:text-gray-400",
  },
  in_progress: {
    label: "In progress",
    icon: Play,
    className: "text-[#3c6e71] dark:text-[#3c6e71]",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "text-[#284b63] dark:text-[#284b63]",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "text-red-600 dark:text-red-400",
  },
};

const SIZE_MAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function MatchStatusBadge({ status, size = "sm", showIcon = false, className = "", ...props }: Props) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      {...props}
      className={`${SIZE_MAP[size]} inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${cfg.className} ${className}`}
      aria-label={`Match status: ${cfg.label}`}
      title={cfg.label}
    >
      {showIcon ? (
        <span className="inline-flex -ml-0.5">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <span className="whitespace-nowrap capitalize">{cfg.label}</span>
    </span>
  );
}

/*
Usage examples:

<MatchStatusBadge status="scheduled" />
<MatchStatusBadge status="in_progress" size="sm" />
<MatchStatusBadge status="completed" showIcon={false} />

Notes:
- This file expects you to have shadcn's Badge component at `@/components/ui/badge` and lucide-react installed.
- You can tweak the color classes or replace `className` mapping with Badge's `variant` prop if your Badge supports variants.
*/
