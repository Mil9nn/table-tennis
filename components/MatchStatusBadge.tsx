import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type Props = React.ComponentProps<typeof Badge> & {
  status: MatchStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
};

const STATUS_CONFIG: Record<MatchStatus, { label: string; icon: React.ElementType; className: string }> = {
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-800 ring-2 ring-yellow-200",
  },
  in_progress: {
    label: "In progress",
    icon: Play,
    className: "bg-blue-50 text-blue-800 ring-2 ring-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-green-50 text-green-800 ring-2 ring-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-800 ring-2 ring-red-200",
  },
};

const SIZE_MAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function MatchStatusBadge({ status, size = "md", showIcon = true, className = "", ...props }: Props) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <Badge
      {...props}
      className={`${SIZE_MAP[size]} inline-flex items-center gap-2 rounded-full font-medium ${cfg.className} ${className}`}
      aria-label={`Match status: ${cfg.label}`}
      title={cfg.label}
    >
      {showIcon ? (
        <span className="inline-flex -ml-0.5">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <span className="whitespace-nowrap capitalize">{cfg.label}</span>
    </Badge>
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
